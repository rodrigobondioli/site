"use client"

import { useEffect } from "react"
import Lenis from "lenis"

/**
 * Scroll suave. O Framer usava Lenis (dá pra ver a classe .lenis no <html>
 * do site publicado), então aqui é o mesmo Lenis, direto — mesma sensação,
 * sem a camada do Framer em volta.
 *
 * Respeita prefers-reduced-motion: quem pediu menos movimento continua com
 * o scroll nativo.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const lenis = new Lenis({
      // ~1s pra assentar depois do gesto: manteiga, sem virar elástico
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      // no touch o scroll nativo já é bom — interferir só atrapalha
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.6,
      wheelMultiplier: 1,
    })

    let frame = 0
    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    // Âncoras (#contact, #about) precisam passar pelo Lenis pra não dar pulo
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement)?.closest?.('a[href^="#"]')
      if (!link) return
      const id = link.getAttribute("href")
      if (!id || id === "#") return
      const target = document.querySelector(id)
      if (!target) return
      e.preventDefault()
      lenis.scrollTo(target as HTMLElement, { offset: -56 })
    }
    document.addEventListener("click", onClick)

    return () => {
      document.removeEventListener("click", onClick)
      cancelAnimationFrame(frame)
      lenis.destroy()
    }
  }, [])

  return null
}
