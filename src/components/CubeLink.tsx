"use client"

/**
 * CubeLink — link de texto com o mesmo hover do CopyEmail: um cubo de 4
 * faces que gira um quarto de volta a cada vez que o mouse entra, sempre
 * no mesmo sentido, com a mesma mola.
 *
 * Os números (perspectiva 400, mola 260/18, massa 0.9, sublinhado 1px a
 * 3px) são os do CopyEmail de propósito: os dois convivem na capa e têm
 * que girar igual. Se mudar lá, mude aqui.
 *
 * Mais simples que o CopyEmail porque não há feedback de clique: as quatro
 * faces carregam sempre o mesmo texto, então o cubo repousa em qualquer
 * uma e nunca precisa trocar palavra.
 */

import { motion } from "framer-motion"
import { useEffect, useRef, useState, type CSSProperties } from "react"

const FACES = [0, 1, 2, 3]

export default function CubeLink({
  href,
  children,
  className,
}: {
  href: string
  children: string
  className?: string
}) {
  const [steps, setSteps] = useState(0)
  const [height, setHeight] = useState(0)
  const sizerRef = useRef<HTMLSpanElement>(null)

  // A altura real da linha define o translateZ das faces
  useEffect(() => {
    const node = sizerRef.current
    if (!node) return
    const measure = () => setHeight(node.offsetHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const textStyle: CSSProperties = {
    textDecorationLine: "underline",
    textDecorationThickness: 1,
    textUnderlineOffset: 3,
    whiteSpace: "nowrap",
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={children}
      onMouseEnter={() => setSteps((s) => s + 1)}
      className={`no-underline ${className ?? ""}`}
      style={{
        position: "relative",
        display: "inline-block",
        perspective: 400,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <motion.span
        animate={{ rotateX: -90 * steps }}
        transition={{ type: "spring", stiffness: 260, damping: 18, mass: 0.9 }}
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
          {children}
        </span>

        {FACES.map((i) => (
          <span
            key={i}
            aria-hidden="true"
            style={{
              ...textStyle,
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              display: "block",
              backfaceVisibility: "hidden",
              transform: `rotateX(${i * 90}deg) translateZ(${height / 2}px)`,
            }}
          >
            {children}
          </span>
        ))}
      </motion.span>
    </a>
  )
}
