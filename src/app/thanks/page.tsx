import type { Metadata } from "next"
import styles from "./thanks.module.css"

export const metadata: Metadata = {
  title: "Thanks",
  robots: { index: false, follow: false },
}

/**
 * /thanks — confirmação pós-formulário.
 *
 * No Framer eram duas linhas separadas por réguas de 1px dentro de uma caixa
 * com borda branca, sobre uma foto de fundo. Mantido, mas:
 *   - a altura era 100vh fixa, que no iOS corta por causa da barra de URL →
 *     agora é 100svh
 *   - o padding de 124px lateral virou o gutter fluido
 */
export default function ThanksPage() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <hr className={styles.rule} />
        <p className="h4">Thanks for getting in touch.</p>
        <hr className={styles.rule} />
        <p className="h4">I&rsquo;ll get back to you soon.</p>
        <hr className={styles.rule} />
      </div>
    </main>
  )
}
