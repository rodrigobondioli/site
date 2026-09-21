import Link from "next/link"
import styles from "./PillButton.module.css"

/**
 * O botão do site. Um componente só pra todos: se um dia o hover mudar,
 * muda em todos os lugares de uma vez.
 *
 * A segunda face do rótulo é `aria-hidden`: leitor de tela lê a palavra
 * uma vez só, mesmo estando duas vezes no HTML.
 */

type Props = {
  children: string
  href?: string
  type?: "button" | "submit"
  className?: string
  external?: boolean
}

function Label({ text }: { text: string }) {
  return (
    <span className={styles.mask}>
      <span className={styles.roll}>
        <span className={`${styles.face} ${styles.front}`}>{text}</span>
        <span className={`${styles.face} ${styles.back}`} aria-hidden="true">
          {text}
        </span>
      </span>
    </span>
  )
}

export default function PillButton({
  children,
  href,
  type = "button",
  className = "",
  external = false,
}: Props) {
  const cls = `${styles.pill} ${className}`

  if (href) {
    if (external || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("#")) {
      return (
        <a
          className={cls}
          href={href}
          {...(external || href.startsWith("http")
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          <Label text={children} />
        </a>
      )
    }
    return (
      <Link className={cls} href={href}>
        <Label text={children} />
      </Link>
    )
  }

  return (
    <button className={cls} type={type}>
      <Label text={children} />
    </button>
  )
}
