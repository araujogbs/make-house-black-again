import { $, EVENT_END, EVENT_START, prefersReducedMotion } from './event';

type Unit = 'd' | 'h' | 'm' | 's';

const pad = (n: number): string => String(n).padStart(2, '0');

export function startCountdown(): void {
  const reduce = prefersReducedMotion();
  const timer = $('#timer');
  const done = $('#countDone');
  const label = $('#countLabel');
  const mini = $('#miniTimer');

  const nums = {} as Record<Unit, HTMLElement>;
  timer.querySelectorAll<HTMLElement>('.num').forEach((el) => {
    nums[el.dataset.u as Unit] = el;
  });
  const prev: Partial<Record<Unit, string>> = {};

  function setNum(u: Unit, str: string): void {
    const el = nums[u];
    const old = prev[u] ?? '';
    if (old === str) return;
    if (el.children.length !== str.length) {
      el.innerHTML = [...str].map((c) => `<span class="dg">${c}</span>`).join('');
    } else {
      [...str].forEach((c, i) => {
        if (old[i] === c) return;
        const d = el.children[i] as HTMLElement;
        d.textContent = c;
        if (!reduce) {
          // reinicia a animação do dígito que mudou
          d.classList.remove('tick');
          void d.offsetWidth;
          d.classList.add('tick');
        }
      });
    }
    prev[u] = str;
  }

  function tick(): void {
    const now = Date.now();
    if (now >= EVENT_START) {
      const live = now < EVENT_END;
      timer.hidden = true;
      done.hidden = false;
      done.textContent = live ? 'Acontecendo agora' : 'Obrigado, pista';
      label.textContent = live ? 'A pista está aberta' : 'A 1ª edição aconteceu';
      mini.textContent = live ? 'agora' : '—';
      return;
    }
    const s = Math.floor((EVENT_START - now) / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    setNum('d', pad(d));
    setNum('h', pad(h));
    setNum('m', pad(m));
    setNum('s', pad(sec));
    mini.textContent = `${d}d ${pad(h)}h ${pad(m)}m ${pad(sec)}s`;
    setTimeout(tick, 1000 - (now % 1000) + 5);
  }

  tick();
}
