import type { Metadata } from "next"
import Preloader from "@/components/Preloader"
import { display, body } from "./fonts"
// o CSS que o Lenis pede: altura automática no html, trava que respeita
// `stop()`, iframes sem ponteiro durante o scroll suave
import "lenis/dist/lenis.css"
import "@/styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://rodrigobondioli.com"),
  title: {
    default: "Rodrigo Bondioli — Nexialist Designer",
    template: "%s — Rodrigo Bondioli",
  },
  description:
    "Rodrigo Bondioli brings design and AI together, with more than 20 years leading design for startups and global brands.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://rodrigobondioli.com",
    siteName: "Rodrigo Bondioli",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    /* `data-loading` entra no <html> quando o módulo do Preloader é
       avaliado — antes da hidratação, de propósito (é o que impede os
       efeitos de começarem atrás da cortina). O React compara o HTML do
       servidor com o do navegador e reclama do atributo a mais; é o mesmo
       caso do <body> logo abaixo, e a marca é justamente algo que o
       servidor não tem como ter. */
    <html
      lang="en"
      className={`${display.variable} ${body.variable}`}
      suppressHydrationWarning
    >
      {/* Extensões (ColorZilla, gramática, gerenciadores de senha) injetam
          atributos no <body> antes do React montar. O aviso de hidratação
          que sai disso não é do nosso código e não tem o que consertar. */}
      <body suppressHydrationWarning>
        {/* Sem JS a tela de carregamento nunca sairia — então sem JS ela
            também não entra. O conteúdo está no HTML de qualquer jeito. */}
        <noscript>
          <style>{`[data-preloader]{display:none!important}`}</style>
        </noscript>
        <Preloader />
        {children}
      </body>
    </html>
  )
}
