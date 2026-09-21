import Link from "next/link"
import RollLabel from "./RollLabel"
import styles from "./PillButton.module.css"

/**
 * O botão do site. Um componente só pra todos: se um dia o hover mudar,
 * muda em todos os lugares de uma vez.
 *
 * A cambalhota do hover mora no RollLabel — é o mesmo efeito da saída
 * "Back to portfolio" nas páginas de projeto.
 *
 * `busy` existe porque este botão envia o formulário, e um botão que não
 * sabe dizer "estou ocupado" deixa a pessoa clicando de novo achando que
 * não funcionou. Ele desabilita junto: `aria-busy` avisa o leitor de tela,
 * `disabled` impede o segundo envio.
 *
 * Nada disso vale pro modo link: um <a> não tem estado desabilitado. Se
 * um link precisa ficar inativo, ele não deve ser um link.
 */

type Props = {
  children: string
  href?: string
  type?: "button" | "submit"
  className?: string
  external?: boolean
  disabled?: boolean
  /** ocupado: troca o rótulo, desabilita e avisa o leitor de tela */
  busy?: boolean
  busyLabel?: string
  onClick?: () => void
}

export default function PillButton({
  children,
  href,
  type = "button",
  className = "",
  external = false,
  disabled = false,
  busy = false,
  busyLabel,
  onClick,
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

  const rotulo = busy ? busyLabel ?? children : children

  return (
    <button
      className={cls}
      data-roll-host=""
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      onClick={onClick}
    >
      {/* a chave força o cubo a remontar quando o rótulo muda: sem ela as
          duas faces ficariam com textos diferentes no meio do giro */}
      <RollLabel key={rotulo} text={rotulo} />
    </button>
  )
}
