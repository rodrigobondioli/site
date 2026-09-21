import type { Metadata } from "next"
import SiteNav from "@/components/SiteNav"
import SmoothScroll from "@/components/SmoothScroll"
import { SiteFooter } from "@/components/SiteFooter"
import MeetingBar from "@/components/MeetingBar"
import MaskReveal from "@/components/MaskReveal"
import ProjectVideo from "@/components/ProjectVideo"
import ProjectPager from "@/components/ProjectPager"
import ClosingSection from "@/components/ClosingSection"
import {
  getProject,
  allSlugs,
  asset,
  galleryUrls,
  hasText,
  around,
} from "@/lib/projects"
import { imageSize } from "@/lib/imageSize"
import s from "./project.module.css"

/* Uma página, um conteúdo por projeto. A estrutura abaixo foi medida no
   Framer, não inventada: capa 16:9 → nome · disciplinas · ano → abertura →
   régua → os quatro blocos de duas colunas (título à esquerda, texto à
   direita, 88 de intervalo) com as mídias intercaladas → faixa de anterior
   e próximo → o mesmo contato da /work.

   Metade dos campos é opcional — vídeo em 5 dos 16, outcome em 7, link em
   12, press em 1. Cada bloco decide sozinho se aparece. */

export function generateStaticParams() {
  return allSlugs().map((slug) => ({ slug }))
}

/* O Next entrega o parâmetro como ele aparece na URL, ou seja, percent-encoded.
   Um slug com acento ("amor-de-cão") chega aqui como "amor-de-c%C3%A3o" e a
   busca no JSON falha em silêncio — a página saía em branco, só com o título
   genérico do site. Decodificar é o que faz a rota bater com o conteúdo. */
function lerSlug(bruto: string): string {
  try {
    return decodeURIComponent(bruto)
  } catch {
    return bruto
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const slug = lerSlug((await params).slug)
  const p = getProject(slug)
  if (!p) return {}
  const capa = asset(p.heroImage)
  return {
    title: p.projectName ?? slug,
    description: p.description ?? undefined,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      title: p.projectName ?? slug,
      description: p.description ?? undefined,
      images: capa ? [capa] : undefined,
    },
  }
}

/** Bloco de conteúdo: título à esquerda, texto à direita. Os quatro
 *  (challenge, solution, outcome, press) têm exatamente esta forma. */
function Block({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className={s.block}>
      <h2 className={`h3 ${s.blockTitle}`}>{title}</h2>
      <div className={s.blockBody}>{children}</div>
    </div>
  )
}

/** Imagem com as dimensões lidas do arquivo, sob a máscara de revelação. */
function Shot({ src, alt, lag }: { src: string; alt: string; lag: number }) {
  const size = imageSize(src)
  return (
    <MaskReveal className={s.shot} lag={lag} span={0.58} shift={32}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" width={size?.w} height={size?.h} />
    </MaskReveal>
  )
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const slug = lerSlug((await params).slug)
  const p = getProject(slug)
  if (!p) return null

  const name = p.projectName ?? slug
  const capa = asset(p.heroImage)
  const capaSize = imageSize(capa)
  const shots = galleryUrls(p.gallery)
  /* A primeira foto sai da galeria e vira irmã dela. No desktop nada muda —
     o CSS devolve o intervalo de 24 entre as duas. No celular ela sobe pra
     antes do "The challenge": sem isso, a descrição e o desafio caem um
     atrás do outro e são dois blocos de texto seguidos, que foi o que o
     Rodrigo viu. */
  const [primeiraFoto, ...demaisFotos] = shots
  const posts = galleryUrls(p.galleryPosts)
  const { prev, next } = around(slug)
  const temVideo = Boolean(p.videoYouTube || p.videoVimeo || p.videoUpload)

  /* type / link / ano, separados por barras — mas só entre os que existem.
     Quatro projetos não têm link, e o Framer deixava as duas barras coladas
     ("• GROWTH / / 2015"). É o separador órfão: aqui ele não nasce. */
  const meta: React.ReactNode[] = []
  if (p.type) meta.push(<span key="type">{p.type}</span>)
  if (p.linkUrl)
    meta.push(
      <a key="link" href={p.linkUrl} target="_blank" rel="noopener noreferrer">
        {p.linkText ?? p.linkUrl.replace(/^https?:\/\//, "")}
      </a>
    )

  return (
    <>
      <SmoothScroll />
      <SiteNav dark back ctaHref="#contact" brandHref="/work" />

      <main className={`on-dark ${s.page}`}>
        {/* ---------- Capa ---------- */}
        <section className={`section ${s.heroSection}`}>
          <div className="container">
            <div className={s.hero}>
              {capa ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={capa}
                  alt={name}
                  width={capaSize?.w}
                  height={capaSize?.h}
                  /* é o que a pessoa vê primeiro: carrega na frente */
                  fetchPriority="high"
                />
              ) : null}
            </div>
          </div>
        </section>

        {/* ---------- Nome, disciplinas, ano ---------- */}
        <section className={`section ${s.titleSection}`}>
          <div className={`container ${s.titleRow}`}>
            <h1 className={`h3 ${s.name}`}>{name}</h1>
            {/* O ano sai da ficha e vira irmão do nome: é curto, então
                acompanha o título sem nunca disputar espaço com ele, por
                mais longo que o nome seja. */}
            {p.year ? <span className={`overline ${s.year}`}>{p.year}</span> : null}
            <p className={`overline ${s.meta}`}>
              {meta.map((n, i) => (
                <span className={s.metaItem} key={i}>
                  {n}
                </span>
              ))}
            </p>
          </div>
        </section>

        {/* ---------- Abertura ---------- */}
        {p.description ? (
          <section className={`section ${s.leadSection}`}>
            <p className={`container body-lg`}>{p.description}</p>
          </section>
        ) : null}

        <div className={`section ${s.ruleSection}`}>
          <div className="container">
            <span className={s.rule} />
          </div>
        </div>

        {/* ---------- O problema, e o que veio depois ---------- */}
        <section className={`section ${s.body}`}>
          <div className={`container ${s.bodyInner}`}>
            {p.challenge ? (
              <Block title="The challenge">
                <p className="body">{p.challenge}</p>
              </Block>
            ) : null}

            {temVideo ? (
              <div className={s.video}>
                <ProjectVideo
                  youtube={p.videoYouTube}
                  vimeo={p.videoVimeo}
                  file={asset(p.videoUpload)}
                  title={name}
                />
              </div>
            ) : null}

            {primeiraFoto ? (
              <div className={s.primeira}>
                <Shot src={primeiraFoto} alt={`${name} — 1`} lag={0.04} />
              </div>
            ) : null}

            {demaisFotos.length ? (
              <div className={s.gallery}>
                {demaisFotos.map((src, i) => (
                  <Shot
                    key={src}
                    src={src}
                    alt={`${name} — ${i + 2}`}
                    lag={0.04 + ((i + 1) % 3) * 0.05}
                  />
                ))}
              </div>
            ) : null}

            {p.solution ? (
              <Block title="The solution">
                <p className="body">{p.solution}</p>
              </Block>
            ) : null}

            {posts.length ? (
              <div className={s.posts}>
                {posts.map((src, i) => (
                  <Shot
                    key={src}
                    src={src}
                    alt={`${name} — post ${i + 1}`}
                    lag={0.04 + (i % 2) * 0.06}
                  />
                ))}
              </div>
            ) : null}

            {p.outcome ? (
              <Block title="The outcome">
                <p className="body">{p.outcome}</p>
              </Block>
            ) : null}

            {hasText(p.press) ? (
              <Block title="Press">
                <div
                  className={`body ${s.press}`}
                  /* HTML do nosso próprio CMS, exportado do Framer: parágrafos
                     e links, nada de script. Só o Tattoaria usa. */
                  dangerouslySetInnerHTML={{ __html: p.press as string }}
                />
              </Block>
            ) : null}
          </div>
        </section>

        {/* ---------- Anterior e próximo ---------- */}
        <ProjectPager prev={prev} next={next} />

      </main>

      {/* ---------- Contato: o mesmo fecho da /work ---------- */}
      <ClosingSection />

      <SiteFooter />
      <MeetingBar />
    </>
  )
}
