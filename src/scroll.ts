import { $, clamp01, prefersReducedMotion } from './event';

/** Divide o manifesto em palavras que acendem conforme a rolagem. */
function splitWords(root: HTMLElement): HTMLElement[] {
  const words: HTMLElement[] = [];
  const walk = (node: Node): void => {
    for (const n of Array.from(node.childNodes)) {
      if (n.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        const red = (node as HTMLElement).classList?.contains('red');
        for (const t of (n.textContent ?? '').split(/(\s+)/)) {
          if (!t) continue;
          if (/^\s+$/.test(t)) {
            frag.appendChild(document.createTextNode(t));
            continue;
          }
          const s = document.createElement('span');
          s.className = red ? 'w red' : 'w';
          s.textContent = t;
          frag.appendChild(s);
          words.push(s);
        }
        n.parentNode?.replaceChild(frag, n);
      } else if (n.nodeType === Node.ELEMENT_NODE) {
        walk(n);
      }
    }
  };
  walk(root);
  return words;
}

/** Barra de progresso, palavras do manifesto, pilares e galeria que ganham cor. */
export function setupScrollState(): void {
  const bar = $('.progress');
  const big = $('#bigWords');
  const words = splitWords(big);
  const lights = document.querySelectorAll<HTMLElement>('.pillar, .gallery img');

  const onScroll = (): void => {
    const vh = window.innerHeight;
    const max = Math.max(1, document.documentElement.scrollHeight - vh);
    bar.style.transform = `scaleX(${window.scrollY / max})`;

    const r = big.getBoundingClientRect();
    const lit = Math.round(clamp01((vh * 0.85 - r.top) / (r.height + vh * 0.35)) * words.length);
    words.forEach((w, i) => w.classList.toggle('on', i < lit));

    lights.forEach((el) => {
      const b = el.getBoundingClientRect();
      el.classList.toggle('lit', b.top < vh * 0.6 && b.bottom > vh * 0.3);
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
}

/** Movimento contínuo: marquee sensível à velocidade, faixa que desliza, zoom das fotos, linha do tempo e parallax do título. */
export function setupMotion(): void {
  if (prefersReducedMotion()) return;

  const marq = $('.marquee-track');
  const driftBox = $('.drift');
  const rows = document.querySelectorAll<HTMLElement>('.drift .row');
  const zooms = document.querySelectorAll<HTMLElement>('.zoom');
  const tl = $('.tl');
  const hero = $('#topo');
  const title = $('.title');

  marq.style.animation = 'none';
  let mx = 0;
  let lastY = window.scrollY;
  let vel = 0;

  const frame = (): void => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    vel += (y - lastY - vel) * 0.15;
    lastY = y;

    mx += 0.6 + Math.min(Math.abs(vel), 60) * 0.35;
    const half = marq.scrollWidth / 2;
    if (half && mx >= half) mx -= half;
    marq.style.transform = `translateX(${-mx}px)`;

    const r = driftBox.getBoundingClientRect();
    if (r.bottom > 0 && r.top < vh) {
      const p = clamp01((vh - r.top) / (vh + r.height));
      rows.forEach((row) => {
        const tx = row.dataset.dir === '1' ? -p * 28 : -(1 - p) * 28;
        row.style.transform = `translateX(${tx}%)`;
      });
    }

    zooms.forEach((z) => {
      const b = z.getBoundingClientRect();
      if (b.bottom < 0 || b.top > vh) return;
      z.style.setProperty('--z', (1 + 0.16 * (1 - clamp01((vh - b.top) / (vh * 0.9)))).toFixed(4));
    });

    const t = tl.getBoundingClientRect();
    tl.style.setProperty('--p', clamp01((vh * 0.6 - t.top) / t.height).toFixed(4));

    const k = clamp01(y / hero.offsetHeight);
    title.style.transform = `translateY(${(k * 90).toFixed(1)}px) scale(${(1 - k * 0.08).toFixed(4)})`;
    title.style.opacity = (1 - k * 0.9).toFixed(3);

    requestAnimationFrame(frame);
  };
  frame();
}
