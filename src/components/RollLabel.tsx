import styles from "./RollLabel.module.css"

/**
 * O rótulo que dá a cambalhota no hover — duas faces de um cubo girando no
 * eixo X. A de cima sai, a de baixo entra, e as duas são o mesmo texto:
 * quem olha vê o elemento "virar", não trocar de palavra.
 *
 * Vive fora do PillButton porque não é só dele: é o hover do site. Quem
 * usa marca o próprio elemento com `data-roll-host` — é dele que vem o
 * hover, não deste invólucro, senão o giro só aconteceria quando o mouse
 * passasse exatamente por cima das letras.
 *
 * A altura da janela vem de `--roll-h` (20px por padrão, a entrelinha da
 * pílula). Quem tiver outro tamanho de texto declara o seu.
 *
 * `underline` existe porque `text-decoration` não é herdada e a janela é
 * uma caixa atômica: o sublinhado do link não alcança as faces sozinho.
 * Link de texto liga; botão e card não.
 *
 * A segunda face é `aria-hidden`: leitor de tela lê a palavra uma vez só.
 */
export default function RollLabel({
  text,
  underline = false,
}: {
  text: string
  underline?: boolean
}) {
  return (
    <span className={`${styles.mask} ${underline ? styles.underlined : ""}`}>
      <span className={styles.roll}>
        <span className={`${styles.face} ${styles.front}`}>{text}</span>
        <span className={`${styles.face} ${styles.back}`} aria-hidden="true">
          {text}
        </span>
      </span>
    </span>
  )
}
