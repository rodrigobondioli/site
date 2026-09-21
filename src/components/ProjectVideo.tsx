import YouTube from "./YouTube"
import styles from "./ProjectVideo.module.css"

/**
 * O vídeo de um projeto. Cinco dos dezesseis têm um, e vêm de três lugares
 * diferentes: YouTube, Vimeo e MP4 servido por nós. Em vez de espalhar três
 * condicionais por toda a página, a escolha acontece aqui.
 *
 * O MP4 toca sozinho, mudo e em loop — é peça de apoio, não conteúdo que a
 * pessoa veio assistir. YouTube e Vimeo mantêm os controles: lá tem áudio e
 * narrativa.
 */

function vimeoId(url: string): string | null {
  return url.match(/vimeo\.com\/(\d+)/)?.[1] ?? null
}

function youtubeId(url: string): string | null {
  return url.match(/[?&]v=([\w-]+)/)?.[1] ?? url.match(/youtu\.be\/([\w-]+)/)?.[1] ?? null
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
    if (id) return <YouTube id={id} title={title} />
  }

  if (vimeo) {
    const id = vimeoId(vimeo)
    if (id) {
      return (
        <div className={styles.frame}>
          <iframe
            src={`https://player.vimeo.com/video/${id}?dnt=1&title=0&byline=0&portrait=0`}
            title={title}
            loading="lazy"
            allow="fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
    }
  }

  if (file) {
    return (
      /* Sem `controls`: mudo e em loop, não há o que controlar.
         `playsInline` porque no iPhone o padrão é abrir em tela cheia. */
      <video
        className={styles.file}
        src={file}
        poster={undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={title}
      />
    )
  }

  return null
}
