"use client"

/**
 * CopyEmail — e-mail sublinhado, clique copia, hover gira um cubo 3D.
 * Portado do componente Copy_Email.tsx do Framer.
 *
 * Cubo de 4 faces girando sempre no mesmo sentido (rotateX negativo,
 * acumulado). Como as quatro faces carregam o mesmo texto, o cubo pode
 * repousar em qualquer uma delas — por isso nunca precisa "voltar", e cada
 * hover entrega exatamente um quarto de volta.
 *
 * Ao clicar: copia o e-mail e gira mais um quarto revelando o feedback.
 * O texto da face que está entrando é trocado enquanto ela ainda está de
 * perfil (invisível), então a troca nunca aparece.
 */

import { motion } from "framer-motion"
import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react"

interface CopyEmailProps {
  email?: string
  copiedLabel?: string
  color?: string
  underlineOffset?: number
  underlineThickness?: number
  perspective?: number
  stiffness?: number
  damping?: number
  copiedDuration?: number
  className?: string
  style?: CSSProperties
}

async function writeToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // segue para o fallback
    }
  }

  if (typeof document === "undefined") return false

  const field = document.createElement("textarea")
  field.value = text
  field.setAttribute("readonly", "")
  field.style.position = "fixed"
  field.style.top = "-1000px"
  field.style.opacity = "0"
  document.body.appendChild(field)
  field.select()

  let copied = false
  try {
    copied = document.execCommand("copy")
  } catch {
    copied = false
  }
  document.body.removeChild(field)

  return copied
}

export default function CopyEmail({
  email = "hello@rodrigobondioli.com",
  copiedLabel = "Email copied",
  color = "#101010",
  underlineOffset = 3,
  underlineThickness = 1,
  perspective = 400,
  stiffness = 260,
  damping = 18,
  copiedDuration = 1800,
  className,
  style,
}: CopyEmailProps) {
  const [steps, setSteps] = useState(0)
  const [faces, setFaces] = useState<string[]>([email, email, email, email])
  const [height, setHeight] = useState(0)
  const [announcement, setAnnouncement] = useState("")

  const sizerRef = useRef<HTMLSpanElement>(null)
  const resetTimer = useRef<number | null>(null)

  // Mede a altura real da linha — é ela que define o translateZ das faces.
  useEffect(() => {
    const node = sizerRef.current
    if (!node || typeof window === "undefined") return

    const measure = () => setHeight(node.offsetHeight)
    measure()

    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [email])

  useEffect(() => {
    setFaces([email, email, email, email])
  }, [email])

  useEffect(() => {
    return () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current)
    }
  }, [])

  // Gira um quarto de volta, escrevendo o texto na face que está entrando.
  const turn = useCallback((label: string) => {
    startTransition(() => {
      setSteps((current) => {
        const next = current + 1
        setFaces((currentFaces) => {
          const updated = [...currentFaces]
          updated[next % 4] = label
          return updated
        })
        return next
      })
    })
  }, [])

  const handleEnter = useCallback(() => {
    if (resetTimer.current !== null) return // não interrompe o feedback
    turn(email)
  }, [email, turn])

  const handleActivate = useCallback(async () => {
    const copied = await writeToClipboard(email)

    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current)

    turn(copied ? copiedLabel : email)
    startTransition(() =>
      setAnnouncement(copied ? copiedLabel : "Could not copy")
    )

    resetTimer.current = window.setTimeout(() => {
      resetTimer.current = null
      turn(email)
      startTransition(() => setAnnouncement(""))
    }, copiedDuration)
  }, [copiedDuration, copiedLabel, email, turn])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        handleActivate()
      }
    },
    [handleActivate]
  )

  const textStyle: CSSProperties = {
    color,
    textDecorationLine: "underline",
    textDecorationThickness: underlineThickness,
    textUnderlineOffset: underlineOffset,
    whiteSpace: "nowrap",
  }

  const depth = height / 2

  return (
    <button
      type="button"
      onMouseEnter={handleEnter}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      aria-label={`Copy email ${email}`}
      className={className}
      style={{
        ...style,
        position: "relative",
        display: "inline-block",
        margin: 0,
        padding: 0,
        border: "none",
        background: "none",
        /* nada de `font: inherit` aqui: estilo inline ganha da classe, e a
           classe que vem de fora é justamente quem define o tamanho. O
           reset global já faz o botão herdar a fonte. */
        cursor: "pointer",
        perspective,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <motion.span
        animate={{ rotateX: -90 * steps }}
        transition={{ type: "spring", stiffness, damping, mass: 0.9 }}
        style={{
          position: "relative",
          display: "block",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Sizer invisível: fixa largura e altura da caixa */}
        <span
          ref={sizerRef}
          aria-hidden="true"
          style={{ ...textStyle, display: "block", visibility: "hidden" }}
        >
          {email}
        </span>

        {faces.map((label, index) => (
          <span
            key={index}
            aria-hidden="true"
            style={{
              ...textStyle,
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              display: "block",
              backfaceVisibility: "hidden",
              transform: `rotateX(${index * 90}deg) translateZ(${depth}px)`,
            }}
          >
            {label}
          </span>
        ))}
      </motion.span>

      <span
        aria-live="polite"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
        }}
      >
        {announcement}
      </span>
    </button>
  )
}
