import styles from "./MeetingBar.module.css"

const BOOKING =
  "https://calendar.google.com/calendar/appointments/schedules/AcZssZ1UyGf8Fce5HWHn1qa5HqhcLtC4i0BU0PvdqGtSUQgtjFGpwjcg6jUQHxSM-e4qygoZF21aSFaq?gv=true"

/** Pílula flutuante de agendamento. Mesmo link do Framer. */
export default function MeetingBar({ label = "Book a call" }: { label?: string }) {
  return (
    <a
      className={styles.bar}
      href={BOOKING}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className={styles.avatar} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
      <span className={styles.arrow} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" strokeWidth="2">
          <path d="M4 12h15M13 6l6 6-6 6" />
        </svg>
      </span>
    </a>
  )
}
