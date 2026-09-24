"use client"

import { useEffect, useState } from "react"
import styles from "./MeetingBar.module.css"

const BOOKING =
  "https://calendar.google.com/calendar/appointments/schedules/AcZssZ1UyGf8Fce5HWHn1qa5HqhcLtC4i0BU0PvdqGtSUQgtjFGpwjcg6jUQHxSM-e4qygoZF21aSFaq?gv=true"

/**
 * Pílula flutuante de agendamento. Mesmo link do Framer.
 *
 * Ela existe pra cobrir o vão: o "Say hello" da navegação sai da tela nos
 * primeiros 100px de rolagem, e daí em diante a página fica sem nenhum
 * convite à mão.
 *
 * O piso é sempre a altura da navegação: enquanto o botão do topo estiver
 * na tela, a barra não entra — seriam dois convites ao mesmo tempo. Isso
 * não depende de tamanho de tela, porque sai da altura medida da barra.
 *
 * `entraApos` é um piso a mais, em frações da janela, pra quem precisa
 * esperar mais. O padrão de 0.9 é da /work: lá o herói termina com a faixa
 * de números presa no rodapé da tela, e uma barra flutuante entrando antes
 * disso sentaria em cima dela. Onde não há faixa — o media kit — o valor é
 * 0, e vale só a altura da navegação.
 *
 * E sai de novo ao chegar no amarelo: lá embaixo o convite já está na
 * página inteira, a barra só atrapalharia o formulário. Em página sem
 * contato, quem a esconde é o rodapé.
 */
export default function MeetingBar({
  label = "Book a call",
  hideOver = ".on-accent, #contact",
  entraApos = 0.9,
}: {
  label?: string
  hideOver?: string
  /** piso extra, em frações da janela, além da altura da navegação */
  entraApos?: number
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const check = () => {
      /* enquanto o "Say hello" do topo estiver na tela, ela não entra */
      const nav = document.querySelector("header")?.offsetHeight ?? 96
      if (window.scrollY <= Math.max(nav, window.innerHeight * entraApos)) {
        setVisible(false)
        return
      }
      // a linha onde a barra começa: 64 de altura + 24 do rodapé
      const line = window.innerHeight - 88
      const covered = Array.from(
        document.querySelectorAll<HTMLElement>(hideOver)
      ).some((el) => {
        const r = el.getBoundingClientRect()
        return r.top < line && r.bottom > 0
      })
      setVisible(!covered)
    }
    check()
    window.addEventListener("scroll", check, { passive: true })
    window.addEventListener("resize", check)
    return () => {
      window.removeEventListener("scroll", check)
      window.removeEventListener("resize", check)
    }
  }, [hideOver, entraApos])

  return (
    <a
      className={`no-underline ${styles.bar} ${visible ? styles.on : ""}`}
      href={BOOKING}
      target="_blank"
      rel="noopener noreferrer"
      aria-hidden={!visible}
      tabIndex={visible ? undefined : -1}
    >
      <span className={styles.avatar} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/rodrigo.png" alt="" width={42} height={42} />
      </span>
      <span className={styles.label}>{label}</span>
      <span className={styles.arrow} aria-hidden="true">
        <svg
          viewBox="0 0 18 18"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3.5 9h11M10 4.5 14.5 9 10 13.5" />
        </svg>
      </span>
    </a>
  )
}
