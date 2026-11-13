import { prefersReducedMotion } from './event';

/**
 * Vídeos de fundo (no lugar dos GIFs, ~15x mais leves).
 * Com movimento reduzido ficam parados no pôster; os que estão fora da tela
 * só baixam quando chegam perto e pausam quando saem, para poupar dados e bateria.
 */
export function setupVideos(): void {
  const videos = document.querySelectorAll<HTMLVideoElement>('video[data-bg]');

  if (prefersReducedMotion()) {
    videos.forEach((v) => {
      v.removeAttribute('autoplay');
      v.pause();
    });
    return;
  }

  if (!('IntersectionObserver' in window)) {
    videos.forEach((v) => void v.play().catch(() => {}));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const v = e.target as HTMLVideoElement;
        // play() pode ser recusado (economia de dados, modo de baixo consumo): o pôster continua lá
        // vídeo sem loop que já terminou fica no último quadro (play() reiniciaria do começo)
        if (e.isIntersecting) {
          if (!v.ended) void v.play().catch(() => {});
        } else v.pause();
      }
    },
    { rootMargin: '200px 0px' },
  );
  videos.forEach((v) => io.observe(v));
}
