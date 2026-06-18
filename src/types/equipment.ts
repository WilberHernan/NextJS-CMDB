export const COLUMNAS = [
  'HOSTNAME', 'TIPO', 'PROPIETARIO', 'MARCA', 'MODELO', 'SERIAL', 'PLACA',
  'ID SEDE', 'NOMBRE DE LA SEDE', 'CIUDAD', 'UBICACIÓN',
  'NOMBRE DE LA OFICINA O AMBIENTE', 'PISO',
  'NOMBRE DEL USUARIO', 'TIPO DE USUARIO', 'TIPO DE RED', 'PROCESADOR',
  'TIPO DISCO 1', 'TAMAÑO DISCO 1', 'TIPO DISCO 2', 'TAMAÑO DISCO 2',
  'TIPO MEMORIA', 'TAMAÑO MEMORIA', 'TARJETA DE VIDEO', 'CAMBIO DE PARTE',
  'CAMBIO DE PARTE 2', '# DE CASO PARA REPUESTO', 'PLACA MONITOR',
  'PLACA MOUSE', 'PLACA TECLADO', 'PLACA CARGADOR', 'MAC:RED CABLEADA',
  'MAC RED INALAMBRICA', 'SISTEMA OPERATIVO', 'VERSION DEL S.O.',
  'ANTIVIRUS', 'OFFICE', 'ADOBE', 'LAPS', '7ZIP', 'VPN', 'JAMF',
  'OTRO SOFTWARE', 'ESTADO DEL EQUIPO', 'TIENE DOMINIO',
  'EN QUE DOMINIO SE ENCUENTRA', 'CONTRASEÑA BIOS',
  'FECHA ULTIMO MANTENIMIENTO', 'FECHA IMPACTO MAQUINA', 'ASS',
  'Observaciones',
  'RESPONSABLE DEL PRIMER MANTENIMIENTO ABRIL 2026',
  'RESPONSABLE DEL SEGUNDO MANTENIMIENTO OCTUBRE 2026',
] as const;

export const SECCIONES: Record<number, string> = {
  0: 'Información General',
  7: 'Ubicación',
  13: 'Usuario',
  16: 'Hardware',
  24: 'Mantenimiento',
  27: 'Periféricos',
  31: 'Red',
  33: 'Software',
  43: 'Estado',
  46: 'Seguridad',
  49: 'Asignación',
  51: 'Responsables Mantenimiento',
};

export const CAMPOS_PLACA = [6, 27, 28, 29, 30];

export const DEFAULT_NUEVO_EQUIPO: Record<number, string> = {
  11: 'N/A',
  13: 'N/A',
  18: 'N/A',
  19: 'N/A',
  23: 'N/A',
  24: 'N/A',
  25: 'N/A',
  26: 'N/A',
  27: 'N/A',
  28: 'N/A',
  29: 'N/A',
  30: 'N/A',
  42: 'N/A',
  44: 'N/A',
  50: 'NINGUNA',
  35: 'SI',
  36: 'SI',
  37: 'SI',
  38: 'NO',
  39: 'SI',
  40: 'N/A',
  41: 'NO',
  46: 'NO',
};

export type EquipmentValue = string;

export interface EquipmentRow {
  hoja: string;
  fila: number;
  valores: EquipmentValue[];
}

export interface EquipoResponse extends EquipmentRow {
  validaciones: Record<number, string[]>;
  validacionesIndices: number[];
  mapeoSedeId: MapeoSedeId;
}

export interface MapeoSedeId {
  sedeAId: Record<string, string>;
  idASede: Record<string, string>;
}

export interface ApiResult {
  exito: boolean;
  mensaje: string;
}

export interface NuevoEquipoParams {
  hostname?: string;
  marca?: string;
  modelo?: string;
  serial?: string;
  placa?: string;
  procesador?: string;
  disco1_tipo?: string;
  disco1_tam?: string;
  disco2_tipo?: string;
  disco2_tam?: string;
  tipo_memoria?: string;
  ram?: string;
  video?: string;
  mac_cableada?: string;
  mac_wifi?: string;
  so?: string;
  version_so?: string;
  fecha_mantenimiento?: string;
  fecha_impacto?: string;
}
