"use client"

import { useState } from "react"
import styles from "./ContactForm.module.css"

/**
 * Formulário de contato. O site é estático — não há servidor pra receber
 * POST. Então o envio monta um e-mail pré-preenchido e entrega pro cliente
 * de e-mail da pessoa. Zero backend, zero serviço pago, nada pra quebrar.
 *
 * Se um dia isso virar volume, trocar o handleSubmit por um fetch pro
 * Resend/Formspree é uma linha — o resto do componente não muda.
 */

const TO = "hello@rodrigobondioli.com"

export default function ContactForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [brief, setBrief] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const subject = name ? `Decision — ${name}` : "Let's talk"
    const body = [brief, "", "—", name, email].filter(Boolean).join("\n")
    window.location.href = `mailto:${TO}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span className="sr-only">Name</span>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
      </label>

      <label className={styles.field}>
        <span className="sr-only">Email</span>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </label>

      <h3 className={`h4 ${styles.question}`}>What decision are you facing?</h3>

      <label className={styles.field}>
        <span className="sr-only">Your situation</span>
        <textarea
          name="brief"
          rows={3}
          placeholder="Ex: we're about to rebuild the brand and I don't want the obvious version."
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          required
        />
      </label>

      <button type="submit" className={styles.submit}>
        Start with the problem
      </button>
    </form>
  )
}
