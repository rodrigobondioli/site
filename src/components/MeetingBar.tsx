"use client"

import { useEffect, useState } from "react"
import styles from "./MeetingBar.module.css"

const BOOKING =
  "https://calendar.google.com/calendar/appointments/schedules/AcZssZ1UyGf8Fce5HWHn1qa5HqhcLtC4i0BU0PvdqGtSUQgtjFGpwjcg6jUQHxSM-e4qygoZF21aSFaq?gv=true"

/**
 * Pílula flutuante de agendamento. Mesmo link do Framer.
 *
 * Só entra depois que o hero sai da tela: no topo ela competiria com o
 * título e ainda cobriria a faixa de números.
 *
 * E sai de novo ao chegar no amarelo: lá embaixo o convite já está na
 * página inteira, a barra só atrapalharia o formulário.
 */
export default function MeetingBar({
  label = "Book a call",
  hideOver = ".on-accent, #contact",
}: {
  label?: string
  hideOver?: string
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const check = () => {
      if (window.scrollY <= window.innerHeight * 0.9) {
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
  }, [hideOver])

  return (
    <a
      className={`${styles.bar} ${visible ? styles.on : ""}`}
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
