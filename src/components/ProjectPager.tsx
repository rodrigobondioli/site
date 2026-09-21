import Link from "next/link"
import { imageSize } from "@/lib/imageSize"
import type { Project } from "@/lib/projects"
import { asset } from "@/lib/projects"
import styles from "./ProjectPager.module.css"

/**
 * A saída da página: o projeto anterior e o próximo, os dois encostados à
 * direita, lado a lado.
 *
 * Cada um é uma thumb com o mesmo zoom dos cards do arquivo — o site já
 * ensinou que imagem que cresce é imagem clicável. A seta só aparece no
 * hover, por cima da imagem, apontando pro lado que o clique leva. O nome
 * fica embaixo.
 *
 * Quando falta um vizinho (o primeiro não tem anterior, o último não tem
 * próximo) o lugar dele não é preenchido com nada: sobra o que existe.
 */

function Arrow({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg viewBox="0 0 18 18" width="18" height="18" fill="none"
         stroke="currentColor" strokeWidth="1.6"
         strokeLinecap="round" strokeLinejoin="round"
         style={dir === "prev" ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M3.5 9h11M10 4.5 14.5 9 10 13.5" />
    </svg>
  )
}

function Card({ p, dir }: { p: Project; dir: "prev" | "next" }) {
  const thumb = asset(p.thumb)
  const size = imageSize(thumb)
  const name = p.projectName ?? p.slug

  return (
    <Link className={styles.card} href={`/projects/${p.slug}`}>
      <span className={styles.media}>
        {thumb ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={thumb} alt="" loading="lazy" width={size?.w} height={size?.h} />
        ) : null}
        <span className={styles.arrow} aria-hidden="true">
          <Arrow dir={dir} />
        </span>
      </span>
      <span className={`overline ${styles.name}`}>
        {dir === "prev" ? "Previous" : "Next"}
        <span className={styles.label}>{name}</span>
      </span>
    </Link>
  )
}

export default function ProjectPager({
  prev,
  next,
}: {
  prev: Project | null
  next: Project | null
}) {
  if (!prev && !next) return null

  return (
    <nav className={styles.pager} aria-label="Outros projetos">
      <div className={`section ${styles.inner}`}>
        {prev ? <Card p={prev} dir="prev" /> : null}
        {next ? <Card p={next} dir="next" /> : null}
      </div>
    </nav>
  )
}
