import Link from "next/link"
import styles from "./SiteNav.module.css"

/**
 * Navegação do topo. Nome à esquerda, CTA à direita.
 * Fica sobre o conteúdo (position fixed) e não empurra o hero.
 */
export default function SiteNav({ dark = false }: { dark?: boolean }) {
  return (
    <header className={`${styles.nav} ${dark ? styles.dark : ""}`}>
      <Link href="/work" className={styles.brand}>
        <strong>Rodrigo Bondioli</strong>
        <span className={styles.dot}>·</span>
        <span className={styles.role}>Nexialist Designer</span>
      </Link>
      <a href="mailto:hello@rodrigobondioli.com" className={styles.cta}>
        Say hello
      </a>
    </header>
  )
}
