# rodrigobondioli.com

Site pessoal do Rodrigo Bondioli. Next.js 15 (App Router) na Vercel (Hobby).
Todas as páginas são pré-geradas no build; a única rota de servidor é
`/api/contact`, que manda o formulário por e-mail.

Saímos do Framer em 21/09/2026 pra cortar custo. **A regra que rege tudo aqui:
mesma cara do Framer, código e design system novos.**

## O que está pronto e o que falta

- [x] `/` — capa de uma tela, logo girando (física própria, portada do Framer)
- [x] `/thanks`
- [x] `/work` — a página grande: hero, destaque, arquivo, sobre, YouTube, contato
- [ ] `/projects/[slug]` — 16 páginas, conteúdo em `src/content/projects.json`.
      Estrutura extraída do Framer está descrita na conversa; o template é
      escuro (`--bg-dark`), ao contrário do resto do site.
- [ ] `/mediakit` — conteúdo em `src/content/mediakit.json` (era `/mediakit/home`
      no Framer; a URL nova é `/mediakit`)

As URLs antigas foram mantidas. Só essa mudou.

## Como trabalhar nisso

O jeito que funcionou, e que vale repetir: **medir o Framer, não estimar.**

O site antigo continua publicado em <https://only-experiment-626593.framer.app>.
Abrir a página lá e a nossa lado a lado, e comparar com `getComputedStyle` —
não no olho. Quase todo erro desta migração veio de estimar em vez de medir:
raio de borda que não existia, entrelinha 1.5 onde era 1.3, largura máxima de
container que o Framer não tem, régua de 88 onde era 224.

Duas armadilhas que já custaram tempo:

1. **Nem todo "efeito" é animação.** A régua do projeto em destaque sobe sozinha
   e só depois o texto chega — isso é *layout*, 788px de espera, não um fade.
   Medir a distância entre os elementos antes de escrever qualquer `transition`.
2. **`100vw` conta a barra de rolagem.** Foi o que criou scroll horizontal no
   ticker. Usar `100%` e deixar a seção cortar.

```bash
npm run dev     # localhost:3000
npm run build   # gera ./out
```

## Decisões que não são negociáveis sem falar com o Rodrigo

- **Fontes:** só Alpha Lyrae (títulos) e Inter (resto). Ele mandou apagar o
  resto. Alpha Lyrae é SIL OFL 1.1, auto-hospedada em `public/fonts`.
- **Espaçamento:** sete passos, `--s1` a `--s7` em `globals.css`. O Framer tinha
  acumulado 19 valores onde o sistema documentava 7. Não inventar um oitavo.
- **Réguas** (as linhas curtas ao lado dos títulos) têm largura fixa por
  instância: `.rule-lg` 224, `.rule-md` 156, `.rule-sm` 88. Isso foi decisão
  dele depois de um teste com `1fr` que deu errado — a linha encostava no texto.
  Não "consertar" isso.
- **Nada arredondado** no `/work`. Thumbs, vídeos e imagens são de canto vivo.
- **Botão:** sempre `PillButton`. Rosa, texto preto, 48 de altura, cambalhota 3D
  no hover.

## Armadilhas do projeto

- **`overflow-x: clip`** no html/body, não `hidden`: `hidden` vira contexto de
  rolagem e mata o `position: sticky` da imagem do destaque.
- **Scroll suave é Lenis** — o mesmo que o Framer usava (dá pra ver a classe
  `.lenis` no html do site publicado).
- **O formulário envia de verdade**, por `/api/contact` → Resend. Isso é o
  motivo de o site não ser mais `output: "export"`: export puro não compila
  rota nenhuma. A conta Resend já tem `send.rodrigobondioli.com` verificado
  (SPF/DKIM) e uma chave só de envio travada nesse domínio. As variáveis
  estão em `.env.example`; sem elas a rota responde 500 e o formulário mostra
  o caminho manual em vez de engolir o que a pessoa escreveu.
- **Legenda do YouTube:** `cc_load_policy=0` é só sugestão. O player recarrega o
  módulo de legenda a cada volta do loop. Só segura chamando `unloadModule`
  (nos dois nomes, `captions` e `cc`) de tempos em tempos enquanto toca.
- **Imagens dos projetos** estão em `public/projects/<slug>/`. O CMS do Framer
  guardava URLs de `framerusercontent.com`; `src/content/assets.json` traduz
  URL → arquivo local, e `asset()` em `src/lib/projects.ts` faz a busca.
- **`_site-v2-descarte/`, `site-v2/`, `quak/`, `antipato/`** e afins são entulho
  do repo antigo. Estão no `.gitignore` e fora do `tsconfig`. Não entram no build.

## Animações — o que já deu errado

- **`MaskReveal`** revela por `clip-path`, amarrado ao scroll (rAF + IO), não
  por `transition`. Três coisas fazem ele falhar de forma intermitente, e as
  três já aconteceram: `rootMargin` curto no IntersectionObserver (o loop
  começa com progresso já em 1 e a peça aparece inteira); imagem sem
  `width`/`height` intrínsecos (caixa de altura zero antes do load, progresso
  calculado errado); e máscara aplicada no HTML de origem (reload no meio da
  página faz a peça saltar de invisível pra inteira). Hoje: folga de uma
  janela inteira, dimensões em toda `<img>` dentro dele, e o HTML nasce limpo
  — quem põe a máscara é o efeito.
- **`lag`** desencontra uma grade: a peça espera mais um tanto da janela antes
  de largar. O valor vem de hash do índice, **nunca `Math.random`** — o
  servidor e o navegador têm que chegar no mesmo número, senão é erro de
  hidratação.
- **Perspectiva aumenta o que está na frente.** No `PillButton`, a face em
  `translateZ(10px)` com `perspective(280px)` renderiza 3,7% maior que a
  caixa, e a última letra batia na janela do recorte. A folga lateral no
  `.mask` (com margem negativa devolvendo a largura) é o que conserta — não
  mexer nela achando que é sobra.
- **`MeetingBar`** entra depois que o hero sai e sai de novo quando a seção
  amarela (`.on-accent`, `#contact`) alcança a altura dela.

## Responsivo: três degraus e uma curva

O site tem **exatamente três breakpoints** — `640`, `900`, `1100`. Não
existe um quarto. Um valor novo (620, 768, 1024…) é sinal de que a regra
está compensando um layout que não flexiona; conserte o layout ou suba/desça
pro degrau vizinho.

- **640** — celular: gutter já está em 16, grade do arquivo vira uma coluna,
  herói empilha, overline sobe pra 12px.
- **900** — tablet: grade do arquivo em duas colunas, rodapé empilha, faixa
  de números solta a altura fixa.
- **1100** — o bloco de duas colunas da página de projeto vira uma.

**Por que o rodapé quebra em 900 e não em 640:** medido, em 641px os três
blocos somam 528px numa caixa de 518. Em fila eles estouram *antes* de
chegar no celular, então a quebra sobe pro degrau de cima. Não baixe isso
sem medir de novo.

**Existe uma única consulta de altura**, `@media (max-height: 560px)`, no
herói da `/work`. Ela não é um quarto degrau — os três degraus são de
largura. Ela existe porque a faixa de números é `position: absolute`
presa no fundo de um herói com `min-height: 100svh`: em tela baixa
(celular deitado, janela de desktop achatada) o herói cresce além da
janela e leva a faixa junto. Medido antes da correção: 47px de
sobreposição em 932×430, 30px em 1024×500, 25px em 1180×560, e em
844×390 a faixa inteira fora da tela. A correção tira a faixa do
absoluto. **Um bug de tela baixa não se conserta com breakpoint de
largura** — foi o que deixou esse passar: 844 de largura é "desktop".

**O gutter não usa media query.** É uma curva só:

    --gutter: max(16px, min(24.375vw - 101px, 8.6vw, 124px));

Até 480 dá 16 (celular). De 480 a 640 sobe em reta até encostar exatamente
nos 8.6vw. De 640 pra cima é o 8.6vw do Framer, travado em 124. As três
pernas se encontram nos mesmos valores nas junções — arrastar a janela não
produz salto. O `@media` que existia aqui fazia 55px virar 16px ao cruzar
641. **Todo valor de 640 pra cima é idêntico ao do Framer**; mexer na curva
quebra a paridade de pixel do desktop inteiro.

## Idioma

O site é **em inglês**. Isso vale pro texto visível, `alt`, `aria-label` e
`title` — comentário de código e mensagem de commit seguem em português.

## Onde vai cada arquivo

| o quê | pasta |
|---|---|
| fotos, avatar, logos do site | `public/images/` |
| assets da página `/work` | `public/site/` |
| vídeos | `public/video/` |
| imagens dos projetos | `public/projects/<slug>/` |
| logos de cliente | `public/logos/` |
