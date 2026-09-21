import Link from "next/link"
import styles from "./ProjectCard.module.css"

/**
 * Card do arquivo. Imagem + nome + o que foi feito.
 *
 * As duas faixas de texto dividem a borda em vez de somarem duas linhas de
 * 1px — era o defeito do card no Framer, visível quando o padding cresceu.
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
    <Link href={`/projects/${slug}`} className={styles.card}>
      <div className={styles.media}>
        {thumb ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={thumb} alt="" loading="lazy" />
        ) : null}
      </div>
      <div className={styles.name}>
        <h3 className="h4">{name}</h3>
      </div>
      {what ? <div className={styles.what}>{what}</div> : null}
    </Link>
  )
}
