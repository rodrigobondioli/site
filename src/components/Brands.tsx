import styles from "./Brands.module.css"

/**
 * A lista de marcas. O label vem no mesmo invólucro do meta row do case —
 * overline com régua fina embaixo — e as marcas abaixo, no tipo do
 * manifesto. Cada nome leva pro site oficial; o hover sublinha só a
 * palavra, sem mudar cor nem peso.
 *
 * Os nomes ficam aqui, não no texto corrido da bio: assim dá pra mexer na
 * lista sem reescrever o parágrafo.
 *
 * Ordem alfabética, de propósito. Com dez nomes qualquer ordem passa por
 * curadoria; com dezenove, a ordem vira ranking — quem lê entende que os
 * primeiros são os melhores. O alfabeto não diz nada sobre ninguém.
 */

const BRANDS: [string, string][] = [
  ["Banco do Brasil", "https://www.bb.com.br"],
  ["Chevrolet", "https://www.chevrolet.com.br"],
  ["Cinemark", "https://www.cinemark.com.br"],
  ["Coca-Cola", "https://www.coca-cola.com"],
  ["Embratel", "https://www.embratel.com.br"],
  ["Fiat", "https://www.fiat.com.br"],
  ["Ford", "https://www.ford.com"],
  ["Harley Davidson", "https://www.harley-davidson.com"],
  ["Havaianas", "https://www.havaianas.com.br"],
  ["Itaú", "https://www.itau.com.br"],
  ["Kopenhagen", "https://www.kopenhagen.com.br"],
  ["L\u2019Oréal Paris", "https://www.loreal-paris.com.br"],
  ["Moto Guzzi", "https://www.motoguzzi.com"],
  ["Natura", "https://www.natura.com.br"],
  ["Nike", "https://www.nike.com"],
  ["Sony", "https://www.sony.com"],
  ["Unilever", "https://www.unilever.com"],
  ["Vale", "https://www.vale.com"],
  ["Vivo", "https://www.vivo.com.br"],
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
