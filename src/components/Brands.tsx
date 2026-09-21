import styles from "./Brands.module.css"

/**
 * A lista de marcas. O label vem no mesmo invólucro do meta row do case —
 * overline com régua fina embaixo — e as marcas abaixo, no tipo do
 * manifesto. Cada nome leva pro site oficial; o hover sublinha só a
 * palavra, sem mudar cor nem peso.
 *
 * Os nomes ficam aqui, não no texto corrido da bio: assim dá pra mexer na
 * lista sem reescrever o parágrafo.
 */

const BRANDS: [string, string][] = [
  ["Coca-Cola", "https://www.coca-cola.com"],
  ["Unilever", "https://www.unilever.com"],
  ["Vivo", "https://www.vivo.com.br"],
  ["Itaú", "https://www.itau.com.br"],
  ["Havaianas", "https://www.havaianas.com.br"],
  ["Fiat", "https://www.fiat.com.br"],
  ["Nike", "https://www.nike.com"],
  ["Vale", "https://www.vale.com"],
  ["Harley Davidson", "https://www.harley-davidson.com"],
  ["Ford", "https://www.ford.com"],
]

export default function Brands({ label }: { label: string }) {
  return (
    <div className={styles.wrap}>
      <p className={`overline ${styles.label}`}>{label}</p>
      <p className={styles.line}>
        {BRANDS.map(([name, href], i) => (
          <span key={name}>
            <a
              className={styles.brand}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {name}
            </a>
            {i < BRANDS.length - 1 ? ", " : ""}
          </span>
        ))}
      </p>
    </div>
  )
}
