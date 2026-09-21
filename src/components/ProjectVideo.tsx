"use client"

import { useEffect, useRef, useState } from "react"
import YouTube from "./YouTube"
import styles from "./ProjectVideo.module.css"

/**
 * O vídeo de um projeto. Cinco dos dezesseis têm um, e vêm de três lugares
 * diferentes: YouTube, Vimeo e MP4 servido por nós. Em vez de espalhar três
 * condicionais pela página, a escolha acontece aqui.
 *
 * Os três se comportam igual ao vídeo da home: tocam sozinhos, mudos e em
 * loop, sem controles, e o clique libera o som. O selo no canto avisa o
 * estado — é o que faz a pessoa entender que dá pra clicar.
 */

function vimeoId(url: string): string | null {
  return url.match(/vimeo\.com\/(\d+)/)?.[1] ?? null
}

function youtubeId(url: string): string | null {
  return (
    url.match(/[?&]v=([\w-]+)/)?.[1] ?? url.match(/youtu\.be\/([\w-]+)/)?.[1] ?? null
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

/** A camada de clique e o selo. Igual nos três, pra não haver três jeitos
 *  diferentes de dizer a mesma coisa. */
function SoundToggle({
  on,
  title,
  onToggle,
}: {
  on: boolean
  title: string
  onToggle: () => void
}) {
  return (
    <button className={styles.soundToggle} onClick={onToggle} type="button" aria-pressed={on}>
      <span className="sr-only">{on ? `Mute ${title}` : `Play sound for ${title}`}</span>
      <span className={styles.soundBadge} aria-hidden="true">
        {on ? <IconSoundOn /> : <IconSoundOff />}
        {on ? "Sound on" : "Sound off"}
      </span>
    </button>
  )
}

function VimeoPlayer({ id, title }: { id: string; title: string }) {
  const [sound, setSound] = useState(false)
  const frame = useRef<HTMLIFrameElement>(null)

  /* O Vimeo também fala por postMessage, só que o vocabulário é outro:
     {method, value} em vez do {event, func, args} do YouTube. */
  const send = (method: string, value?: unknown) =>
    frame.current?.contentWindow?.postMessage(JSON.stringify({ method, value }), "*")

  const toggle = () => {
    const next = !sound
    setSound(next)
    send("setVolume", next ? 1 : 0)
  }

  return (
    <div className={styles.frame}>
      <iframe
        ref={frame}
        src={`https://player.vimeo.com/video/${id}?autoplay=1&muted=1&loop=1&background=1&dnt=1`}
        title={title}
        allow="autoplay; picture-in-picture"
        tabIndex={-1}
      />
      <SoundToggle on={sound} title={title} onToggle={toggle} />
    </div>
  )
}

function FilePlayer({ src, title }: { src: string; title: string }) {
  const [sound, setSound] = useState(false)
  const el = useRef<HTMLVideoElement>(null)

  /* `muted` no atributo só vale na primeira renderização: o navegador exige
     que o vídeo nasça mudo pra deixar tocar sozinho. Depois disso quem manda
     é a propriedade. */
  useEffect(() => {
    if (el.current) el.current.muted = !sound
  }, [sound])

  return (
    <div className={styles.frame}>
      <video
        ref={el}
        className={styles.file}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={title}
      />
      <SoundToggle on={sound} title={title} onToggle={() => setSound((s) => !s)} />
    </div>
  )
}

export default function ProjectVideo({
  youtube,
  vimeo,
  file,
  title,
}: {
  youtube?: string | null
  vimeo?: string | null
  file?: string | null
  title: string
}) {
  if (youtube) {
    const id = youtubeId(youtube)
    if (id) return <YouTube id={id} title={title} autoplay />
  }
  if (vimeo) {
    const id = vimeoId(vimeo)
    if (id) return <VimeoPlayer id={id} title={title} />
  }
  if (file) return <FilePlayer src={file} title={title} />
  return null
}
