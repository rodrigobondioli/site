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

    /* A página cresce depois do primeiro clique: fonte que troca, imagem
       preguiçosa que chega, vídeo que reserva altura. O Lenis mede o
       destino uma vez, no momento do clique — se o conteúdo acima do alvo
       mudar de altura no meio da viagem, ele pousa no lugar errado. Era
       por isso que o primeiro "Say hello" ia parar longe e o segundo
       acertava: na segunda vez a página já estava assentada.

       Duas defesas. A primeira: avisar o Lenis sempre que a altura do
       documento mudar, pra ele não trabalhar com um limite velho. */
    const ro = new ResizeObserver(() => lenis.resize())
    ro.observe(document.body)

    /* A segunda: depois de pousar, conferir onde o alvo está de verdade e
       corrigir a diferença. Duas tentativas no máximo — se ainda assim não
       bater, a página está se mexendo sozinha e insistir viraria gangorra.

       O soluço: essa correção não perguntava de quem era o scroll. Quem
       clicava na âncora e já saía rolando no dedo ou na roda recebia, um
       segundo depois, um puxão de volta pro alvo — o `onComplete` disparava,
       a conta dava um erro enorme (porque a pessoa tinha se mexido, não
       porque a página cresceu) e o Lenis obedecia. Duas defesas: qualquer
       gesto da pessoa cancela a viagem, e uma correção maior que uma janela
       nunca é "a página cresceu", então é descartada. */
    const OFFSET = -56

    let cancelada = true

    const cancelar = () => {
      cancelada = true
    }

    const escutarGesto = (ligar: boolean) => {
      const m = ligar ? "addEventListener" : "removeEventListener"
      window[m]("wheel", cancelar)
      window[m]("touchstart", cancelar)
      window[m]("keydown", cancelar)
    }

    const irPara = (target: HTMLElement, tentativa = 0) => {
      const destino = () =>
        window.scrollY + target.getBoundingClientRect().top + OFFSET

      lenis.scrollTo(destino(), {
        duration: tentativa === 0 ? 1.1 : 0.4,
        onComplete: () => {
          if (cancelada || tentativa >= 2) {
            escutarGesto(false)
            return
          }
          const erro = destino() - window.scrollY
          /* acima de 2px vale corrigir; acima de uma janela inteira não é
             crescimento de página, é gente andando — e puxar de volta é
             justamente o soluço */
          if (Math.abs(erro) > 2 && Math.abs(erro) < window.innerHeight) {
            irPara(target, tentativa + 1)
          } else {
            escutarGesto(false)
          }
        },
      })
    }

    const iniciarViagem = (target: HTMLElement) => {
      cancelada = false
      escutarGesto(false)
      escutarGesto(true)
      irPara(target)
    }

    // Âncoras (#contact, #about) precisam passar pelo Lenis pra não dar pulo
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement)?.closest?.('a[href^="#"]')
      if (!link) return
      const id = link.getAttribute("href")
      if (!id || id === "#") return
      const target = document.querySelector(id)
      if (!target) return
      e.preventDefault()
      iniciarViagem(target as HTMLElement)
    }
    document.addEventListener("click", onClick)

    return () => {
      document.removeEventListener("click", onClick)
      escutarGesto(false)
      ro.disconnect()
      cancelAnimationFrame(frame)
      lenis.destroy()
    }
  }, [])

  return null
}
