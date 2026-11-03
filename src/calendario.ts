// Helpers del calendario semanal y regla del semaforo, compartidos por los dos paneles.

export const getMondayOfDate = (d: Date): Date => {
  const day = d.getDay();
  // Domingo (0) retrocede 6 dias; el resto, (day - 1).
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
};

export const formatLocalDate = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export type Semaforo = 'verde' | 'amarillo' | 'rojo' | 'gris';

// pct = calorias consumidas / meta del plan * 100. Gris: sin registros o sin plan (pct null).
export function semaforo(pct: number | null): Semaforo {
  if (pct === null || pct <= 0) return 'gris';
  if (pct >= 85 && pct <= 110) return 'verde';
  if ((pct >= 60 && pct < 85) || (pct > 110 && pct <= 125)) return 'amarillo';
  return 'rojo';
}

export const SEMAFORO_LABEL: Record<Semaforo, string> = {
  verde: 'En meta (85 a 110 %)',
  amarillo: 'Desviación leve (60 a 85 % o 110 a 125 %)',
  rojo: 'Fuera de rango',
  gris: 'Sin registros o sin plan',
};

// Clases de Tailwind para las celdas del calendario semanal
export const SEMAFORO_THEME: Record<Semaforo, { cell: string; dot: string; bar: string }> = {
  verde: { cell: 'bg-emerald-950/45 text-emerald-400 border-emerald-500/45 hover:bg-emerald-900/35', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
  amarillo: { cell: 'bg-amber-950/45 text-amber-400 border-amber-500/45 hover:bg-amber-900/35', dot: 'bg-amber-400', bar: 'bg-amber-400' },
  rojo: { cell: 'bg-rose-950/45 text-rose-400 border-rose-500/45 hover:bg-rose-900/35', dot: 'bg-rose-500', bar: 'bg-rose-500' },
  gris: { cell: 'bg-neutral-950 text-neutral-400 border-neutral-800/60 hover:bg-neutral-900 hover:border-neutral-700', dot: 'bg-neutral-700', bar: 'bg-neutral-800' },
};
