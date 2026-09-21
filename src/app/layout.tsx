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
      <body>{children}</body>
    </html>
  )
}
