"use client"

import { useEffect, useRef, useState } from "react"
import styles from "./YouTube.module.css"

/**
 * Dois modos.
 *
 * Padrão: fachada. Só a thumb até o clique — o iframe do YouTube pesa
 * perto de 1MB e não vale carregar três deles na abertura da página.
 *
 * autoplay: toca sozinho, mudo e em loop, sem controles. O clique liga o
 * som (unMute pela API do iframe, sem carregar a biblioteca do YouTube:
 * é um postMessage). Só monta quando entra na tela — no topo da página
 * ele seria 1MB baixado antes de alguém ver.
 */

type Props = {
  id: string
  title: string
  start?: number
  className?: string
  hideLabel?: boolean
  autoplay?: boolean
}

export default function YouTube({
  id,
  title,
  start,
  className,
  hideLabel = false,
  autoplay = false,
}: Props) {
  const [on, setOn] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [sound, setSound] = useState(false)
  const host = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)

  // no modo autoplay o iframe só nasce quando a seção chega na tela
  useEffect(() => {
    if (!autoplay || mounted) return
    const node = host.current
    if (!node || typeof IntersectionObserver !== "function") {
      setMounted(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMounted(true)
          io.disconnect()
        }
      },
      { rootMargin: "200px" }
    )
    io.observe(node)
    return () => io.disconnect()
  }, [autoplay, mounted])

  function command(func: string, args: unknown[] = []) {
    frame.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "*"
    )
  }

  /**
   * Desliga a legenda de verdade.
   *
   * cc_load_policy=0 é só uma sugestão: se a pessoa tem legenda ligada por
   * padrão na conta do YouTube, ou se o vídeo tem legenda automática, o
   * player liga assim mesmo. O jeito que funciona é descarregar o módulo —
   * "captions" no player antigo, "cc" no HTML5, e os dois nomes custam o
   * mesmo. E repetir: o player recarrega o módulo quando o vídeo começa,
   * então uma chamada só no load não segura.
   */
  function killCaptions() {
    command("unloadModule", ["captions"])
    command("unloadModule", ["cc"])
  }

  function toggleSound() {
    const next = !sound
    setSound(next)
    command(next ? "unMute" : "mute")
  }

  const base = "https://www.youtube-nocookie.com/embed/" + id
  const clickSrc = `${base}?autoplay=1&rel=0${start ? `&start=${start}` : ""}`
  const autoSrc =
    `${base}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&rel=0` +
    `&playsinline=1&modestbranding=1&disablekb=1&cc_load_policy=0&iv_load_policy=3&enablejsapi=1`

  if (autoplay) {
    return (
      <div className={`${styles.frame} ${className ?? ""}`} ref={host}>
        {mounted ? (
          <iframe
            ref={frame}
            src={autoSrc}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture"
            tabIndex={-1}
            onLoad={() => {
              ;[0, 300, 900, 2000, 4000].forEach((ms) =>
                window.setTimeout(killCaptions, ms)
              )
            }}
          />
        ) : null}
        <button
          className={styles.soundToggle}
          onClick={toggleSound}
          type="button"
          aria-pressed={sound}
        >
          <span className="sr-only">
            {sound ? `Mute ${title}` : `Play sound for ${title}`}
          </span>
          <span className={styles.soundBadge} aria-hidden="true">
            {sound ? <IconSoundOn /> : <IconSoundOff />}
            {sound ? "Sound on" : "Sound off"}
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className={`${styles.frame} ${className ?? ""}`}>
      {on ? (
        <iframe
          src={clickSrc}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      ) : (
        <button className={styles.facade} onClick={() => setOn(true)} type="button">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`} alt="" loading="lazy" />
          <span className={styles.play} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="#fff">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          {hideLabel ? null : <span className={styles.label}>{title}</span>}
        </button>
      )}
    </div>
  )
}

function IconSoundOff() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="m17 9 4 6M21 9l-4 6" />
    </svg>
  )
}

function IconSoundOn() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  )
}
