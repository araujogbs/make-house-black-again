# MHBA · Make House Black Again

Site da 1ª edição da **MHBA**, movimento que resgata e valoriza as raízes negras da música eletrônica, especialmente da house music. Evento em 22.11.2026, em São Paulo.

**No ar:** https://makehouseblackagain.com.br

## Destaques

- **Contagem regressiva** até o primeiro kick, que muda sozinha para "acontecendo agora" e "obrigado, pista" no dia.
- **Mural de lambe-lambe interativo**: seis cartazes, cada um colado com uma animação própria (queda, rasgo, holofote, giro, cortina e flash).
- **Animações ligadas à rolagem**: manifesto que acende palavra por palavra, faixas que deslizam em sentidos opostos, linha do tempo que se preenche e fotos que ganham cor.
- **Local revelado e resultado do Warmup Contest**: cartazes de anúncio integrados às seções, com link para o mapa.
- Respeita **movimento reduzido**: sem animações, o site continua completo, com imagens estáticas.

## Qualidade

Lighthouse (build de produção):

| | Performance | Acessibilidade | Boas práticas | SEO |
|---|---|---|---|---|
| Celular | 99 | 100 | 100 | 100 |
| Desktop | 100 | 100 | 100 | 100 |

- Vídeos de fundo em MP4 no lugar dos GIFs originais (6 MB → 470 KB), que só tocam quando estão na tela.
- Fontes hospedadas no próprio site (sem Google Fonts), com pré-carregamento das usadas no topo.
- Imagens com dimensões declaradas: nada "pula" enquanto a página carrega.
- Cabeçalhos de segurança e política de conteúdo (CSP) em `public/_headers`.
- Estatísticas de visitas com Cloudflare Web Analytics: sem cookies e sem dados pessoais.
- Dados estruturados de evento (schema.org), Open Graph e sitemap.

## Stack

HTML, CSS e TypeScript sem framework, com build pelo [Vite](https://vite.dev).

```
src/
├── main.ts        ponto de entrada
├── countdown.ts   contagem regressiva
├── wall.ts        mural de lambe-lambe
├── scroll.ts      animações ligadas à rolagem
├── reveal.ts      entrada das seções e números que contam
├── media.ts       vídeos de fundo
├── grain.ts       textura de granulado
├── event.ts       datas do evento e utilitários
└── style.css
```

## Rodando localmente

```bash
npm install
npm run dev       # desenvolvimento
npm run build     # gera a pasta dist/
npm run preview   # serve o build
```

O domínio usado nos links de compartilhamento fica em `.env` (`VITE_SITE_URL`).

## Publicação

O conteúdo de `dist/` é estático e pode ir para qualquer hospedagem. O projeto está configurado para o Netlify (`_headers`, `404.html`).

## Créditos

Desenvolvido por [Gabriel Araújo](https://www.linkedin.com/in/gabriel-ara%C3%BAjo-a5a439277/).
Identidade visual, cartazes e conteúdo: MHBA · [@makehouseblackagainsp](https://www.instagram.com/makehouseblackagainsp/).

## Direitos

Código publicado só para consulta, como portfólio. © 2026 Gabriel Araújo, todos os direitos reservados: não há licença de uso, cópia ou redistribuição.

As fotos, os cartazes, a marca e os textos pertencem à MHBA · Make House Black Again e não podem ser reutilizados sem autorização.
