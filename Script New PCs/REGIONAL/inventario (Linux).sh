#!/usr/bin/env bash
# ============================================================================
# Script de inventario de hardware — CMDB SENA SEDE REGIONAL (Linux)
# Detecta hardware con multiples metodos de fallback y abre el navegador
# con los datos para autorellenar el formulario.
#
# USO: bash inventario.sh  (funciona en cualquier distro Linux con bash)
# ============================================================================

set -euo pipefail

CMDB_URL="https://next-js-cmdb.vercel.app"
CMDB_KEY="SENA2026_"
SEDE="REGIONAL"

# ========================================================================
# AUXILIARES
# ========================================================================
urlencode() {
    local s="$1" l=${#s} e="" p c o
    for (( p=0; p<l; p++ )); do
        c="${s:$p:1}"
        case "$c" in [-_.~a-zA-Z0-9]) o="$c" ;; *) printf -v o '%%%02x' "'$c" ;; esac
        e+="$o"
    done
    echo "$e"
}
norm_mac() { local r="$1"; [[ -z "$r" ]] && { echo ""; return; }; echo "$r" | tr -d ' \t\n\r' | tr '[:lower:]' '[:upper:]' | tr '-' ':'; }
have() { command -v "$1" &>/dev/null; }

# ========================================================================
# DETECCIONES — cada una con fallback por capas
# ========================================================================

hostname() {
    local h
    h=$(command hostname -s 2>/dev/null) && { echo "$h" | tr '[:lower:]' '[:upper:]'; return; }
    h=$(command hostname 2>/dev/null) && { echo "$h" | tr '[:lower:]' '[:upper:]'; return; }
    [[ -f /etc/hostname ]] && h=$(head -1 /etc/hostname 2>/dev/null) && [[ -n "$h" ]] && { echo "$h" | tr '[:lower:]' '[:upper:]'; return; }
    have hostnamectl && h=$(hostnamectl --static 2>/dev/null) && [[ -n "$h" ]] && { echo "$h" | tr '[:lower:]' '[:upper:]'; return; }
    echo "DESCONOCIDO"
}

marca() {
    local v
    for p in /sys/class/dmi/id/sys_vendor /sys/devices/virtual/dmi/id/sys_vendor; do
        [[ -f "$p" ]] && v=$(cat "$p" 2>/dev/null) && [[ -n "$v" && "$v" != "To Be Filled By O.E.M." && "$v" != "Default string" ]] && { echo "$v"; return; }
    done
    have dmidecode && v=$(sudo dmidecode -s system-manufacturer 2>/dev/null) && [[ -n "$v" && "$v" != "To Be Filled By O.E.M." && "$v" != "Default string" ]] && { echo "$v"; return; }
    echo ""
}

modelo() {
    local v
    for p in /sys/class/dmi/id/product_name /sys/devices/virtual/dmi/id/product_name; do
        [[ -f "$p" ]] && v=$(cat "$p" 2>/dev/null) && [[ -n "$v" && "$v" != "To Be Filled By O.E.M." && "$v" != "Default string" ]] && { echo "$v"; return; }
    done
    have dmidecode && v=$(sudo dmidecode -s system-product-name 2>/dev/null) && [[ -n "$v" && "$v" != "To Be Filled By O.E.M." && "$v" != "Default string" ]] && { echo "$v"; return; }
    echo ""
}

serial() {
    local v
    val_ok() { local s="$1"; [[ -z "$s" ]] && return 1; [[ "$s" =~ ^(To Be Filled|System Serial|Not Applicable|Default|1234567890|Not Available|NONE|None|OEM.*|SystemSerial|NotAvailable|INVALID)$ ]] && return 1; return 0; }
    for p in /sys/class/dmi/id/product_serial /sys/devices/virtual/dmi/id/product_serial; do
        [[ -f "$p" ]] && v=$(cat "$p" 2>/dev/null) && val_ok "$v" && { echo "$v"; return; }
    done
    for p in /sys/class/dmi/id/product_uuid /sys/devices/virtual/dmi/id/product_uuid; do
        [[ -f "$p" ]] && v=$(cat "$p" 2>/dev/null) && [[ -n "$v" && "$v" != "Not Settable" ]] && { echo "$v"; return; }
    done
    have dmidecode && v=$(sudo dmidecode -s system-serial-number 2>/dev/null) && val_ok "$v" && { echo "$v"; return; }
    echo ""
}

cpu() {
    local v
    [[ -f /proc/cpuinfo ]] && v=$(grep -m1 "model name" /proc/cpuinfo 2>/dev/null | cut -d: -f2 | sed 's/^ *//') && [[ -n "$v" ]] && { echo "$v"; return; }
    have lscpu && v=$(lscpu 2>/dev/null | grep -i "Model name" | cut -d: -f2 | sed 's/^ *//' | head -1) && [[ -n "$v" ]] && { echo "$v"; return; }
    echo ""
}

ram_bytes() {
    local mk
    [[ -f /proc/meminfo ]] && mk=$(awk '/^MemTotal:/{print $2}' /proc/meminfo 2>/dev/null) && [[ -n "$mk" && "$mk" -gt 0 ]] && { echo $((mk * 1024)); return; }
    have free && mk=$(free -b 2>/dev/null | awk '/^Mem:/{print $2}') && [[ -n "$mk" && "$mk" -gt 0 ]] && { echo "$mk"; return; }
    echo 0
}
ram_norm() {
    local b=$1 g
    g=$(( (b + 500000000) / 1000000000 ))
    [[ "$b" -le 0 ]] && { echo ""; return; }
    if   [[ "$g" -le 5 ]];   then echo "4 GB"
    elif [[ "$g" -le 10 ]];  then echo "8 GB"
    elif [[ "$g" -le 18 ]];  then echo "16 GB"
    elif [[ "$g" -le 36 ]];  then echo "32 GB"
    elif [[ "$g" -le 72 ]];  then echo "64 GB"
    elif [[ "$g" -le 140 ]]; then echo "128 GB"
    else echo "${g} GB"; fi
}

tipo_mem() {
    local v
    have dmidecode && v=$(sudo dmidecode -t memory 2>/dev/null | grep -i "^[[:space:]]*Type:" | head -1 | sed 's/^[[:space:]]*Type:[[:space:]]*//') || v=""
    case "$v" in DDR|DDR2|DDR3|DDR4|DDR5) echo "$v"; return ;; esac
    echo ""
}

video() {
    local v
    have lspci && v=$(lspci 2>/dev/null | grep -iE "VGA|3D|Display" | head -1 | sed 's/.*: //') && [[ -n "$v" ]] && { echo "$v"; return; }
    have glxinfo && v=$(glxinfo 2>/dev/null | grep "OpenGL renderer" | sed 's/.*: //') && [[ -n "$v" ]] && { echo "$v"; return; }
    echo ""
}

so() {
    local v n i
    if [[ -f /etc/os-release ]]; then
        v=$(grep -oP 'PRETTY_NAME="\K[^"]+' /etc/os-release 2>/dev/null || grep -oP 'PRETTY_NAME=\K[^"]+' /etc/os-release 2>/dev/null || true)
        [[ -z "$v" ]] && { n=$(grep -oP 'NAME="\K[^"]+' /etc/os-release 2>/dev/null || true); i=$(grep -oP 'VERSION_ID="\K[^"]+' /etc/os-release 2>/dev/null || true); v="${n} ${i}"; }
        [[ -n "$v" ]] && { echo "$v"; return; }
    fi
    [[ -f /etc/lsb-release ]] && { v=$(grep -oP 'DISTRIB_DESCRIPTION="\K[^"]+' /etc/lsb-release 2>/dev/null || true); [[ -z "$v" ]] && v="$(grep -oP 'DISTRIB_ID=\K.*' /etc/lsb-release 2>/dev/null) $(grep -oP 'DISTRIB_RELEASE=\K.*' /etc/lsb-release 2>/dev/null)"; [[ -n "$v" ]] && { echo "$v"; return; }; }
    have lsb_release && v=$(lsb_release -ds 2>/dev/null) && [[ -n "$v" ]] && { echo "$v"; return; }
    echo "Linux $(uname -r) ($(uname -m))"
}

red() {
    local me="" mw="" n a
    for iface in /sys/class/net/*; do
        n=$(basename "$iface")
        [[ "$n" == "lo" || "$n" == *"br-"* || "$n" == *"docker"* || "$n" == *"veth"* || "$n" == *"virbr"* ]] && continue
        a=$(norm_mac "$(cat "$iface/address" 2>/dev/null || true)")
        [[ -z "$a" || "$a" == "00:00:00:00:00:00" ]] && continue
        if grep -qi "wlan\|wifi\|wireless" "$iface/device/uevent" 2>/dev/null; then
            [[ -z "$mw" ]] && mw="$a"
        else
            [[ -z "$me" ]] && me="$a"
        fi
    done
    if have ip; then
        while IFS= read -r line; do
            n=$(echo "$line" | awk '{print $2}' | tr -d ':')
            [[ "$n" == "lo" || "$n" == *"br-"* || "$n" == *"docker"* || "$n" == *"veth"* || "$n" == *"virbr"* ]] && continue
            a=$(echo "$line" | grep -oP 'ether \K[0-9a-f:]+' | tr '[:lower:]' '[:upper:]' | head -1 || true)
            [[ -z "$a" || "$a" == "00:00:00:00:00:00" ]] && continue
            if echo "$line" | grep -qi "wlan\|wifi\|wireless" 2>/dev/null; then
                [[ -z "$mw" ]] && mw="$a"
            else
                [[ -z "$me" ]] && me="$a"
            fi
        done < <(ip -o link show 2>/dev/null || true)
    fi
    echo "${me}|${mw}"
}

discos() {
    local d1t="" d1s="" d2t="N/A" d2s="N/A" cnt=0 idx=0 n r ss g ts
    if have lsblk; then
        while IFS='|' read -r n s r m; do
            [[ "$n" == loop* || "$n" == ram* || "$n" == sr* || "$n" == zram* ]] && continue
            idx=$((idx + 1)); [[ $idx -gt 2 ]] && break
            local t="HDD"
            [[ "$r" == "0" ]] && { [[ "$n" == nvme* || "$m" == *NVMe* || "$m" == *"M.2"* ]] && t="M2" || t="SSD"; }
            local tn; tn=$(echo "$s" | grep -oP '^\K[0-9.]+' || echo "0")
            local g; g=$(echo "$tn" | awk '{printf "%.0f", $1}')
            if   [[ "$g" -lt 150 ]]; then ts="120 GB"
            elif [[ "$g" -lt 380 ]]; then ts="256 GB"
            elif [[ "$g" -lt 750 ]]; then ts="512 GB"
            elif [[ "$g" -lt 1500 ]]; then ts="1 TB"
            elif [[ "$g" -lt 2500 ]]; then ts="2 TB"
            elif [[ "$g" -lt 4500 ]]; then ts="4 TB"
            else ts="${g} GB"; fi
            if   [[ $idx -eq 1 ]]; then d1t="$t"; d1s="$ts"
            elif [[ $idx -eq 2 ]]; then d2t="$t"; d2s="$ts"; fi
            cnt=$idx
        done < <(lsblk -d -o NAME,SIZE,ROTA,MODEL -n -p 2>/dev/null || true)
    fi
    if [[ "$cnt" -eq 0 ]]; then
        for blk in /sys/block/*; do
            n=$(basename "$blk")
            [[ "$n" == loop* || "$n" == ram* || "$n" == sr* || "$n" == zram* ]] && continue
            idx=$((idx + 1)); [[ $idx -gt 2 ]] && break
            r=$(cat "$blk/queue/rotational" 2>/dev/null || echo "0")
            ss=$(cat "$blk/size" 2>/dev/null || echo "0")
            g=$(( (ss * 512 + 500000000) / 1000000000 ))
            if   [[ "$g" -lt 150 ]]; then ts="120 GB"
            elif [[ "$g" -lt 380 ]]; then ts="256 GB"
            elif [[ "$g" -lt 750 ]]; then ts="512 GB"
            elif [[ "$g" -lt 1500 ]]; then ts="1 TB"
            elif [[ "$g" -lt 2500 ]]; then ts="2 TB"
            elif [[ "$g" -lt 4500 ]]; then ts="4 TB"
            else ts="${g} GB"; fi
            local t="HDD"
            [[ "$r" == "0" ]] && { [[ "$n" == nvme* ]] && t="M2" || t="SSD"; }
            if   [[ $idx -eq 1 ]]; then d1t="$t"; d1s="$ts"
            elif [[ $idx -eq 2 ]]; then d2t="$t"; d2s="$ts"; fi
            cnt=$idx
        done
    fi
    if [[ "$cnt" -eq 0 ]]; then
        local rs; rs=$(df -B1 / 2>/dev/null | awk 'NR==2{print $2}' || echo "0")
        if [[ "$rs" -gt 0 ]]; then
            g=$(( (rs + 500000000) / 1000000000 ))
            if   [[ "$g" -lt 150 ]]; then ts="120 GB"
            elif [[ "$g" -lt 380 ]]; then ts="256 GB"
            elif [[ "$g" -lt 750 ]]; then ts="512 GB"
            elif [[ "$g" -lt 1500 ]]; then ts="1 TB"
            else ts="${g} GB"; fi
            d1t="HDD"; d1s="$ts"; cnt=1
        fi
    fi
    echo "${d1t}|${d1s}|${d2t}|${d2s}|${cnt}"
}

abrir_naveragor() {
    local u="$1"
    have xdg-open && { xdg-open "$u" &>/dev/null & return 0; }
    have sensible-browser && { sensible-browser "$u" &>/dev/null & return 0; }
    for b in google-chrome chromium-browser chromium firefox brave-browser opera vivaldi edge; do have "$b" && { "$b" "$u" &>/dev/null & return 0; }; done
    return 1
}

# ========================================================================
# VALIDACION
# ========================================================================
if [[ "$CMDB_URL" == *XXXXXXXX* ]]; then
    echo "ERROR: Configura CMDB_URL en este archivo."; read -n 1 -rp "Presiona cualquier tecla..."; exit 1
fi
if [[ "$CMDB_KEY" == *XXXXXXXX* ]]; then
    echo "ERROR: Configura CMDB_KEY en este archivo."; read -n 1 -rp "Presiona cualquier tecla..."; exit 1
fi

# ========================================================================
# MAIN
# ========================================================================
echo ""
echo "============================================================"
echo "  CMDB SENA CCYS - SEDE ${SEDE}"
echo "============================================================"
echo ""
echo "Detectando hardware con multiples metodos..."
echo ""

HOSTNAME=$(hostname)
MARCA=$(marca)
MODELO=$(modelo)
SERIAL=$(serial)
CPU=$(cpu)
RB=$(ram_bytes)
RAM=$(ram_norm "$RB")
TM=$(tipo_mem)
VID=$(video)
SO=$(so)

echo "  Hostname:     ${HOSTNAME}"
echo "  Marca:        ${MARCA:-No detectado}"
echo "  Modelo:       ${MODELO:-No detectado}"
echo "  Serial:       ${SERIAL:-No detectado}"
echo "  CPU:          ${CPU:-No detectado}"
echo "  RAM:          ${RAM:-No detectado}"
echo "  Tipo Memoria: ${TM:-No detectado}"
echo "  Video:        ${VID:-No detectado}"
echo "  S.O.:         ${SO:-No detectado}"

echo ""
echo "-- Almacenamiento ------------------------------------------"
DR=$(discos)
IFS='|' read -r D1T D1S D2T D2S DC <<< "$DR"
[[ "$DC" -gt 0 ]] && echo "  + Disco 1: ${D1T:-?} / ${D1S:-?}"
[[ "$DC" -gt 1 ]] && echo "  + Disco 2: ${D2T:-N/A} / ${D2S:-N/A}"

echo ""
echo "-- Red -----------------------------------------------------"
RR=$(red)
IFS='|' read -r ME MW <<< "$RR"
[[ -n "$ME" ]] && echo "  + MAC Cableada: ${ME}"
[[ -n "$MW" ]] && echo "  + MAC WiFi:     ${MW}"
[[ -z "$ME" && -z "$MW" ]] && echo "  + No se detectaron adaptadores de red con MAC"

FH=$(date +"%d/%m/%Y" 2>/dev/null || echo "")

# ========================================================================
# QUERY PARAMS
# ========================================================================
declare -A P=(
    [ciudad]="POPAYAN" [disco1_tam]="${D1S}" [disco1_tipo]="${D1T}"
    [disco2_tam]="${D2S}" [disco2_tipo]="${D2T}" [fecha_impacto]="${FH}"
    [fecha_mantenimiento]="${FH}" [hostname]="${HOSTNAME}" [mac_cableada]="${ME}"
    [mac_wifi]="${MW}" [marca]="${MARCA}" [modelo]="${MODELO}" [modo]="nuevo"
    [placa]="" [procesador]="${CPU}" [propietario]="SENA" [ram]="${RAM}"
    [serial]="${SERIAL}" [so]="${SO}" [tipo_memoria]="${TM}" [version_so]=""
    [video]="${VID}"
)

# ========================================================================
# PREVIEW
# ========================================================================
echo ""
echo "------------------------------------------------------------"
echo ""
echo "Datos detectados:"
echo ""
echo "  Hostname:     ${P[hostname]}"
echo "  Marca:        ${P[marca]:----}"
echo "  Modelo:       ${P[modelo]:----}"
echo "  Serial:       ${P[serial]:----}"
echo "  CPU:          ${P[procesador]:----}"
echo "  RAM:          ${P[ram]:----}"
echo "  Memoria:      ${P[tipo_memoria]:----}"
echo "  Disco 1:      ${P[disco1_tipo]:----} / ${P[disco1_tam]:----}"
[[ "$DC" -gt 1 ]] && echo "  Disco 2:      ${P[disco2_tipo]} / ${P[disco2_tam]}"
echo "  Video:        ${P[video]:----}"
echo "  S.O.:         ${P[so]:----}"
echo "  MAC Eth:      ${P[mac_cableada]:----}"
echo "  MAC WiFi:     ${P[mac_wifi]:----}"
echo ""

# ========================================================================
# PLACA
# ========================================================================
echo "------------------------------------------------------------"
echo ""
read -rp "Escribe o escanea la placa y presiona ENTER: " PI
PI=$(echo "$PI" | tr '[:lower:]' '[:upper:]' | tr "'" "-" | sed 's/[^A-Z0-9\-]//g')
if [[ -z "$PI" ]]; then
    echo ""; echo "La placa es obligatoria. Proceso cancelado."
    read -n 1 -rp "Presiona cualquier tecla para cerrar..."; exit 1
fi
P[placa]="${PI}"

# ========================================================================
# URL + NAVEGADOR
# ========================================================================
echo ""
echo "------------------------------------------------------------"
echo ""

QS=()
for k in "${!P[@]}"; do QS+=("${k}=$(urlencode "${P[$k]}")"); done
QS+=("key=$(urlencode "${CMDB_KEY}")")
QS+=("sede=$(urlencode "${SEDE}")")

u=""
f=true
for part in "${QS[@]}"; do
    if $f; then u="$part"; f=false; else u+="&${part}"; fi
done
FU="${CMDB_URL}?${u}"

echo "Abriendo CMDB..."
echo ""
if abrir_naveragor "$FU"; then
    echo "Navegador abierto."
else
    echo "No se pudo abrir el navegador automaticamente."
    echo "Copia esta URL:"
    echo "${FU}"
fi

echo ""
echo "------------------------------------------------------------"
echo ""
echo "Completa los datos faltantes en la pagina y guarda."
read -n 1 -rp "Presiona cualquier tecla para cerrar..."
echo ""

