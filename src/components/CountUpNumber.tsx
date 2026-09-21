"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"

/**
 * Um número que conta e desacelera até o valor final.
 * Portado de CountUpNumber.tsx do Framer.
 *
 * easeOutExpo: dispara rápido e rasteja até o número.
 * Dígitos tabulares para o label ao lado não tremer enquanto conta.
 */

interface CountUpNumberProps {
  target?: number
  suffix?: string
  padTo?: number
  duration?: number
  startOnView?: boolean
  className?: string
  style?: CSSProperties
}

export default function CountUpNumber({
  target = 20,
  suffix = "+",
  padTo = 0,
  duration = 1600,
  startOnView = true,
  className,
  style,
}: CountUpNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(0)
  const done = useRef(false)

  useEffect(() => {
    done.current = false
    setValue(0)

    const reduce =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (reduce) {
      setValue(target)
      return
    }

    let frame = 0
    let startedAt = 0

    const run = () => {
      if (done.current) return
      done.current = true

      const tick = (now: number) => {
        if (!startedAt) startedAt = now
        const p = Math.min((now - startedAt) / duration, 1)
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
        setValue(Math.round(eased * target))
        if (p < 1) frame = requestAnimationFrame(tick)
      }

      frame = requestAnimationFrame(tick)
    }

    const node = ref.current

    if (!startOnView || !node || typeof IntersectionObserver !== "function") {
      const delay = window.setTimeout(run, 180)
      return () => {
        window.clearTimeout(delay)
        cancelAnimationFrame(frame)
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            run()
            observer.disconnect()
          }
        }
      },
      { threshold: 0.35 }
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [target, duration, startOnView])

  const digits = padTo > 0 ? String(value).padStart(padTo, "0") : String(value)

  return (
    <span
      ref={ref}
      className={className}
      style={{
        ...style,
        display: "inline-block",
        whiteSpace: "nowrap",
        fontVariantNumeric: "tabular-nums",
        fontFeatureSettings: '"tnum"',
      }}
    >
      {digits}
      {suffix}
    </span>
  )
}
