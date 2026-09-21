import Link from "next/link"
import PillButton from "./PillButton"
import styles from "./SiteNav.module.css"

/**
 * Navegação do topo. Medidas do Framer: nome em 12.8px, pílula de 48px de
 * altura com padding lateral de 24 e texto preto sobre o rosa.
 */
export default function SiteNav({
  dark = false,
  ctaHref = "#contact",
  back = false,
}: {
  dark?: boolean
  /* nas páginas de projeto não existe âncora #contact: o formulário está
     na /work, então o botão aponta pra lá */
  ctaHref?: string
  /* a página de projeto troca o papel da navegação: em vez de marca à
     esquerda e ação à direita, ela oferece a saída — "Back to portfolio",
     sublinhado, em 12.8px, antes da pílula */
  back?: boolean
}) {
  return (
    <header className={`${styles.nav} ${dark ? styles.dark : ""}`}>
      <Link href="/work" className={styles.brand}>
        <strong>Rodrigo Bondioli</strong>
        <span className={styles.dot}>·</span>
        <span className={styles.role}>Nexialist Designer</span>
      </Link>
      {back ? (
        <Link href="/work#projects" className={styles.back}>
          Back to portfolio
        </Link>
      ) : null}
      <PillButton href={ctaHref}>Say hello</PillButton>
    </header>
  )
}
