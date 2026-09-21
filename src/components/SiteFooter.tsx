import Link from "next/link"
import { Logo } from "./Logo"
import styles from "./SiteFooter.module.css"

/**
 * Rodapé do site.
 *
 * Três blocos: logo à esquerda, redes ao centro, assinatura à direita.
 * No Framer isso era um space-between de três filhos, que no celular
 * espremia tudo numa linha só. Aqui vira coluna centralizada abaixo de
 * 720px — cada bloco ganha a própria linha.
 *
 * O separador "/" entre as redes é desenhado com ::before em vez de virar
 * nó de texto. Assim ele nunca sobra sozinho se um link for removido —
 * que foi exatamente o bug do separador órfão nos metadados de projeto.
 */

const SOCIAL = [
  { label: "Instagram", href: "https://instagram.com/falabondioli" },
  { label: "Substack", href: "https://falabondioli.substack.com" },
  { label: "Youtube", href: "https://youtube.com/@falabondioli" },
  { label: "Linkedin", href: "https://linkedin.com/in/bondioli" },
]

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className={`${styles.footer} section`}>
      <div className={`${styles.inner} container`}>
        <Link href="/" className={styles.logo} aria-label="Rodrigo Bondioli — home">
          {/* sem title: o aria-label do link já nomeia isto */}
          <Logo size={44} />
        </Link>

        <nav aria-label="Social">
          <ul className={styles.social}>
            {SOCIAL.map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <p className={styles.signature}>
          Always made with love
          <span className={styles.mark} aria-hidden="true" />
          {year}
        </p>
      </div>
    </footer>
  )
}
