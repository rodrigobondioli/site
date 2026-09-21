import localFont from "next/font/local"

/**
 * Duas famílias, só. Decisão do Rodrigo em 21/09.
 *
 * Alpha Lyrae  → títulos.  SIL Open Font License 1.1, © 2021 Fontfabric.
 * Inter        → todo o resto. SIL Open Font License 1.1.
 *
 * Ambas self-hospedadas em public/fonts. Nenhuma requisição externa, nem em
 * runtime nem no build — o build roda offline. (Chegamos aqui porque
 * `next/font/google` falha em rede sem acesso ao fonts.googleapis.com, e um
 * build que depende de rede é um build que um dia quebra sozinho.)
 *
 * `display: swap` + fallback métrico: o texto aparece na hora, na fonte de
 * sistema, e troca sem empurrar o layout quando a real carrega.
 */

export const display = localFont({
  src: [{ path: "../../public/fonts/AlphaLyrae-Medium.woff2", weight: "500", style: "normal" }],
  variable: "--font-display",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
  adjustFontFallback: "Arial",
})

export const body = localFont({
  src: [
    { path: "../../public/fonts/inter-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/inter-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/inter-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/inter-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
  adjustFontFallback: "Arial",
})
