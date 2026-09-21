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
