import Link from "next/link"
import RollLabel from "./RollLabel"
import styles from "./PillButton.module.css"

/**
 * O botão do site. Um componente só pra todos: se um dia o hover mudar,
 * muda em todos os lugares de uma vez.
 *
 * A cambalhota do hover mora no RollLabel — é o mesmo efeito da saída
 * "Back to portfolio" nas páginas de projeto.
 */

type Props = {
  children: string
  href?: string
  type?: "button" | "submit"
  className?: string
  external?: boolean
}

export default function PillButton({
  children,
  href,
  type = "button",
  className = "",
  external = false,
}: Props) {
  const cls = `no-underline ${styles.pill} ${className}`

  if (href) {
    if (external || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("#")) {
      return (
        <a
          className={cls}
          data-roll-host=""
          href={href}
          {...(external || href.startsWith("http")
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          <RollLabel text={children} />
        </a>
      )
    }
    return (
      <Link className={cls} data-roll-host="" href={href}>
        <RollLabel text={children} />
      </Link>
    )
  }

  return (
    <button className={cls} data-roll-host="" type={type}>
      <RollLabel text={children} />
    </button>
  )
}
