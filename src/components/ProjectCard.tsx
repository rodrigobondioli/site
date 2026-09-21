import Link from "next/link"
import styles from "./ProjectCard.module.css"

/**
 * Card do arquivo, medido no Framer: imagem 4:3 sem borda nem raio, faixa do
 * nome com 16px de padding e faixa do que foi feito com 8px/16px. Os fios de
 * 1px vêm de um contorno só em volta das duas faixas, com um divisor no meio
 * — no Framer as duas caixas tinham borda própria e a linha aparecia dobrada.
 */
export default function ProjectCard({
  slug,
  name,
  what,
  thumb,
}: {
  slug: string
  name: string
  what?: string | null
  thumb?: string | null
}) {
  return (
    <Link href={`/projects/${slug}`} className={`no-underline ${styles.card}`}>
      <div className={styles.media}>
        {thumb ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={thumb} alt="" loading="lazy" />
        ) : null}
      </div>
      <div className={styles.meta}>
        <div className={styles.name}>
          <h3 className="h5">{name}</h3>
        </div>
        {what ? <p className={`body-sm ${styles.what}`}>{what}</p> : null}
      </div>
    </Link>
  )
}
