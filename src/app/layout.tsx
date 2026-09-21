import type { Metadata } from "next"
import { display, body } from "./fonts"
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
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      {/* Extensões (ColorZilla, gramática, gerenciadores de senha) injetam
          atributos no <body> antes do React montar. O aviso de hidratação
          que sai disso não é do nosso código e não tem o que consertar. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
