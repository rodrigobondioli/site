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
- [x] `/mediakit` — conteúdo em `src/content/mediakit.json` (era `/mediakit/home`
      no Framer; a URL nova é `/mediakit`). Números e estrutura medidos no
      Framer, roupa da `/work` — decisão do Rodrigo em 23/09/2026.

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
npm run build   # build de produção (.next)
npm run start   # serve o build em localhost:3000
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
- **Rodapé:** as redes ficam no centro da PÁGINA, não no meio do que sobra.
  São três colunas (`1fr auto 1fr`), e não um `space-between` de três
  filhos — com space-between o bloco do meio só cai no centro se as duas
  pontas tiverem a mesma largura, e não têm (logo 44, assinatura ~190).
  Medido antes da correção: 55px à esquerda do centro, em todas as páginas.
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

    --gutter: max(16px, min(14vw - 51.2px, 6vw, 124px));

Até 480 dá 16 (celular). De 480 a 640 sobe em reta até encostar
exatamente nos 6vw. De 640 pra cima é 6vw, travado em 124 (que só chega
em ~2070px). As três pernas se encontram nos mesmos valores nas junções —
arrastar a janela não produz salto. O `@media` que existia aqui fazia 55px
virar 16px ao cruzar 641.

**Era 8.6vw, o valor do Framer.** Em 22/09/2026 o Rodrigo decidiu soltar a
paridade só aqui: 8.6vw dava 124px de cada lado já em 1440 (17% da tela de
margem). Com 6vw são 86 em 1440, 77 em 1280, 54 em 900. O resto do layout
continua medido contra o Framer — comparar posições horizontais com ele
agora tem que descontar a diferença de margem.

## O que a `/mediakit` não herdou do Framer

A página foi medida lá (getComputedStyle, como o resto), mas o desenho
final é o da `/work`: mesmo `SiteNav`, `SiteFooter`, `MeetingBar`,
`YouTube`, `MaskReveal` e `Brands`, cabeçalho de seção com régua, canto
vivo e hairline de `--rule`. Ficaram pra trás, de propósito: o raio de
16px dos cards, os paddings de 40/56 (aqui são `--s3`/`--s4`), a fita
adesiva colada no vídeo e o roxo #822DFF — o roxo é o `--accent-violet`
do sistema, escolha do Rodrigo. O "Say hello" atravessa pra
`/work#contact`: esta página não tem formulário.

A faixa gigante da capa ("MEDIA KIT —") é `min(288px, 20vw)`: 288 é a
medida do Framer e vale de 1440 pra cima. No celular ela sai de trás do
vídeo e desce pro fim do herói — atrás dele viraria um caco de letra de
cada lado.

O vídeo da capa é o mesmo `eu-profile.mp4` do "about" da `/work` (o
arquivo do Framer é byte a byte o mesmo). O retrato do "about" daqui é
novo: `public/images/rodrigo-retrato.webp`.

O `mediakit.json` deixou de ser o despejo do Framer (uma lista de textos
com nome de estilo) e virou conteúdo com forma: números, países, faixas
etárias, formatos, vídeos. O despejo antigo não tinha a faixa de dez
números que a página mostra — ela não existia no arquivo, só na tela.

## Números ao vivo na `/mediakit`

O que é público vem da YouTube Data API, uma vez por dia (`revalidate` de
24h na página): **inscritos**, **total de vídeos** e os **quatro vídeos
mais vistos** do canal — por isso a seção chama "Most watched", e não
"Editor's choice": o título tem que dizer o que a lista faz. Shorts ficam
de fora (a grade é 16:9; o corte é por duração, abaixo de 3 minutos).

Regras do `src/lib/youtube.ts`, nenhuma opcional:

- **Sem `YOUTUBE_API_KEY`, nem tenta** — devolve nulo sem tocar na rede, e
  tudo cai no `mediakit.json`. O build tem que rodar offline, pelo mesmo
  motivo das fontes auto-hospedadas.
- **Falha não derruba build**: timeout de 4s, `try/catch` em tudo, JSON
  como rede. Número velho é melhor que página que não sobe.
- **A chave nunca vai pro navegador.** É lida no servidor, no build e na
  revalidação.
- A ordenação sai da playlist de uploads, não de `search?order=viewCount`:
  a busca custa 100 unidades de cota, atrasa e não devolve as views pra
  conferir. Assim são ~5 unidades por atualização, de 10.000 por dia.

O **"Last updated"** da capa é a data da busca, não uma constante: sai do
mesmo `dadosDoCanal()`, no fuso de São Paulo (o build da Vercel roda em
UTC, e depois das 21h aqui a data viraria "amanhã"). Sem API, ele volta a
ser a data escrita no JSON — que nesse caso é a verdade.

O resto do kit — impressões, CTR, retenção, crescimento, idade, gênero,
países — vive na YouTube Analytics API, que exige OAuth do dono do canal.
Ainda não é feito; esses números continuam na mão no JSON. Ou seja: a data
da capa fala pelos números automáticos, não pelos do JSON.

**O "12.0% de engajamento" e o "top 10%" não são campos de API nenhuma.**
São contas. Se um dia forem automatizados, a fórmula tem que ser decidida
antes — senão vira número oficial inventado.

## A barra "Book a call"

O `MeetingBar` é o mesmo componente em todas as páginas, e o que muda é
**quem manda nele entrar e sair**:

- **Entrar:** o piso é sempre a altura medida da navegação — enquanto o
  "Say hello" do topo estiver na tela, seriam dois convites ao mesmo tempo.
  `entraApos` é um piso a mais, em frações da janela. Na `/work` ele é 0.9
  porque lá o herói termina com a faixa de números presa no rodapé da tela,
  e a barra entrando antes sentaria em cima dela. Na `/mediakit` é 0: não
  há faixa, e ela entra assim que o botão do topo some.
- **Sair:** `hideOver`. O padrão é `.on-accent, #contact` — o amarelo do
  fecho, onde o convite já ocupa a página inteira. Em página sem contato
  (o media kit) quem a esconde é o `footer`, senão ela termina sentada em
  cima das redes.

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
