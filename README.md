# rodrigobondioli.com — Home (rebuild fora do Framer)

Cópia fiel da Home do site Framer, em HTML/CSS/JS puro. Sem build, sem dependências — deploy direto na Vercel.

## Arquivos
- `index.html` — o site inteiro (HTML + CSS + JS num arquivo só).
- `design.md` — inventário do original (cores, fontes, textos, medidas).
- `README.md` — este arquivo.

## Rodar local
Abra `index.html` no navegador, ou sirva a pasta:
```
npx serve .
```

## Deploy na Vercel (igual você fez no SUPERBAR)

**Opção A — GitHub → Vercel (recomendado):**
1. `git init && git add . && git commit -m "home rebuild"` nesta pasta.
2. Suba pro GitHub (repo novo, ex: `rodrigobondioli-site`).
3. No Vercel: New Project → Import do repo. Framework preset: **Other** (site estático). Build command: vazio. Output: raiz.
4. Deploy. Sai uma URL `*.vercel.app` — é a prévia real pra conferir fidelidade.

**Opção B — CLI:**
```
npm i -g vercel
vercel        # login + preview
vercel --prod # produção
```

## Trocar o domínio do Framer pra Vercel
O `rodrigobondioli.com` hoje aponta pro Framer. Passo a passo:
1. No **Vercel** → projeto → Settings → **Domains** → adicionar `rodrigobondioli.com` e `www.rodrigobondioli.com`. O Vercel mostra os registros a configurar.
2. No seu **registrador de domínio** (onde comprou o domínio), troque os registros DNS:
   - `A` do apex `@` → `76.76.21.21` (IP da Vercel), **ou** aponte via `CNAME`/nameservers conforme o Vercel indicar.
   - `CNAME` do `www` → `cname.vercel-dns.com`.
   - **Remova** os registros antigos que apontavam pro Framer.
3. Espere propagar (minutos a algumas horas). O Vercel emite o SSL sozinho.
4. Só depois que estiver 100% no ar e conferido: **cancele/despublique o Framer**.

> Passos de conta e DNS são você quem executa (envolvem seus acessos). Eu te guio em cada tela se quiser.

## Pendências de fidelidade (decidir)
1. **Fonte dos títulos** — o original usa *Rooftop Mono* em versão **TRIAL** (risco de licença em produção). Aqui usei *Martian Mono* (livre, Google Fonts) como substituto próximo. Opções: manter a Martian, ou comprar a licença da Rooftop e eu ploto o arquivo.
2. **Foto hero** — está puxando do CDN do Framer (`framerusercontent.com`). Funciona enquanto o projeto Framer existir. **Antes de deletar o Framer**, baixe a imagem e me passe — eu troco por um arquivo local em `/assets`.
3. **Logos das marcas** (Nike, Coca-Cola, Vivo, L'Oréal, Harley, Unilever, Havaianas) — recriados em SVG/wordmark (os vetores originais são grandes e não exportáveis pelo canal). Se quiser 100% pixel, me passe os SVGs oficiais que eu troco.
4. **Formulário** — v1 abre o WhatsApp já com os dados preenchidos (zero backend). Se quiser capturar e-mail de verdade, ligo num Formspree (grátis).

## Escopo
Só a **Home**. A `/portfolio` (inglês) e as 11 páginas de projeto ficaram de fora por ora — dá pra fazer depois no mesmo esquema.
