import { prefersReducedMotion } from './event';

/** Conta de 0 até o valor em data-count, com easing suave. */
export function countUp(el: HTMLElement): void {
  const target = parseFloat(el.dataset.count ?? '0');
  const dec = Number(el.dataset.dec ?? 0);
  const sep = el.dataset.sep;
  const t0 = performance.now();

  const fmt = (v: number): string => {
    const s = v.toFixed(dec).replace('.', ',');
    return sep ? s.replace(/\B(?=(\d{3})+(?!\d))/g, sep) : s;
  };

  const step = (t: number): void => {
    const k = Math.min(1, (t - t0) / 1600);
    el.textContent = fmt(target * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  };

  el.textContent = fmt(0);
  requestAnimationFrame(step);
}

/** Só o que começa abaixo da dobra espera a rolagem; o resto já aparece visível. */
export function setupReveal(): void {
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        el.classList.remove('wait');
        const meter = el.querySelector<HTMLElement>('.meter i');
        if (meter) meter.style.width = '';
        el.querySelectorAll<HTMLElement>('[data-count]').forEach(countUp);
        if (el.matches('[data-count]')) countUp(el);
        io.unobserve(el);
      }
    },
    // dispara um pouco antes de entrar na tela, para nunca sobrar área vazia
    { rootMargin: '0px 0px 12% 0px' },
  );

  document.querySelectorAll<HTMLElement>('.rv').forEach((el) => {
    if (el.getBoundingClientRect().top <= window.innerHeight) return;
    el.classList.add('wait');
    const meter = el.querySelector<HTMLElement>('.meter i');
    if (meter) meter.style.width = '0%';
    io.observe(el);
  });
}
