"use client"

import { useEffect, useRef } from "react"
import styles from "./TypeBand.module.css"

/**
 * A faixa de tipo gigante que corre atrás do vídeo na capa do media kit.
 *
 * É a maior superfície animada do site, e por isso ela tem regras que o
 * ticker de pílulas da /work não precisa ter:
 *
 * 1. Duas cópias, e cada uma mede pelo menos a largura da faixa
 *    (`100cqw` — consulta de contêiner, não `vw`, que contaria a barra de
 *    rolagem). Andando meia pista o desenho volta ao do começo, e o que
 *    sobra depois do deslocamento nunca é menor que a tela: não abre
 *    buraco em monitor nenhum, e a pista não cresce além do necessário.
 *    Medido antes: 6.904px de pista. Numa tela retina isso passa de
 *    13.800px de textura — além do limite de uma textura só, o navegador
 *    fatia a camada e volta a rasterizá-la enquanto a página rola.
 *
 * 2. `will-change` promove a camada uma vez, como no logo da capa.
 *
 * 3. Ela para quando sai da tela. A capa é a primeira dobra; o resto da
 *    página são milhares de pixels de rolagem em que uma animação infinita
 *    continuaria custando quadro a quadro, sem ninguém ver.
 */
export default function TypeBand({
  text,
  className = "",
}: {
  text: string
  /** posicionamento fica com quem usa: a faixa só sabe correr */
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver !== "function") return

    const io = new IntersectionObserver(
      ([entry]) => node.classList.toggle(styles.parada, !entry.isIntersecting),
      { rootMargin: "200px" }
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])

  return (
    <div className={`${styles.band} ${className}`} ref={ref} aria-hidden="true">
      <div className={styles.track}>
        {[0, 1].map((copy) => (
          <p className={styles.copy} key={copy}>
            {text}
          </p>
        ))}
      </div>
    </div>
  )
}
