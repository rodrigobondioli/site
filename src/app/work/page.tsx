import type { Metadata } from "next"
import SiteNav from "@/components/SiteNav"
import SmoothScroll from "@/components/SmoothScroll"
import { SiteFooter } from "@/components/SiteFooter"
import MeetingBar from "@/components/MeetingBar"
import CountUpNumber from "@/components/CountUpNumber"
import YouTube from "@/components/YouTube"
import Marquee from "@/components/Marquee"
import ProjectCard from "@/components/ProjectCard"
import ClosingSection from "@/components/ClosingSection"
import Brands from "@/components/Brands"
import ScrollReveal from "@/components/ScrollReveal"
import MaskReveal from "@/components/MaskReveal"
import { orderedProjects, asset } from "@/lib/projects"
import order from "@/content/order.json"
import s from "./work.module.css"

export const metadata: Metadata = {
  title: "Work",
  description:
    "Selected work: brand, product and interface for startups and global brands. Work that started with a problem, not a prompt.",
  alternates: { canonical: "/work" },
}

const CAPABILITIES = [
  "CONCEPT FIRST",
  "BEAUTY WITH A REASON",
  "YOUR BRIEF IS A GUESS",
  "DIRECTION BEFORE CODE",
  "I'LL DISAGREE WITH YOU",
  "NO BULLSHIT",
]

const CREDENTIALS: [string, string][] = [
  ["Orpetron X3 / 2024", "Cannes Lion 2014 / Silver / Cyber"],
  ["Clio Awards / 2009", "UI Design mentor @ Designer Singular"],
  ["YouTube content creator", "Dora Ambassador"],
  ["Webflow Partner", "Framer PRO Partner"],
]

const TAGS = ["Concept", "Brand", "App design", "Landing page"]

/* Com largura e altura declaradas o navegador reserva a caixa antes da
   imagem chegar. Sem isso a caixa nasce com altura zero, a máscara calcula
   o progresso em cima de uma posição errada e a peça pula quando carrega. */
/* Desencontro dos cards do arquivo. Três entram na tela lado a lado; se
   todos largassem no mesmo ponto, a grade piscaria inteira de uma vez.
   Hash multiplicativo em vez de Math.random: o servidor e o navegador
   chegam no mesmo número, e o resultado é o mesmo a cada visita — o que
   varia é de card pra card, não de carregamento pra carregamento. */
const scatter = (i: number) => ((i * 2654435761) % 1000) / 1000

const SHOTS = [
  { src: "/site/work-2.png", w: 848, h: 834 },
  { src: "/site/work-3.png", w: 848, h: 647 },
  { src: "/site/work-4.png", w: 848, h: 614 },
]

export default function WorkPage() {
  const projects = orderedProjects(order as string[])

  return (
    <>
      <SmoothScroll />
      <SiteNav />

      <main>
        {/* ---------- Hero ---------- */}
        <section className={s.hero}>
          <div className={`container ${s.heroInner}`}>
            <h1 className="h1">
              Rodrigo Bondioli brings design and AI together, with more than 20
              years leading design for startups and global brands.
            </h1>
          </div>

          <div className={s.stats}>
            <div className={`container ${s.statsInner}`}>
              <p className={s.stat}>
                <CountUpNumber target={20} className={s.statNumber} />
                <span className={s.statLabel}>years in the creative industry</span>
              </p>
              <p className={s.stat}>
                <CountUpNumber target={180} className={s.statNumber} />
                <span className={s.statLabel}>projects delivered</span>
              </p>
              <p className={s.stat}>
                <CountUpNumber target={6} padTo={2} className={s.statNumber} />
                <span className={s.statLabel}>countries served</span>
              </p>
            </div>
          </div>
        </section>

        {/* ---------- Video de abertura ---------- */}
        <section className={`section ${s.reel}`}>
          <div className={`container ${s.reelInner}`}>
            <YouTube id="QSAe2rouM24" title="Ford + Tattoaria" autoplay />
            <p className="caption">
              Ford + Tattoaria campaign, in partnership with JWT (J. Walter
              Thompson).
            </p>
          </div>
        </section>

        {/* ---------- Manifesto ---------- */}
        <section className={`section ${s.statement}`}>
          <div className={`container ${s.statementInner}`}>
            <div className={s.headLine}>
              <p className="overline">No point of view, no project.</p>
              <span className="rule rule-sm" />
            </div>
            <p className={s.statementText}>
              Everyone is a prompt designer now. The result? Work that looks
              like it came from the same machine&mdash;because it did. I use the
              same tools. The difference is what I bring to them: a point of
              view, a problem worth solving, and the craft to make the answer
              feel inevitable. If you want fast and forgettable, plenty of
              people are waiting for your brief.
            </p>
          </div>
        </section>

        {/* ---------- Projeto em destaque ---------- */}
        <section className={s.featured}>
          <div className={`section ${s.featuredHead}`}>
            <div className="container">
              <h2 className="h3">
                <span className={s.dash}>&mdash;</span> Featured project
              </h2>
            </div>
          </div>

          <div className={s.featuredBody}>
            <div className={s.featuredImageCol}>
              <ScrollReveal className={s.featuredImage}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/homem-charuto.webp" alt="Go Ink — Get inspired, get inked" />
              </ScrollReveal>
            </div>

            <div className={s.featuredContent}>
              <div className={s.intro}>
              <div className={s.metaHolder}>
              <div className={s.metaRow}>
                <a
                  className="overline"
                  href="https://goink.framer.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  goink.com
                </a>
                <span className="overline">Get inspired. Get inked.</span>
              </div>
              </div>

              <div className={s.introBottom}>
                <p className="body">
                  Go Ink is a marketplace where tattoo artists only sell the
                  work they actually want to do, each piece already priced,
                  sized and placed on the body. No client and no brief: I built
                  it alone, out of something I watched happen for years while I
                  ran a tattoo studio.
                </p>

                <ul className={s.tags}>
                  {TAGS.map((t) => (
                    <li className={`pill pill-sm overline ${s.tag}`} key={t}>
                      <span className={s.tagDot} aria-hidden="true" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className={s.case}>
              <YouTube id="A2U0nzGS094" title="Go Ink APP by Tattoaria" />

              <div className={s.block}>
                <h3 className="h4">The challenge</h3>
                <p className="body">
                  Artists were constantly posting drawings on Facebook captioned
                  &ldquo;available to tattoo.&rdquo; Their weeks were full of
                  commercial work: the same lettering, the same little hearts,
                  the same names. Meanwhile the pieces they were dying to make
                  sat stranded in a sketchbook. And clients kept asking for the
                  safe thing, because the safe thing was all they&rsquo;d ever
                  been shown. Every platform in the category sold the
                  artist&rsquo;s time. None of them sold the artist&rsquo;s
                  work.
                </p>
              </div>

              <MaskReveal className={s.shotWrap} style={{ maxWidth: 848 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className={s.shot}
                  src="/site/work-6.png"
                  alt="Go Ink brand"
                  width={848}
                  height={468}
                  loading="lazy"
                />
              </MaskReveal>

              <div className={s.block}>
                <h3 className="h4">The solution</h3>
                <p className="body">
                  Go Ink flips who chooses: the artist uploads only the pieces
                  they want to tattoo, each one already priced, sized and placed
                  on the body. The client swipes, picks one and books the
                  session, with no negotiation, no brief and nothing watered
                  down along the way. I took it end to end on my own: market
                  research, product strategy, the name, the logo, the app, the
                  site and the T-shirt.
                </p>
              </div>

              {SHOTS.map(({ src, w, h }) => (
                <MaskReveal className={s.shotWrap} key={src} style={{ maxWidth: w }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className={s.shot}
                    src={src}
                    alt="Go Ink"
                    width={w}
                    height={h}
                    loading="lazy"
                  />
                </MaskReveal>
              ))}
            </div>
            </div>
          </div>
        </section>

        {/* ---------- Arquivo ---------- */}
        <section className={`section ${s.archive}`} id="projects">
          <div className={`container ${s.archiveInner}`}>
            <div className="head-row">
              <h2 className="h3">Selected work</h2>
              <span className="rule rule-lg" />
              <p className="overline">
                Work that started with a problem, not a prompt.
              </p>
            </div>

            <ul className={s.grid}>
              {projects.map((p, i) => (
                <li key={p.slug}>
                  <MaskReveal
                    lag={0.04 + scatter(i) * 0.2}
                    span={0.5 + scatter(i + 7) * 0.24}
                    shift={28}
                  >
                    <ProjectCard
                      slug={p.slug}
                      name={p.projectName ?? p.slug}
                      what={p.type}
                      thumb={asset(p.thumb)}
                    />
                  </MaskReveal>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- Ticker ---------- */}
        <section className={s.ticker}>
          <Marquee items={CAPABILITIES} />
        </section>

        {/* ---------- Sobre ---------- */}
        <section className={`section ${s.about}`} id="about">
          <div className={`container ${s.aboutInner}`}>
            <div className={s.aboutHead}>
              <h2 className="h3">I&rsquo;m Rodrigo Bondioli</h2>
              <span className="rule rule-md" />
            </div>

            <div className={s.aboutBody}>
              <video
                className={s.aboutVideo}
                src="/video/eu-profile.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="none"
              />
              <div className={s.aboutText}>
                {/* O cargo sai do cabeçalho e vem pra cá: encostado no topo
                    do vídeo e na esquerda do texto. */}
                <p className={`overline ${s.aboutRole}`}>Digital Product Strategist</p>
                <div className={s.aboutCopy}>
                <p className="body">
                Big projects rarely fail because of execution. They fail because
                someone chose to build the wrong thing, and no one in the room
                had the nerve to say so. I&rsquo;ve been in that room. I was
                Head of Creative at Netshoes and Americanas.com, two of
                Brazil&rsquo;s largest digital businesses. Before that, I spent
                20 years at agencies including Wunderman Thompson and McCann.
                You&rsquo;re hiring my judgment. I join the conversation where
                decisions are made, speak up before the wrong call becomes an
                expensive problem, and stay through launch&mdash;until the
                brand, product, and experience work as one.
                </p>
                <Brands label="Brands I've worked with" />
                </div>
              </div>
            </div>

            <ul className={s.credentials}>
              {CREDENTIALS.map(([left, right]) => (
                <li key={left}>
                  <span className="body-sm">&mdash; {left}</span>
                  <span className="body-sm">&mdash; {right}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- YouTube ---------- */}
        <section className={`section on-accent ${s.youtube}`}>
          <div className={`container ${s.youtubeInner}`}>
            <div className="head-row">
              <h2 className="h4">Content creator</h2>
              <span className="rule rule-sm" />
              <p className="overline">YouTube @falabondioli</p>
            </div>

            <YouTube
              id="99REpcA26k4"
              start={326}
              title="Como designers brasileiros estão ganhando em dólar com Framer"
            />

            <div className="head-row">
              <p className="overline">31K subscribers</p>
              <span className="rule rule-md" />
              <h3 className="h4">No bullshit</h3>
            </div>
          </div>
        </section>

        {/* ---------- Contato ---------- */}
        <ClosingSection />
      </main>

      <SiteFooter />
      <MeetingBar />
    </>
  )
}
