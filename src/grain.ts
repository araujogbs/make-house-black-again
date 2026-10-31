/** Textura de granulado gerada uma vez, no clima dos cartazes impressos. */
export function paintGrain(target: HTMLElement, size = 180): void {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  target.style.backgroundImage = `url(${c.toDataURL()})`;
}
