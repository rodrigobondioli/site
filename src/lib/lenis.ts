import type Lenis from "lenis"

/**
 * O compasso do site.
 *
 * Um laço de quadros só, e o Lenis sempre na frente dele. Antes cada
 * efeito amarrado ao scroll (MaskReveal, ScrollReveal) tinha o seu próprio
 * requestAnimationFrame, e a ordem entre eles e o Lenis dependia de quem
 * se inscreveu primeiro. Quem rodasse antes do Lenis no quadro lia a
 * posição do quadro anterior e desenhava um quadro atrasado. É o que a
 * documentação do Lenis pede: um relógio só, `lenis.raf` primeiro, o
 * resto depois.
 *
 * Também é aqui que mora a instância, pra quem precisa mandar nela sem
 * ser o SmoothScroll — a tela de carregamento, que tem que parar o scroll
 * enquanto está no ar.
 */

type Quadro = (time: number) => void

const quadros = new Set<Quadro>()
let instancia: Lenis | null = null
let frame = 0

const girar = (time: number) => {
  instancia?.raf(time)
  for (const q of quadros) q(time)
  frame = instancia || quadros.size ? requestAnimationFrame(girar) : 0
}

const ligar = () => {
  if (!frame) frame = requestAnimationFrame(girar)
}

/** Roda `q` a cada quadro, depois do Lenis. Devolve o desligamento. */
export function aCadaQuadro(q: Quadro): () => void {
  quadros.add(q)
  ligar()
  return () => {
    quadros.delete(q)
  }
}

/* A tela de carregamento pode pedir trava antes de o Lenis existir — o
   efeito dela roda antes do SmoothScroll. A trava fica guardada e vale
   pra instância que chegar. */
let travado = false

export function registrarLenis(lenis: Lenis) {
  instancia = lenis
  if (travado) lenis.stop()
  ligar()
}

export function removerLenis(lenis: Lenis) {
  if (instancia === lenis) instancia = null
}

/** Para o scroll inteiro — roda, teclado, toque. */
export function travarScroll() {
  travado = true
  instancia?.stop()
}

export function soltarScroll() {
  travado = false
  instancia?.start()
}

/* De volta ao topo, sem animação. Tem que passar pelo Lenis: um
   `window.scrollTo` sozinho move a página, mas o Lenis continua achando
   que está onde estava e, no próximo gesto, parte de lá. `force` porque
   quem chama isso é a tela de carregamento, com o Lenis ainda parado. */
export function irProTopo() {
  window.scrollTo(0, 0)
  instancia?.scrollTo(0, { immediate: true, force: true })
}
