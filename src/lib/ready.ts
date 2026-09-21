/**
 * O sinal de "o site apareceu".
 *
 * Existe porque a tela de carregamento cobre a página inteira, mas não a
 * esconde do navegador: um elemento no topo continua intersectando a
 * viewport atrás dela. Era isso que fazia a contagem dos números começar
 * e terminar enquanto ninguém estava vendo — o efeito acontecia, só que
 * do outro lado da cortina.
 *
 * A marca no <html> é posta no momento em que o módulo do Preloader é
 * avaliado, antes de qualquer efeito rodar. Quem quer esperar pergunta
 * por ela; quem chegou depois da festa (navegação interna, onde não há
 * tela de carregamento) é chamado na hora.
 */

export const READY_EVENT = "site:ready"
const MARCA = "data-loading"

export function marcarCarregando() {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute(MARCA, "")
  }
}

export function marcarPronto() {
  if (typeof document === "undefined") return
  document.documentElement.removeAttribute(MARCA)
  window.dispatchEvent(new Event(READY_EVENT))
}

export function estaPronto(): boolean {
  if (typeof document === "undefined") return false
  return !document.documentElement.hasAttribute(MARCA)
}

/** Chama `cb` agora se o site já apareceu, ou quando ele aparecer. */
export function aoAparecer(cb: () => void): () => void {
  if (estaPronto()) {
    cb()
    return () => {}
  }
  window.addEventListener(READY_EVENT, cb, { once: true })
  return () => window.removeEventListener(READY_EVENT, cb)
}
