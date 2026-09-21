"use client"

import { useEffect } from "react"
import { useMotionValue } from "framer-motion"

/**
 * useWindSpin — catavento recebendo rajadas de vento.
 * Portado do override Wind_Spin.tsx do Framer, lógica idêntica.
 *
 * SENTIDO ÚNICO: a peça só gira para a direita. A velocidade angular nunca
 * fica negativa e o ângulo é monotonicamente crescente — em nenhum momento
 * do ciclo a rotação retrocede.
 *
 * Modelo físico (integração por rAF, sem keyframes):
 *   1. RAJADA  — força aplicada numa janela curta com envelope sin², em vez de
 *                um salto instantâneo de velocidade. Dá sensação de "sopro",
 *                não de "chute".
 *   2. INÉRCIA — a velocidade angular decai exponencialmente (ω *= e^(-k·dt)).
 *                Decaimento exponencial = desaceleração orgânica, nunca linear.
 *   3. REPOUSO — ao chegar perto de zero, um último avanço assintótico
 *                (1 - e^(-d·t)) acomoda a pá. Monotônico: só avança.
 *
 * Uso:
 *   const rotate = useWindSpin()
 *   <motion.div style={{ rotate }}>…</motion.div>
 */

const CONFIG = {
  // Pausa entre rajadas (segundos)
  pauseMin: 3.0,
  pauseMax: 7.0,

  // Quantas voltas a rajada entrega (antes do atrito comer o resto)
  turnsMin: 1.2,
  turnsMax: 4.2,

  // Atrito: maior = para mais rápido. Varia o "peso" percebido da peça.
  frictionMin: 0.85,
  frictionMax: 1.75,

  // Duração da rajada em si (segundos). Curto = golpe seco.
  gustMin: 0.14,
  gustMax: 0.32,

  // Chance de uma segunda lufada no meio do giro (vento não vem limpo)
  doubleGustChance: 0.35,
  doubleGustDelayMin: 0.3,
  doubleGustDelayMax: 0.85,
  doubleGustStrengthMin: 0.25,
  doubleGustStrengthMax: 0.6,

  // Acomodação final: último avanço, sempre para frente
  settleAmplitudeMin: 2.0, // graus
  settleAmplitudeMax: 6.0,
  settleDamping: 3.6,
  settleDuration: 1.1, // segundos

  // Abaixo disso consideramos parado (graus/s)
  restThreshold: 9,

  // Atraso antes da primeira rajada
  firstGustMin: 0.5,
  firstGustMax: 1.8,
}

const rand = (min: number, max: number) => min + Math.random() * (max - min)

export function useWindSpin() {
  const rotate = useMotionValue(0)

  useEffect(() => {
    if (typeof window === "undefined") return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (reduced.matches) return

    let frame = 0
    let last = performance.now()

    let angle = rotate.get() // graus, contínuo e sempre crescente
    let omega = 0 // graus/s, sempre >= 0

    let phase: "waiting" | "gusting" | "coasting" | "settling" = "waiting"
    let timer = rand(CONFIG.firstGustMin, CONFIG.firstGustMax)

    let friction = 0
    let gustDuration = 0
    let gustElapsed = 0
    let gustPeak = 0 // ω alvo da rajada
    let pendingGust = -1 // delay da segunda lufada, -1 = nenhuma
    let pendingStrength = 0

    let settleElapsed = 0
    let settleBase = 0
    let settleAmplitude = 0

    const planGust = () => {
      const turns = rand(CONFIG.turnsMin, CONFIG.turnsMax)
      friction = rand(CONFIG.frictionMin, CONFIG.frictionMax)

      // distância ≈ ω / k  →  ω = k · distância
      // +10% compensa o atrito que já age durante a própria rajada
      gustPeak = friction * turns * 360 * 1.1

      gustDuration = rand(CONFIG.gustMin, CONFIG.gustMax)
      gustElapsed = 0

      if (Math.random() < CONFIG.doubleGustChance) {
        pendingGust = rand(CONFIG.doubleGustDelayMin, CONFIG.doubleGustDelayMax)
        pendingStrength = rand(
          CONFIG.doubleGustStrengthMin,
          CONFIG.doubleGustStrengthMax
        )
      } else {
        pendingGust = -1
      }

      phase = "gusting"
    }

    const tick = (now: number) => {
      // clamp protege contra aba em background / throttling
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      if (phase === "waiting") {
        timer -= dt
        if (timer <= 0) planGust()
      } else if (phase === "gusting") {
        gustElapsed += dt
        const t = Math.min(gustElapsed / gustDuration, 1)
        // envelope sin², normalizado: ∫sin²(πt/T)dt = T/2
        const envelope = Math.sin(Math.PI * t) ** 2
        omega += gustPeak * envelope * (dt / (gustDuration / 2))

        if (gustElapsed >= gustDuration) phase = "coasting"
      }

      if (phase === "gusting" || phase === "coasting") {
        // segunda lufada no meio do giro
        if (pendingGust > 0) {
          pendingGust -= dt
          if (pendingGust <= 0) {
            omega += gustPeak * pendingStrength
            pendingGust = -1
          }
        }

        angle += omega * dt
        omega *= Math.exp(-friction * dt)

        if (phase === "coasting" && omega < CONFIG.restThreshold) {
          omega = 0
          settleBase = angle
          settleElapsed = 0
          settleAmplitude = rand(
            CONFIG.settleAmplitudeMin,
            CONFIG.settleAmplitudeMax
          )
          phase = "settling"
        }
      } else if (phase === "settling") {
        settleElapsed += dt
        // avanço assintótico: derivada sempre positiva, nunca volta
        angle =
          settleBase +
          settleAmplitude *
            (1 - Math.exp(-CONFIG.settleDamping * settleElapsed))

        if (settleElapsed >= CONFIG.settleDuration) {
          angle = settleBase + settleAmplitude
          phase = "waiting"
          timer = rand(CONFIG.pauseMin, CONFIG.pauseMax)
        }
      }

      rotate.set(angle)
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [rotate])

  return rotate
}
