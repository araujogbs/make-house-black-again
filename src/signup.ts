import { $ } from './event';

// As respostas vão para o mesmo Google Forms do Warmup Contest (e para a planilha dele).
// Se as perguntas mudarem no Google, os códigos "entry" abaixo precisam ser atualizados.
const FORM_ACTION =
  'https://docs.google.com/forms/d/e/1FAIpQLSfmlf4DYSRo0AaLMFj4Vq45fYJSczTuP17FMpRbmaprT0vc3Q/formResponse';

const ENTRIES = {
  nome: 'entry.1608454723',
  instagram: 'entry.1761353677',
  whatsapp: 'entry.1863470391',
  soundcloud: 'entry.911448246',
  xdj: 'entry.1089426687',
} as const;

type Field = keyof typeof ENTRIES;

const CHECKS: Partial<Record<Field, (v: string) => string | null>> = {
  nome: (v) => (v ? null : 'Conta pra gente seu nome artístico.'),
  instagram: (v) => (v.replace('@', '') ? null : 'Informe seu @ do Instagram.'),
  whatsapp: (v) => (v.replace(/\D/g, '').length >= 10 ? null : 'Informe o WhatsApp com DDD, ex.: (11) 91234-5678.'),
  soundcloud: (v) =>
    /^(https?:\/\/)?(www\.|m\.|on\.)?soundcloud\.(com|app\.goo\.gl)\/\S+/i.test(v)
      ? null
      : 'Cole o link do set no SoundCloud, ex.: soundcloud.com/seu-nome/set.',
};

/** Botão abre o formulário; o envio acontece aqui mesmo, no visual do site. */
export function setupSignup(): void {
  const btn = $<HTMLButtonElement>('#signupBtn');
  const box = $('#formBox');
  const form = $<HTMLFormElement>('#contestForm');
  const status = $('#formStatus');
  const submit = $<HTMLButtonElement>('button[type="submit"]', form);

  btn.addEventListener('click', () => {
    const open = box.hidden;
    box.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    $('.signup-label', btn).textContent = open ? 'Fechar formulário' : 'Quero me inscrever';
    if (open) {
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => form.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true }), 500);
    }
  });

  const input = (name: Field): HTMLInputElement | null =>
    form.querySelector<HTMLInputElement>(`[name="${name}"]:not([type="radio"])`);

  function showError(name: Field, msg: string | null): void {
    const el = input(name);
    const err = form.querySelector<HTMLElement>(`[data-error="${name}"]`);
    if (!el || !err) return;
    el.setAttribute('aria-invalid', String(!!msg));
    err.textContent = msg ?? '';
  }

  // valida campo a campo quando a pessoa sai dele
  (Object.keys(CHECKS) as Field[]).forEach((name) => {
    input(name)?.addEventListener('blur', (e) => {
      const v = (e.target as HTMLInputElement).value.trim();
      if (v) showError(name, CHECKS[name]!(v));
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    let firstBad: HTMLInputElement | null = null;

    for (const name of Object.keys(CHECKS) as Field[]) {
      const msg = CHECKS[name]!(String(data.get(name) ?? '').trim());
      showError(name, msg);
      if (msg && !firstBad) firstBad = input(name);
    }
    if (firstBad) {
      firstBad.focus();
      status.textContent = 'Confere os campos marcados.';
      return;
    }

    const body = new URLSearchParams();
    (Object.keys(ENTRIES) as Field[]).forEach((name) => {
      let v = String(data.get(name) ?? '').trim();
      if (name === 'instagram' && v && !v.startsWith('@')) v = '@' + v;
      if (name === 'soundcloud' && v && !/^https?:\/\//i.test(v)) v = 'https://' + v;
      if (v) body.append(ENTRIES[name], v);
    });

    submit.disabled = true;
    status.textContent = 'Enviando…';
    try {
      // o Google não devolve resposta legível para outros sites (no-cors); só falha se a rede cair
      await fetch(FORM_ACTION, { method: 'POST', mode: 'no-cors', body });
      form.classList.add('sent');
      status.textContent = '';
      $('#formDone').hidden = false;
      $<HTMLElement>('#formDone').focus();
    } catch {
      status.textContent = 'Não foi possível enviar. Verifique sua conexão e tente de novo.';
    } finally {
      submit.disabled = false;
    }
  });
}
