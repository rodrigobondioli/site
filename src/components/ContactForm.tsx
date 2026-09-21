"use client"

import { useRef, useState } from "react"
import styles from "./ContactForm.module.css"
import PillButton from "./PillButton"

/**
 * Formulário de contato. Envia de verdade: POST pra /api/contact, que
 * manda o e-mail pela Resend.
 *
 * Antes isto era um `mailto:`, que não avisa nada — sem cliente de e-mail
 * configurado a pessoa clicava e nada acontecia na tela. Agora o servidor
 * responde, então os estados são reais: enviando, enviado, falhou.
 *
 * O caminho manual continua existindo, mas só como rede: se a rota cair
 * ou a Resend recusar, a pessoa vê o endereço e a mensagem prontos pra
 * copiar em vez de perder o que escreveu.
 */

const TO = "hello@rodrigobondioli.com"

type Estado = "parado" | "enviando" | "enviado" | "falhou"
type Erros = { name?: string; email?: string; brief?: string }

/* Deliberadamente frouxo: validação de e-mail que tenta ser esperta
   rejeita endereço válido, e quem digita errado descobre de qualquer
   jeito quando a resposta não chega. Só barra o que é claramente não-email. */
const PARECE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default function ContactForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [brief, setBrief] = useState("")
  const [erros, setErros] = useState<Erros>({})
  const [estado, setEstado] = useState<Estado>("parado")
  const [copiado, setCopiado] = useState(false)
  /* Campo invisível. Robô preenche tudo que encontra; gente não vê. */
  const [armadilha, setArmadilha] = useState("")

  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const briefRef = useRef<HTMLTextAreaElement>(null)

  const mensagem = [brief, "", "—", name, email].filter(Boolean).join("\n")
  const assunto = name ? `Decision — ${name}` : "Let's talk"

  function validar(): Erros {
    const e: Erros = {}
    if (!name.trim()) e.name = "Tell me your name."
    if (!email.trim()) e.email = "I need an address to reply to."
    else if (!PARECE_EMAIL.test(email.trim()))
      e.email = "That address looks incomplete."
    if (!brief.trim()) e.brief = "Even one line helps."
    return e
  }

  async function enviar() {
    setEstado("enviando")
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, brief, website: armadilha }),
      })
      if (!r.ok) throw new Error(String(r.status))
      setEstado("enviado")
    } catch {
      setEstado("falhou")
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (estado === "enviando") return

    const achados = validar()
    setErros(achados)

    /* Foco no primeiro campo com problema: sem isso, num formulário longo
       a mensagem de erro pode estar fora da tela e o envio parece ignorado. */
    const primeiro = (["name", "email", "brief"] as const).find((k) => achados[k])
    if (primeiro) {
      const alvo = { name: nameRef, email: emailRef, brief: briefRef }[primeiro]
      alvo.current?.focus()
      return
    }

    void enviar()
  }

  async function copiarMensagem() {
    try {
      await navigator.clipboard.writeText(`${TO}\n\n${assunto}\n\n${mensagem}`)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 2000)
    } catch {
      setCopiado(false)
    }
  }

  const ocupado = estado === "enviando"

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label className="sr-only" htmlFor="cf-name">
          Name
        </label>
        <input
          ref={nameRef}
          id="cf-name"
          type="text"
          name="name"
          placeholder="Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (erros.name) setErros((x) => ({ ...x, name: undefined }))
          }}
          autoComplete="name"
          aria-invalid={erros.name ? true : undefined}
          aria-describedby={erros.name ? "cf-name-erro" : undefined}
        />
        {erros.name ? (
          <p className={styles.erro} id="cf-name-erro" role="alert">
            {erros.name}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className="sr-only" htmlFor="cf-email">
          Email
        </label>
        <input
          ref={emailRef}
          id="cf-email"
          type="email"
          name="email"
          placeholder="Email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (erros.email) setErros((x) => ({ ...x, email: undefined }))
          }}
          autoComplete="email"
          aria-invalid={erros.email ? true : undefined}
          aria-describedby={erros.email ? "cf-email-erro" : undefined}
        />
        {erros.email ? (
          <p className={styles.erro} id="cf-email-erro" role="alert">
            {erros.email}
          </p>
        ) : null}
      </div>

      <h3 className={`h4 ${styles.question}`}>What decision are you facing?</h3>

      <div className={styles.field}>
        <label className="sr-only" htmlFor="cf-brief">
          Your situation
        </label>
        <textarea
          ref={briefRef}
          id="cf-brief"
          name="brief"
          rows={3}
          placeholder="Ex: we're about to rebuild the brand and I don't want the obvious version."
          value={brief}
          onChange={(e) => {
            setBrief(e.target.value)
            if (erros.brief) setErros((x) => ({ ...x, brief: undefined }))
          }}
          aria-invalid={erros.brief ? true : undefined}
          aria-describedby={erros.brief ? "cf-brief-erro" : undefined}
        />
        {erros.brief ? (
          <p className={styles.erro} id="cf-brief-erro" role="alert">
            {erros.brief}
          </p>
        ) : null}
      </div>

      {/* Armadilha de robô: fora da tela, sem foco no tab, sem autofill. */}
      <div className={styles.armadilha} aria-hidden="true">
        <label htmlFor="cf-website">Website</label>
        <input
          id="cf-website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={armadilha}
          onChange={(e) => setArmadilha(e.target.value)}
        />
      </div>

      <div className={styles.actions}>
        <PillButton type="submit" busy={ocupado} busyLabel="Sending…">
          Start with the problem
        </PillButton>
      </div>

      {/* Os desfechos. `aria-live` porque eles aparecem depois do clique,
          longe de onde o foco está. */}
      <div className={styles.resultado} aria-live="polite">
        {estado === "enviado" ? (
          <p className={styles.ok}>
            Got it — the message is in my inbox. I answer everything myself,
            usually within a day.
          </p>
        ) : null}

        {estado === "falhou" ? (
          <div className={styles.manual}>
            <p>
              Something broke on the way out — my fault, not yours. Nothing was
              lost: write to <a href={`mailto:${TO}`}>{TO}</a>, or copy the
              message below and send it from wherever you like.
            </p>
            <div className={styles.manualActions}>
              <button type="button" className={styles.link} onClick={copiarMensagem}>
                {copiado ? "Copied" : "Copy message"}
              </button>
              <button type="button" className={styles.link} onClick={() => void enviar()}>
                Try again
              </button>
            </div>
          </div>
        ) : null}
      </div>

    </form>
  )
}
