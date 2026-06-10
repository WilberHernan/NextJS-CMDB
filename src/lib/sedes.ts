export const SEDES = ["CCYS", "REGIONAL", "CIUDAD_JARDIN"] as const;
export type Sede = (typeof SEDES)[number];

export const SEDE_LABELS: Record<Sede, string> = {
  CCYS: "CCYS",
  REGIONAL: "Regional",
  CIUDAD_JARDIN: "Ciudad Jardín",
};

export function isSede(value: string | null | undefined): value is Sede {
  return SEDES.includes(value as Sede);
}
