"use client"

import { useState } from "react"
import styles from "./YouTube.module.css"

/**
 * Fachada do YouTube: só a thumb até o clique. O iframe pesa ~1MB e trava
 * o carregamento; a thumb pesa 30KB. O vídeo só entra quando é pedido.
 */
export default function YouTube({
  id,
  title,
  start,
  className,
}: {
  id: string
  title: string
  start?: number
  className?: string
}) {
  const [on, setOn] = useState(false)
  const src =
    `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` +
    (start ? `&start=${start}` : "")

  return (
    <div className={`${styles.frame} ${className ?? ""}`}>
      {on ? (
        <iframe
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      ) : (
        <button className={styles.facade} onClick={() => setOn(true)} type="button">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`}
            alt=""
            loading="lazy"
          />
          <span className={styles.play} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="#fff">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className={styles.label}>{title}</span>
        </button>
      )}
    </div>
  )
}
