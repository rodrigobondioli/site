# design.md — rodrigobondioli.com (Home)

Inventário da Home do site Framer, para reconstrução fiel em código.
Capturado do site ao vivo em 2026-07-09.

## Meta
- Title: `BOND | Strategic Product Designer`
- Description: `Strategic Product Designer pra pensar o produto antes de executar.`
- OG image: framerusercontent.com/images/VgXXe3toz0HOKc5Hf4LjaRVKSiQ.png
- Idioma da Home: PT-BR (a /portfolio é EN — fora de escopo por ora)

## Paleta (exata, do computed style)
- Fundo claro: `#F1F1F1` (rgb 241,241,241)
- Branco: `#FFFFFF`
- Tinta/texto: `#101010` (rgb 16,16,16)
- Magenta (accent): `#FF00D7` (rgb 255,0,215)
- Lime (fundo do logo "b"): `#E7F99A` (rgb 231,249,154)
- Seção escura (contato): ~`#1a1a1a` (rgba 34,34,34,.8 sobre preto) com leve gradiente/streak diagonal
- Texto suave: `rgba(0,0,0,.5)`
- Link azul default do form honeypot: ignorar

## Tipografia
- Corpo/labels: **Inter** (400/500/600/700). Labels em uppercase, weight 600, letter-spacing ~1.12px, ~11.2px.
- Headings display: **Rooftop Mono Bold** — ATENÇÃO: no site é a versão **TRIAL** ("TRIAL Rooftop Mono Bold"). Risco de licença em produção.
  - Substituto livre no rebuild: **Martian Mono** 700 (Google Fonts). Trocar pela Rooftop licenciada quando/se comprar.
  - Uso: "TEM ALGO NA CABEÇA? DÁ O PAPO." (24px, 700, uppercase, branco).

## Estrutura da Home (topo → base)
1. **Nav** (fixa): logo "b" (esq) + botão pill "Say hello → " (dir).
   - Pill: 158×48, bg branco, radius 99px, padding 12/24, texto Inter 500 #101010 + seta. Link → WhatsApp.
2. **Hero** (centralizado):
   - Linha de labels topo: `RODRIGO BONDIOLI` (esq) · `SINCE 2005` (dir).
   - Imagem central: 400×536, object-fit cover, sem radius. Foto do Rodrigo (camiseta branca, braço tatuado, fundo azul, efeito dupla-exposição). URL: framerusercontent.com/images/xULmS8qQVmHPJmkGd2SFiU7RzA.png (527×706 natural).
   - Linha base: underline magenta (56×4) à esq · `STRATEGIC PRODUCT DESIGNER` à dir.
3. **Marquee de logos** (ticker horizontal, passa ATRÁS da foto hero, cinza claro, loop infinito):
   - Marcas: Nike, Coca-Cola, Vivo, L'Oréal Paris, Harley-Davidson, Unilever, Havaianas (conjunto repete).
   - No Framer são SVGs inline. No rebuild: recriados fiéis (vetores grandes não exportáveis pelo canal).
4. **Disclaimer**: `Logos indicam histórico de atuação e colaboração; não implicam endosso.` (12.8px, rgba(0,0,0,.5))
5. **Seção Contato** (fundo escuro):
   - Ícone de xícara de café (line art).
   - H2: `TEM ALGO NA CABEÇA? DÁ O PAPO.` (Rooftop/Martian Mono, uppercase).
   - Subtexto: `Deixe seu contato aqui embaixo e me conta qual é o seu desafio ou o seu momento atual. Se o papo render um café, a gente marca de conversar.`
   - Form: campos underline transparentes, texto branco — Nome, Email, Empresa, "Escreva aqui a sua mensagem" (textarea). + honeypot (website/company hidden).
   - Botão `Enviar mensagem`: pill magenta #FF00D7, texto branco bold.
   - Link: `Clique aqui se você quer aplicar para minha mentoria` → tally.so/r/0QDr7j
6. **Footer**: `Youtube / Instagram / Substack` + `Política de Privacidade / Termos de Uso`.
   - Youtube → youtube.com/@falabondioli · Instagram → instagram.com/falabondioli · Substack → falabondioli.substack.com

## Links
- Say hello / WhatsApp: wa.me/5511932001431?text=Fala%20Bond!%20Vim%20do%20seu%20site%20e...
- Mentoria: tally.so/r/0QDr7j

## Pendências de fidelidade (decidir com Rodrigo)
1. **Fonte Rooftop Mono**: usar substituto livre (Martian Mono) ou comprar licença Rooftop.
2. **Foto hero**: hotlink do CDN Framer por ora; localizar o arquivo antes de deletar o projeto Framer.
3. **Logos das marcas**: recriados; trocar por SVGs oficiais exatos se quiser 100%.
4. **Form backend**: v1 abre WhatsApp com os dados preenchidos (zero backend). Alternativa: Formspree p/ capturar e-mail.
