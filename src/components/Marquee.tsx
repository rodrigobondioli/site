import styles from "./Marquee.module.css"

/**
 * Ticker das capacidades. Duas cópias da lista lado a lado e uma animação
 * de -50% — some o pulo do loop sem JS. Inclinação -3°, como no Framer.
 */
export default function Marquee({
  items,
  speed = 70,
}: {
  items: string[]
  speed?: number
}) {
  // duração = distância / velocidade. Lista maior anda proporcionalmente mais.
  const duration = Math.max(18, Math.round((items.length * 260) / speed))

  return (
    <div className={styles.viewport} aria-hidden="true">
      <div
        className={styles.track}
        style={{ animationDuration: `${duration}s` }}
      >
        {[0, 1].map((copy) => (
          <ul className={styles.list} key={copy}>
            {items.map((item) => (
              <li className={styles.pill} key={`${copy}-${item}`}>
                {item}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}
