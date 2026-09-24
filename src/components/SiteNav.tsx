import Link from "next/link"
import PillButton from "./PillButton"
import RollLabel from "./RollLabel"
import styles from "./SiteNav.module.css"

/**
 * Navegação do topo. Medidas do Framer: nome em 12.8px, pílula de 48px de
 * altura com padding lateral de 24 e texto preto sobre o rosa.
 */
export default function SiteNav({
  dark = false,
  ctaHref = "#contact",
  back = false,
  brandHref = "/",
}: {
  dark?: boolean
  /* nas páginas de projeto não existe âncora #contact: o formulário está
     na /work, então o botão aponta pra lá */
  ctaHref?: string
  /* a página de projeto troca o papel da navegação: em vez de marca à
     esquerda e ação à direita, ela oferece a saída — "Back to portfolio",
     sublinhado, em 12.8px, antes da pílula */
  back?: boolean
  /* o nome sobe um nível: da capa vai pra /work, e de dentro de um projeto
     volta pro arquivo */
  brandHref?: string
}) {
  return (
    <header className={`${styles.nav} ${dark ? styles.dark : ""}`}>
      {/* O nome sobe um nível. Na capa isso é a /work; dentro de um projeto
          é o arquivo — e no celular, onde o "Back to portfolio" não aparece,
          é a única volta que existe. */}
      <Link href={brandHref} className={`no-underline ${styles.brand}`}>
        <strong>Rodrigo Bondioli</strong>
        <span className={styles.dot}>·</span>
        <span className={styles.role}>Digital Product Strategist</span>
      </Link>
      {back ? (
        <Link href="/work#projects" className={styles.back} data-roll-host="">
          <RollLabel text="Back to portfolio" underline />
        </Link>
      ) : null}
      <PillButton href={ctaHref}>Say hello</PillButton>
    </header>
  )
}
