import { NextResponse } from "next/server"

/**
 * Recebe o formulário de contato e manda por e-mail.
 *
 * Sem SDK: a API da Resend é um POST com JSON, e uma dependência a mais no
 * bundle do servidor não paga o que ela economiza aqui.
 *
 * Variáveis de ambiente (Vercel → Settings → Environment Variables):
 *   RESEND_API_KEY  — chave da conta. A que existe chama "Portfolio Form",
 *                     é só de envio e está travada em
 *                     send.rodrigobondioli.com: se vazar, só serve pra
 *                     mandar e-mail por esse domínio.
 *   CONTACT_TO      — pra onde a mensagem vai
 *   CONTACT_FROM    — remetente. send.rodrigobondioli.com está verificado
 *                     (SPF/DKIM), então o e-mail sai assinado de um
 *                     endereço nosso. Sem isso a Resend só entrega de
 *                     onboarding@resend.dev, e só pro e-mail da conta — é
 *                     o padrão abaixo, que serve de rede, não de caminho.
 */

export const runtime = "nodejs"
/* nada aqui é cacheável: é POST com efeito colateral */
export const dynamic = "force-dynamic"

const REMETENTE_PADRAO = "Portfólio <onboarding@resend.dev>"

const texto = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : ""

const emailValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)

const escapar = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!
  )

export async function POST(req: Request) {
  let corpo: Record<string, unknown>
  try {
    corpo = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ erro: "json" }, { status: 400 })
  }

  /* Armadilha: campo invisível que só um robô preenche. Responde 200 de
     propósito — dizer "recusado" ensina o robô a tentar de novo. */
  if (texto(corpo.website, 200)) {
    return NextResponse.json({ ok: true })
  }

  const nome = texto(corpo.name, 120)
  const email = texto(corpo.email, 200)
  const brief = texto(corpo.brief, 4000)

  const faltando: string[] = []
  if (!nome) faltando.push("name")
  if (!email || !emailValido(email)) faltando.push("email")
  if (!brief) faltando.push("brief")

  if (faltando.length) {
    return NextResponse.json(
      { erro: "validacao", campos: faltando },
      { status: 400 }
    )
  }

  const chave = process.env.RESEND_API_KEY
  const para = process.env.CONTACT_TO
  if (!chave || !para) {
    console.error("contact: falta RESEND_API_KEY ou CONTACT_TO no ambiente")
    return NextResponse.json({ erro: "config" }, { status: 500 })
  }

  const assunto = `Site — ${nome}`

  const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#111;max-width:640px">
  <p style="margin:0 0 20px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#8a8a8a">Nova mensagem pelo site</p>
  <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%">
    <tr>
      <td style="padding:8px 16px 8px 0;vertical-align:top;white-space:nowrap;color:#8a8a8a;border-bottom:1px solid #ececec">Nome</td>
      <td style="padding:8px 0;vertical-align:top;border-bottom:1px solid #ececec">${escapar(nome)}</td>
    </tr>
    <tr>
      <td style="padding:8px 16px 8px 0;vertical-align:top;white-space:nowrap;color:#8a8a8a;border-bottom:1px solid #ececec">E-mail</td>
      <td style="padding:8px 0;vertical-align:top;border-bottom:1px solid #ececec">${escapar(email)}</td>
    </tr>
  </table>
  <p style="margin:28px 0 6px;color:#8a8a8a">What decision are you facing?</p>
  <div style="white-space:pre-wrap;padding:16px;background:#f6f6f6;border-left:2px solid #101010">${escapar(brief)}</div>
  <p style="margin:28px 0 0"><a href="mailto:${escapar(email)}" style="color:#101010">Responder para ${escapar(nome)}</a></p>
</div>`.trim()

  const plano = [
    "NOVA MENSAGEM PELO SITE",
    "",
    `Nome: ${nome}`,
    `E-mail: ${email}`,
    "",
    "What decision are you facing?",
    brief,
  ].join("\n")

  try {
    /* endpoint em variável pra dar pra apontar num servidor de teste sem
       tocar no código — em produção fica no padrão */
    const endpoint = process.env.RESEND_API_URL || "https://api.resend.com/emails"
    const r = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM || REMETENTE_PADRAO,
        to: [para],
        subject: assunto,
        html,
        text: plano,
        /* responder no cliente de e-mail já sai direto pra pessoa */
        reply_to: email,
      }),
    })

    if (!r.ok) {
      console.error("contact: resend respondeu", r.status, await r.text())
      return NextResponse.json({ erro: "envio" }, { status: 502 })
    }
  } catch (e) {
    console.error("contact: falha de rede ao chamar a resend", e)
    return NextResponse.json({ erro: "envio" }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
