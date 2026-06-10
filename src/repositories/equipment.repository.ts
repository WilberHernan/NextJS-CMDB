import {
  getSheetData,
  appendSheetRow,
  updateSheetRow,
  deleteSheetRow,
  formatSheetRow,
} from "@/services/sheets";
import type { EquipoResponse, EquipmentValue, ApiResult } from "@/types/equipment";
import type { Sede } from "@/lib/sedes";
import { sanitizarPlaca } from "@/lib/utils";

const HOJAS_EQUIPOS = ["EquiposSena", "EquiposTelefonica"];

export async function buscarEquipo(
  placa: string,
  sede: Sede = "CCYS"
): Promise<EquipoResponse | null> {
  const placaBuscada = sanitizarPlaca(placa);
  if (!placaBuscada) return null;

  const validacionesGlobales = await obtenerValidacionesManuales(sede);
  const mapeoSedeId = await obtenerMapeoSedeId(sede);

  for (const hoja of HOJAS_EQUIPOS) {
    const data = await getSheetData(hoja, sede);
    if (!data || data.length < 2) continue;

    const nombreSedeEsperado = sede === "CIUDAD_JARDIN" ? "CIUDAD JARDIN" : sede;

    for (let i = 1; i < data.length; i++) {
      const placaEnHoja = data[i][6]
        ? sanitizarPlaca(data[i][6])
        : "";

      if (placaEnHoja !== placaBuscada) continue;

      // Filtro por sede: la columna 8 (NOMBRE DE LA SEDE) debe coincidir
      // Solo filtra si la celda tiene contenido — si está vacía asumimos que
      // pertenece a esta sede porque ya estamos leyendo el spreadsheet correcto.
      const sedeEnFila = data[i][8]?.toString().trim().toUpperCase() ?? "";
      if (sedeEnFila && sedeEnFila !== nombreSedeEsperado) continue;

      return {
        hoja,
        fila: i + 1,
        valores: data[i],
        validaciones: validacionesGlobales,
        validacionesIndices: Object.keys(validacionesGlobales).map(Number),
        mapeoSedeId,
      };
    }
  }
  return null;
}

export async function actualizarEquipo(datos: {
  fila: string;
  hoja: string;
  valores: EquipmentValue[];
  sede: Sede;
}): Promise<ApiResult> {
  try {
    const { fila, hoja, valores, sede } = datos;
    const rowNum = parseInt(fila);
    const valoresLimpios = sanitizarValores(valores);
    const cantidadDatos = valoresLimpios.length;

    const propietarioNuevo = (
      valoresLimpios[2] || ""
    ).toString().toUpperCase().trim();
    const hojaDestino =
      propietarioNuevo === "TELEFONICA"
        ? "EquiposTelefonica"
        : "EquiposSena";

    const dataActual = await getSheetData(hoja, sede);
    if (!dataActual || !dataActual[rowNum - 1]) {
      return { exito: false, mensaje: "Fila no encontrada en la hoja origen" };
    }
    const propietarioActual = (
      dataActual[rowNum - 1][2] || ""
    ).toString().toUpperCase().trim();

    if (hojaDestino !== hoja && propietarioActual !== propietarioNuevo) {
      const destData = await getSheetData(hojaDestino, sede);
      if (destData) {
        const placa = valoresLimpios[6]
          ? sanitizarPlaca(valoresLimpios[6])
          : "";
        if (placa) {
          for (let i = 1; i < destData.length; i++) {
            const placaExistente = destData[i][6]
              ? sanitizarPlaca(destData[i][6])
              : "";
            if (placaExistente === placa) {
              return {
                exito: false,
                mensaje: `La placa ${placa} ya existe en ${hojaDestino} (fila ${i + 1}). No se puede mover el equipo.`,
              };
            }
          }
        }
      }

      const appendResult = await appendSheetRow(
        hojaDestino,
        valoresLimpios,
        sede
      );
      await deleteSheetRow(hoja, rowNum, sede);

      // Pintar la fila movida de azul (como equipo nuevo en la hoja destino)
      if (appendResult?.updates?.updatedRange) {
        const rowMatch = appendResult.updates.updatedRange.match(/[A-Z]+(\d+):/);
        if (rowMatch) {
          await formatSheetRow(
            hojaDestino,
            parseInt(rowMatch[1]),
            "#dbeafe",
            sede
          );
        }
      }

      return {
        exito: true,
        mensaje: `Equipo movido exitosamente de ${hoja} a ${hojaDestino}`,
      };
    }

    await updateSheetRow(hoja, rowNum, valoresLimpios, sede);
    await formatSheetRow(hoja, rowNum, "#dcfce7", sede);
    return { exito: true, mensaje: "¡CMDB Actualizada con éxito!" };
  } catch (e) {
    return {
      exito: false,
      mensaje: e instanceof Error ? e.message : "Error desconocido",
    };
  }
}

export async function crearEquipo(datos: {
  hoja: string;
  valores: EquipmentValue[];
  sede: Sede;
}): Promise<ApiResult> {
  try {
    const { hoja, valores, sede } = datos;
    const valoresLimpios = sanitizarValores(valores);

    const placaNueva = valoresLimpios[6]
      ? sanitizarPlaca(valoresLimpios[6])
      : "";

    if (placaNueva) {
      const data = await getSheetData(hoja, sede);
      if (data) {
        for (let i = 1; i < data.length; i++) {
          const placaExistente = data[i][6]
            ? sanitizarPlaca(data[i][6])
            : "";
          if (placaExistente === placaNueva) {
            return {
              exito: false,
              mensaje: `La placa ${placaNueva} ya existe en ${hoja} (fila ${i + 1}).`,
            };
          }
        }
      }
    }

    const result = await appendSheetRow(hoja, valoresLimpios, sede);

    // Pintar la fila nueva de azul (#dbeafe) como en el original
    if (result?.updates?.updatedRange) {
      const rowMatch = result.updates.updatedRange.match(/[A-Z]+(\d+):/);
      if (rowMatch) {
        await formatSheetRow(hoja, parseInt(rowMatch[1]), "#dbeafe", sede);
      }
    }

    return {
      exito: true,
      mensaje: `Equipo registrado exitosamente en ${hoja}`,
    };
  } catch (e) {
    return {
      exito: false,
      mensaje: e instanceof Error ? e.message : "Error desconocido",
    };
  }
}

export async function obtenerMapeoSedeId(sede: Sede = "CCYS") {
  const data = await getSheetData("Hoja3", sede);
  const sedeAId: Record<string, string> = {};
  const idASede: Record<string, string> = {};

  if (!data || data.length < 2) return { sedeAId, idASede };

  let colId = 6;
  let colSede = 7;

  const idCandidates: { col: number; count: number }[] = [];
  const sedeCandidates: { col: number; count: number }[] = [];

  for (let c = 0; c < Math.min(data[0].length, 20); c++) {
    const numericValues: string[] = [];
    const textValues: string[] = [];

    for (let r = 1; r < Math.min(data.length, 25); r++) {
      const val = data[r][c];
      if (!val || val.toString().trim() === "") continue;
      const str = val.toString().trim();
      if (/^\d+$/.test(str)) numericValues.push(str);
      else textValues.push(str);
    }

    if (numericValues.length >= 2 && textValues.length === 0) {
      const allMultiDigit = numericValues.every((v) => v.length >= 2);
      if (allMultiDigit) idCandidates.push({ col: c, count: numericValues.length });
    }

    if (textValues.length >= 2 && numericValues.length === 0) {
      const avgLen =
        textValues.reduce((s, v) => s + v.length, 0) / textValues.length;
      if (avgLen > 3) sedeCandidates.push({ col: c, count: textValues.length });
    }
  }

  idCandidates.sort((a, b) => b.count - a.count);
  sedeCandidates.sort((a, b) => b.count - a.count);

  if (idCandidates.length > 0) colId = idCandidates[0].col;
  if (sedeCandidates.length > 0) colSede = sedeCandidates[0].col;

  for (let i = 1; i < data.length; i++) {
    const idRaw = data[i][colId];
    const sedeRaw = data[i][colSede];
    if (idRaw && sedeRaw) {
      const id = idRaw.toString().trim();
      const sede = sedeRaw.toString().trim().toUpperCase();
      if (id && sede) {
        sedeAId[sede] = id;
        idASede[id] = sede;
      }
    }
  }

  return { sedeAId, idASede };
}

const VALIDACIONES_POR_DEFECTO: Record<number, string[]> = {
  1: ["DESKTOP", "PORTATIL", "TODO EN UNO", "IMAC"],
  2: ["SENA", "TELEFONICA"],
  3: ["LENOVO", "DELL", "HP", "ASUS", "JANUS", "ACER", "APPLE"],
  7: ["65", "68", "69", "300", "319", "320", "321", "374", "389"],
  8: [
    "REGIONAL", "CCYS", "GUAPI", "TECNOPARQUE", "SNFT",
    "ARCHIVO CENTRAL", "SAN JOSE", "LA PAMBA", "CIUDAD JARDIN",
  ],
  9: ["POPAYAN", "GUAPI"],
  10: ["OFICINA", "AMBIENTE"],
  12: ["1", "2", "3"],
  14: ["ADMINISTRATIVO", "CONTRATISTA", "INSTRUCTOR", "APRENDIZ"],
  15: ["FUNCIONARIO", "FORMACION"],
  17: ["HDD", "SSD", "M2"],
  18: ["120 GB", "256 GB", "512 GB", "1 TB"],
  19: ["HDD", "SSD", "M2", "N/A"],
  20: ["120 GB", "256 GB", "512 GB", "1 TB", "N/A"],
  21: ["DDR3", "DDR4", "DDR5"],
  22: ["4 GB", "8 GB", "16 GB", "32 GB", "64 GB"],
  33: ["WINDOWS 10", "WINDOWS 11", "MAC OS MONTEREY", "MAC OS VENTURA"],
  34: ["20H2", "21H1", "21H2", "22H2", "23H2"],
  35: ["SI", "NO", "N/A"],
  36: ["SI", "NO", "N/A"],
  37: ["SI", "NO", "N/A"],
  38: ["SI", "NO", "N/A"],
  39: ["SI", "NO", "N/A"],
  40: ["SI", "NO", "N/A"],
  41: ["SI", "NO", "N/A"],
  43: ["OPERATIVO", "PRESENTA FALLA", "DAÑADO"],
  44: ["SI", "NO"],
  45: ["SENA.RED", "FORMACION.RED", "N/A"],
  46: ["SI", "NO", "N/A"],
  49: [
    "ANDRES SEBASTIAN BRAVO PALACIOS",
    "JULIAN ANDRES NOGUERA BURGOS",
    "LEONARDO ANDRES GUITIERREZ NARVAEZ",
    "HARRY LEHANDRO PEDRAZA ARROYO",
    "LUIS FELIPE FLOREZ DORADO",
    "YESID ANTONIO BRAVO RAMIREZ",
    "JESUS ALEXIS VEGA SANCHEZ",
    "JESUS HERNAN AMAYA ROJAS",
    "JHON ALEXANDER CORTES PAZ",
  ],
};

const HEADER_ALIASES: Record<string, string> = {
  "EN": "TIPO DE USUARIO",
  "EN ": "TIPO DE USUARIO",
  "TIPO USUARIO": "TIPO DE USUARIO",
  "USUARIO": "TIPO DE USUARIO",
  "ID": "ID SEDE",
  "NUMERO SEDE": "ID SEDE",
  "NOMBRE SEDE": "NOMBRE DE LA SEDE",
  "SEDE": "NOMBRE DE LA SEDE",
  "UBICACION": "UBICACIÓN",
  "VERSION SO": "VERSION DEL S.O.",
  "VERSION S.O.": "VERSION DEL S.O.",
  "VERSION SISTEMA OPERATIVO": "VERSION DEL S.O.",
  "SO VERSION": "VERSION DEL S.O.",
  "ESTADO": "ESTADO DEL EQUIPO",
  "ESTADO EQUIPO": "ESTADO DEL EQUIPO",
  "DOMINIO": "EN QUE DOMINIO SE ENCUENTRA",
  "CONTRASENA BIOS": "CONTRASEÑA BIOS",
  "PASSWORD BIOS": "CONTRASEÑA BIOS",
  "FECHA MANTENIMIENTO": "FECHA ULTIMO MANTENIMIENTO",
  "FECHA IMPACTO": "FECHA IMPACTO MAQUINA",
  "OBSERVACIONES": "Observaciones",
  "RESPONSABLE MANTENIMIENTO ABRIL": "RESPONSABLE DEL PRIMER MANTENIMIENTO ABRIL 2026",
  "RESPONSABLE PRIMER MANTENIMIENTO": "RESPONSABLE DEL PRIMER MANTENIMIENTO ABRIL 2026",
  "RESPONSABLE ABRIL": "RESPONSABLE DEL PRIMER MANTENIMIENTO ABRIL 2026",
  "RESPONSABLE MANTENIMIENTO OCTUBRE": "RESPONSABLE DEL SEGUNDO MANTENIMIENTO OCTUBRE 2026",
  "RESPONSABLE SEGUNDO MANTENIMIENTO": "RESPONSABLE DEL SEGUNDO MANTENIMIENTO OCTUBRE 2026",
  "RESPONSABLE OCTUBRE": "RESPONSABLE DEL SEGUNDO MANTENIMIENTO OCTUBRE 2026",
};

const FORM_FIELDS: Record<string, number> = {
  HOSTNAME: 0, TIPO: 1, PROPIETARIO: 2, MARCA: 3, MODELO: 4,
  SERIAL: 5, PLACA: 6, "ID SEDE": 7, "NOMBRE DE LA SEDE": 8,
  CIUDAD: 9, UBICACIÓN: 10,
  "NOMBRE DE LA OFICINA O AMBIENTE": 11, PISO: 12,
  "NOMBRE DEL USUARIO": 13, "TIPO DE USUARIO": 14, "TIPO DE RED": 15,
  PROCESADOR: 16,
  "TIPO DISCO 1": 17, "TAMAÑO DISCO 1": 18, "TIPO DISCO 2": 19,
  "TAMAÑO DISCO 2": 20, "TIPO MEMORIA": 21, "TAMAÑO MEMORIA": 22,
  "TARJETA DE VIDEO": 23, "CAMBIO DE PARTE": 24, "CAMBIO DE PARTE 2": 25,
  "# DE CASO PARA REPUESTO": 26, "PLACA MONITOR": 27, "PLACA MOUSE": 28,
  "PLACA TECLADO": 29, "PLACA CARGADOR": 30, "MAC:RED CABLEADA": 31,
  "MAC RED INALAMBRICA": 32, "SISTEMA OPERATIVO": 33, "VERSION DEL S.O.": 34,
  ANTIVIRUS: 35, OFFICE: 36, ADOBE: 37, LAPS: 38, "7ZIP": 39,
  VPN: 40, JAMF: 41, "OTRO SOFTWARE": 42, "ESTADO DEL EQUIPO": 43,
  "TIENE DOMINIO": 44, "EN QUE DOMINIO SE ENCUENTRA": 45,
  "CONTRASEÑA BIOS": 46, "FECHA ULTIMO MANTENIMIENTO": 47,
  "FECHA IMPACTO MAQUINA": 48, ASS: 49, Observaciones: 50,
  "RESPONSABLE DEL PRIMER MANTENIMIENTO ABRIL 2026": 51,
  "RESPONSABLE DEL SEGUNDO MANTENIMIENTO OCTUBRE 2026": 52,
};

function normalizarHeader(header: string): string {
  return header
    .toString()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchHeaderConFormField(hoja3Header: string): string | null {
  const hNorm = normalizarHeader(hoja3Header);

  if (HEADER_ALIASES[hNorm]) return HEADER_ALIASES[hNorm];

  for (const formName of Object.keys(FORM_FIELDS)) {
    if (normalizarHeader(formName) === hNorm) return formName;
  }

  for (const formName of Object.keys(FORM_FIELDS)) {
    const fNorm = normalizarHeader(formName);
    if (fNorm.includes(hNorm) || hNorm.includes(fNorm)) return formName;
  }

  return null;
}

export async function obtenerValidacionesManuales(
  sede: Sede = "CCYS"
): Promise<Record<number, string[]>> {
  const resultado: Record<number, string[]> = {};
  const data = await getSheetData("Hoja3", sede);

  if (!data || data.length < 2) {
    return { ...VALIDACIONES_POR_DEFECTO };
  }

  const headers = data[0];
  const mapeoDetectado: Record<number, number> = {};

  for (let c = 0; c < headers.length; c++) {
    const hRaw = headers[c];
    if (!hRaw) continue;
    const formField = matchHeaderConFormField(hRaw);
    if (formField && FORM_FIELDS[formField] !== undefined) {
      mapeoDetectado[c] = FORM_FIELDS[formField];
    }
  }

  Object.entries(mapeoDetectado).forEach(([colHoja3Str, indiceForm]) => {
    const colHoja3 = parseInt(colHoja3Str);
    const valoresUnicos: string[] = [];
    const visto = new Set<string>();

    for (let i = 1; i < data.length; i++) {
      const raw = data[i][colHoja3];
      if (raw === undefined || raw === null || raw.toString().trim() === "")
        continue;
      const val = raw.toString().trim().toUpperCase();
      if (!visto.has(val)) {
        visto.add(val);
        valoresUnicos.push(val);
      }
    }

    if (valoresUnicos.length > 0) {
      resultado[indiceForm] = valoresUnicos;
    }
  });

  Object.entries(VALIDACIONES_POR_DEFECTO).forEach(([idx, vals]) => {
    const i = parseInt(idx);
    if (!resultado[i]) {
      resultado[i] = vals;
    }
  });

  return resultado;
}

function sanitizarValores(valores: EquipmentValue[]): string[] {
  return valores.map((v) => {
    if (typeof v === "string") {
      return v.replace(/'/g, "-");
    }
    return String(v);
  });
}
