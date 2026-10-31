import { $, clamp01, prefersReducedMotion } from './event';

type Fx = 'drop' | 'wipe' | 'spot' | 'spin' | 'curtain' | 'flash';

interface Frame {
  transform: string;
  clip: string;
  filter: string;
  opacity: number;
}

const DURATION: Record<Fx, number> = { drop: 1.0, wipe: 0.9, spot: 1.1, spin: 1.1, curtain: 0.9, flash: 0.8 };
const FLASH: Partial<Record<Fx, 'flash' | 'flash-red'>> = { flash: 'flash', spot: 'flash-red' };
const CLEAR = 0.8; // duração da "arrancada" dos cartazes, em segundos

// onde cada cartaz "cola" no mural: rotação (graus) e deslocamento (% do próprio cartaz)
const LANDING = [
  { r: -4, x: -7, y: 2 },
  { r: 3, x: 6, y: -3 },
  { r: -2, x: -3, y: 4 },
  { r: 5, x: 5, y: 1 },
  { r: -3, x: -5, y: -2 },
  { r: 1, x: 0, y: 0 },
];

const easeOutExpo = (t: number): number => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/** Cada efeito recebe o progresso t (0 → 1) e devolve o quadro daquele momento. */
function frameFor(fx: Fx, t: number, rot: number): Frame {
  const x = easeOutExpo(t);
  const b = easeOutBack(t);
  const k = 1 - x;
  const f: Frame = { transform: `rotate(${rot}deg)`, clip: 'none', filter: '', opacity: 1 };
  switch (fx) {
    case 'drop': // despenca de perto da câmera, gira e assenta passando do ponto
      f.transform = `rotate(${rot + 18 * (1 - b)}deg) scale(${2 - b})`;
      f.filter = `blur(${(10 * k).toFixed(2)}px)`;
      f.opacity = clamp01(t * 4);
      break;
    case 'wipe': // rasgo da esquerda pra direita, com inclinação
      f.transform = `translateX(${-20 * k}%) skewX(${-8 * k}deg) rotate(${rot}deg)`;
      f.clip = `inset(0 ${(100 * k).toFixed(2)}% 0 0)`;
      break;
    case 'spot': // holofote abrindo, estourado de luz no começo
      f.transform = `rotate(${rot}deg) scale(${1.15 - 0.15 * x})`;
      f.clip = `circle(${(x * 78).toFixed(2)}% at 50% 45%)`;
      f.filter = `brightness(${(1 + 0.8 * k).toFixed(3)})`;
      break;
    case 'spin': // entra girando como um disco e trava no lugar
      f.transform = `translate(${80 * (1 - b)}%, ${60 * (1 - b)}%) rotate(${rot + 60 * (1 - b)}deg)`;
      f.opacity = clamp01(t * 4);
      break;
    case 'curtain': // cortina descendo
      f.transform = `translateY(${-10 * k}%) rotate(${rot}deg)`;
      f.clip = `inset(0 0 ${(100 * k).toFixed(2)}% 0)`;
      break;
    case 'flash': // estouro de luz que foca
      f.transform = `rotate(${rot}deg) scale(${1.35 - 0.35 * b})`;
      f.filter = `brightness(${(1 + 3 * k).toFixed(3)}) blur(${(14 * k).toFixed(2)}px)`;
      f.opacity = clamp01(t * 4);
      break;
  }
  if (t <= 0) f.opacity = 0;
  return f;
}

/** Mural de lambe-lambe: cada clique no botão cola o próximo cartaz com o efeito dele. */
export function setupWall(): void {
  if (prefersReducedMotion()) return; // sem animação: fica a grade simples

  const wall = $('#cartazes');
  const board = $('.wall-board', wall);
  const posters = Array.from(wall.querySelectorAll<HTMLElement>('.lp'));
  const num = $('#wallNum', wall);
  const cap = $('#wallCap', wall);
  const ticks = Array.from(wall.querySelectorAll<HTMLElement>('.wall-ticks i'));
  const btn = $<HTMLButtonElement>('.wall-next', wall);
  const btnLabel = $('.wall-next-label', btn);
  const n = posters.length;
  const fxs = posters.map((el) => el.dataset.fx as Fx);

  // startAt[i]: quando o cartaz i começou a entrar (segundos); -Infinity = já colado sem animação; null = fora do mural
  const startAt: (number | null)[] = posters.map((_, i) => (i === 0 ? -Infinity : null));
  const landed = posters.map((_, i) => i === 0);
  let shown = 1;
  let clearAt: number | null = null;
  let animating = false;

  wall.classList.add('on');
  posters.forEach((el, i) => (el.style.zIndex = String(i + 1)));

  const now = (): number => performance.now() / 1000;
  const progress = (i: number, at: number): number => {
    const s = startAt[i];
    if (s === null) return 0;
    return clamp01((at - s) / DURATION[fxs[i]]);
  };

  const replay = (el: HTMLElement, cls: string): void => {
    el.classList.remove(cls);
    void el.offsetWidth; // reinicia a animação CSS
    el.classList.add(cls);
  };

  function land(i: number): void {
    landed[i] = true;
    replay(posters[i], 'landed');
    replay(board, 'thump');
    const flash = FLASH[fxs[i]];
    if (flash) replay(board, flash);
  }

  function updateInfo(): void {
    const idx = shown - 1;
    num.textContent = String(idx + 1).padStart(2, '0');
    cap.textContent = posters[idx].dataset.cap ?? '';
    replay(num, 'swap');
    replay(cap, 'swap');
    ticks.forEach((tk, k) => tk.style.setProperty('--f', k <= idx ? '1' : '0'));
    btnLabel.textContent = shown < n ? 'Colar próximo cartaz' : 'Arrancar e recomeçar';
  }

  /** Desenha o quadro atual; devolve true enquanto ainda houver algo se mexendo. */
  function render(): boolean {
    const at = now();
    let moving = false;
    const c = clearAt === null ? 0 : clamp01((at - clearAt) / CLEAR);
    if (clearAt !== null && c < 1) moving = true;

    posters.forEach((el, i) => {
      const L = LANDING[i];
      const t = progress(i, at);
      if (startAt[i] !== null && t < 1) moving = true;
      if (t >= 1 && !landed[i]) land(i);

      const f = frameFor(fxs[i], t, L.r);
      // escurece e recua um pouco quando o próximo cola por cima
      const dim = i < n - 1 ? easeOutExpo(progress(i + 1, at)) : 0;
      let transform = `translate(-50%, -50%) translate(${L.x}%, ${L.y}%) ${f.transform} scale(${(1 - 0.03 * dim).toFixed(4)})`;
      let opacity = f.opacity;

      if (clearAt !== null) {
        // arrancada: o de cima sai primeiro, cada um caindo e girando
        const ci = clamp01(c * 1.6 - (n - 1 - i) * 0.1);
        const e = ci * ci;
        transform += ` translateY(${(e * 60).toFixed(2)}%) rotate(${(e * (i % 2 ? 14 : -14)).toFixed(2)}deg)`;
        opacity *= 1 - e;
      }

      el.style.transform = transform;
      el.style.clipPath = f.clip;
      el.style.filter = `${f.filter} brightness(${(1 - 0.5 * dim).toFixed(3)})`;
      el.style.opacity = opacity.toFixed(3);
    });

    if (clearAt !== null && c >= 1) {
      // mural limpo: recomeça colando o primeiro cartaz com o efeito dele
      clearAt = null;
      startAt.fill(null);
      landed.fill(false);
      startAt[0] = at;
      shown = 1;
      updateInfo();
      moving = true;
    }
    return moving;
  }

  function animate(): void {
    if (animating) return;
    animating = true;
    const step = (): void => {
      if (render()) requestAnimationFrame(step);
      else animating = false;
    };
    requestAnimationFrame(step);
  }

  function next(): void {
    if (clearAt !== null) return; // já está arrancando
    if (shown < n) {
      startAt[shown] = now();
      shown++;
      updateInfo();
    } else {
      clearAt = now();
    }
    animate();
  }

  btn.addEventListener('click', next);
  board.addEventListener('click', next);

  render();
  updateInfo();
}
