import type { Metadata } from "next"
import SiteNav from "@/components/SiteNav"
import SmoothScroll from "@/components/SmoothScroll"
import { SiteFooter } from "@/components/SiteFooter"
import MeetingBar from "@/components/MeetingBar"
import YouTube from "@/components/YouTube"
import MaskReveal from "@/components/MaskReveal"
import Brands from "@/components/Brands"
import TypeBand from "@/components/TypeBand"
import { dadosDoCanal } from "@/lib/youtube"
import kit from "@/content/mediakit.json"
import s from "./mediakit.module.css"

/* Media kit do canal. A estrutura e os números saíram do Framer
   (/mediakit/home, medido com getComputedStyle); a roupa é a da /work —
   mesma navegação, mesmo rodapé, mesmas réguas de cabeçalho, mesmas
   grades de 3 → 2 → 1 coluna, canto vivo em tudo.

   O conteúdo mora em src/content/mediakit.json porque ele envelhece: os
   números mudam todo mês, e trocar um número não pode pedir mexida em
   JSX. */

export const metadata: Metadata = {
  title: "Media kit",
  description:
    "YouTube media kit for @falabondioli: audience, performance, partnership options and rates.",
  alternates: { canonical: "/mediakit" },
}

/* Uma vez por dia a página se refaz sozinha com os números novos. Ela
   continua estática: quem visita recebe HTML pronto, e a busca acontece no
   servidor, fora do caminho de ninguém. */
export const revalidate = 86400

type Stat = {
  label: string
  value: string
  span?: number
  second?: string
  /** campo vivo que substitui o valor do JSON, quando a API responde */
  live?: "inscritos" | "videos"
}
type Package = { format: string; length: string; delivers: string; price: string }

const stats = kit.stats as Stat[]
const packages = kit.packages as Package[]
const countries = kit.countries as string[][]
const ages = kit.ages as string[][]
const cases = kit.case.cards as string[][]
const credentials = kit.about.credentials as string[][]

/* O mesmo desencontro da grade do arquivo na /work: hash do índice, nunca
   Math.random — servidor e navegador têm que chegar no mesmo número. */
const scatter = (i: number) => ((i * 2654435761) % 1000) / 1000

export default async function MediaKitPage() {
  /* Sem chave, sem rede, ou API fora do ar: `canal` vem nulo e tudo abaixo
     cai no JSON. Um número velho é melhor que uma página que não sobe. */
  const canal = await dadosDoCanal()

  const numeros = stats.map((st) =>
    st.live && canal?.[st.live] ? { ...st, value: canal[st.live] as string } : st
  )

  /* Os quatro mais vistos do canal, calculados na hora. Sem chave, valem os
     quatro escolhidos à mão no JSON. */
  const videos = canal?.maisVistos.length ? canal.maisVistos : kit.picks

  /* A data é a da busca, não uma constante escrita à mão. Sem API, ela volta
     a ser a do JSON — que é a verdade nesse caso. */
  const atualizado = canal?.atualizado ?? kit.updated

  return (
    <>
      <SmoothScroll />
      {/* A página não tem formulário: o "Say hello" atravessa pra /work */}
      <SiteNav ctaHref="/work#contact" brandHref="/work" />

      <main>
        {/* ---------- Capa ---------- */}
        <section className={s.hero}>
          <h1 className="sr-only">
            Media kit — Rodrigo Bondioli on YouTube, @falabondioli
          </h1>

          {/* A faixa gigante é textura: o título de verdade está acima,
              e ela corre por trás do vídeo. */}
          <TypeBand text="Media kit —" className={s.band} />

          <div className={`container ${s.heroInner}`}>
            <p className={s.meta}>
              <span className="overline">{kit.window}</span>
              <span className="overline">Last updated &mdash; {atualizado}</span>
            </p>

            <video
              className={s.stage}
              src="/video/eu-profile.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="none"
            />
          </div>
        </section>

        {/* ---------- Audiência ---------- */}
        <section className={`section ${s.sec}`} id="audience">
          <div className={`container ${s.secInner}`}>
            <div className="head-row">
              <h2 className="h3">Audience &amp; niche</h2>
              <span className="rule rule-lg" />
              {/* O selo era uma pílula amarela do tamanho de um título. Aqui
                  ele é o que sempre foi: uma legenda. O "@falabondioli" que
                  ocupava este lugar já aparece na frase logo abaixo. */}
              <p className="overline">
                <span aria-hidden="true">&#9733;&#9733;&#9733;&#9733;&#9733;</span>{" "}
                {kit.badge}
              </p>
            </div>

            <div className={s.claim}>
              <p className="body">{kit.claim}</p>

              <ul className={s.facts}>
                <li className="body">
                  <strong>Who watches:</strong> {kit.audience.watches}
                </li>
                <li className="body">
                  <strong>Key interests:</strong> {kit.audience.interests}
                </li>
              </ul>
            </div>

            <ul className={s.stats}>
              {numeros.map((st) => (
                <li className={st.span === 2 ? s.wide : undefined} key={st.label}>
                  <div className={s.stat}>
                    <p className="overline">{st.label}</p>
                    <p className="h3">
                      {st.value}
                      {st.second ? (
                        <>
                          <br />
                          {st.second}
                        </>
                      ) : null}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className={s.tables}>
              <div className={s.table}>
                <h3 className="h4">Top countries</h3>
                <ul className={s.rows}>
                  {countries.map(([place, share]) => (
                    <li key={place}>
                      <span className="body">{place}</span>
                      <span className="h4">{share}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={s.table}>
                <h3 className="h4">Age range</h3>
                <ul className={s.rows}>
                  {ages.map(([range, share]) => (
                    <li key={range}>
                      <span className="body">{range}</span>
                      <span className="h4">{share}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Desempenho ---------- */}
        <section className={`section ${s.sec}`} id="performance">
          <div className={`container ${s.secInner}`}>
            <div className="head-row">
              <h2 className="h3">Elite performance</h2>
              <span className="rule rule-md" />
              <p className="overline">vs. creators with similar reach</p>
            </div>

            <ul className={s.pairs}>
              {kit.performance.map(({ title, note }) => (
                <li key={title}>
                  <div className={`${s.tile} ${s.accent}`}>
                    <h3 className="h4">{title}</h3>
                    <p className="body">{note}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- Caso ---------- */}
        <section className={`section ${s.sec}`} id="case">
          <div className={`container ${s.secInner}`}>
            <div className="head-row">
              <h2 className="h3">{kit.case.title}</h2>
              <span className="rule rule-md" />
              <p className="overline">Case</p>
            </div>

            <ul className={s.trio}>
              {cases.map((lines) => (
                <li key={lines[0]}>
                  <div className={`${s.tile} ${s.violet}`}>
                    {lines.map((line) => (
                      <p className="h4" key={line}>
                        {line}
                      </p>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- Formatos ---------- */}
        <section className={`section ${s.sec}`} id="partnership">
          <div className={`container ${s.secInner}`}>
            <div className="head-row">
              <h2 className="h3">Partnership options</h2>
              <span className="rule rule-lg" />
              <p className="overline">Investment in USD</p>
            </div>

            <table className={s.rates}>
              <colgroup>
                <col />
                <col className={s.delivers} />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th className="overline" scope="col">Format</th>
                  <th className="overline" scope="col">What it delivers</th>
                  <th className="overline" scope="col">Investment</th>
                </tr>
              </thead>
              <tbody>
                {packages.map(({ format, length, delivers, price }) => (
                  <tr key={format}>
                    <td className="body">
                      <strong>{format}</strong> {length}
                    </td>
                    <td className="body">{delivers}</td>
                    <td className="h4">{price}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={s.extensions}>
              <h3 className="h4">Audience extensions</h3>
              <p className="body">{kit.extensions}</p>
            </div>
          </div>
        </section>

        {/* ---------- Seleção ---------- */}
        <section className={`section ${s.sec}`} id="picks">
          <div className={`container ${s.secInner}`}>
            <div className="head-row">
              <h2 className="h3">Most watched</h2>
              <span className="rule rule-md" />
              <p className="overline">YouTube @falabondioli</p>
            </div>

            <ul className={s.picks}>
              {videos.map(({ id, title }, i) => (
                <li key={id}>
                  <MaskReveal
                    lag={0.04 + scatter(i) * 0.2}
                    span={0.5 + scatter(i + 7) * 0.24}
                    shift={28}
                  >
                    <YouTube id={id} title={title} />
                  </MaskReveal>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- Sobre ---------- */}
        <section className={`section ${s.about}`} id="about">
          <div className={`container ${s.aboutInner}`}>
            <div className={s.aboutHead}>
              <h2 className="h3">{kit.about.title}</h2>
              <span className="rule rule-md" />
            </div>

            <div className={s.aboutBody}>
              {/* Mesmo lugar do vídeo na /work — aqui é o retrato, porque o
                  vídeo já abre a página. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={s.aboutPhoto}
                src="/images/rodrigo-retrato.webp"
                alt="Rodrigo Bondioli"
                width={1200}
                height={1200}
                loading="lazy"
              />

              <div className={s.aboutText}>
                {/* O cargo encostado no topo da foto e na esquerda do
                    texto, como na /work. */}
                <p className={`overline ${s.aboutRole}`}>{kit.about.role}</p>
                <div className={s.aboutCopy}>
                  <p className="body">{kit.about.text}</p>
                  <Brands label="Brands I've worked with" />
                </div>
              </div>
            </div>

            <ul className={s.credentials}>
              {credentials.map(([left, right]) => (
                <li key={left}>
                  <span className="body-sm">&mdash; {left}</span>
                  <span className="body-sm">&mdash; {right}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <SiteFooter />
      {/* Duas diferenças em relação à /work, e as duas são por falta de
          vizinho: aqui não há faixa de números no pé do herói, então a
          barra pode entrar assim que o "Say hello" do topo sai da tela; e
          não há contato, então quem a esconde no fim é o rodapé — senão
          ela termina a página sentada em cima das redes. */}
      <MeetingBar hideOver="footer" entraApos={0} />
    </>
  )
}
