// Horário de Brasília (UTC−3, sem horário de verão desde 2019)
export const EVENT_START = new Date('2026-11-22T12:00:00-03:00').getTime();
export const EVENT_END = new Date('2026-11-22T21:00:00-03:00').getTime();

export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

export function $<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Elemento não encontrado: ${selector}`);
  return el;
}
