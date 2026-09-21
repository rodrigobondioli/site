import type { Metadata } from "next"
import Link from "next/link"
import SiteNav from "@/components/SiteNav"
import SmoothScroll from "@/components/SmoothScroll"
import { SiteFooter } from "@/components/SiteFooter"
import MaskReveal from "@/components/MaskReveal"
import ProjectVideo from "@/components/ProjectVideo"
import PillButton from "@/components/PillButton"
import {
  getProject,
  allSlugs,
  asset,
  galleryUrls,
  hasText,
  neighbour,
} from "@/lib/projects"
import { imageSize } from "@/lib/imageSize"
import s from "./project.module.css"

/* Uma página, dezesseis conteúdos. A estrutura abaixo é a mesma pra todos;
   o que muda é o que vem do projects.json.

   Metade dos campos é opcional — vídeo existe em 5 dos 16, outcome em 7,
   link em 12, press em 1. Por isso cada bloco decide sozinho se aparece:
   um projeto sem vídeo não deixa buraco, ele simplesmente não tem aquela
   seção. Foi assim que o template aguentou o Tattoaria (tudo preenchido) e
   o Gabo (o mínimo) sem virar dois templates. */

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
  return {
    title: p.projectName ?? slug,
    description: p.description ?? undefined,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      title: p.projectName ?? slug,
      description: p.description ?? undefined,
      images: asset(p.heroImage) ? [asset(p.heroImage) as string] : undefined,
    },
  }
}

/** Imagem da galeria com as dimensões lidas do arquivo, sob a máscara. */
function Shot({ src, alt, lag }: { src: string; alt: string; lag: number }) {
  const size = imageSize(src)
  return (
    <MaskReveal className={s.shot} lag={lag} span={0.58} shift={32}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        width={size?.w}
        height={size?.h}
      />
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
  const hero = asset(p.heroImage)
  const heroSize = imageSize(hero)
  const shots = galleryUrls(p.gallery)
  const posts = galleryUrls(p.galleryPosts)
  const next = neighbour(slug)

  /* A galeria se divide entre os dois textos: um terço ilustra o problema,
     o resto ilustra a resposta. Com duas imagens dá uma pra cada lado; com
     nove, três e seis. Nunca sobra bloco vazio. */
  const corte = Math.ceil(shots.length / 3)
  const antes = shots.slice(0, corte)
  const depois = shots.slice(corte)

  const temVideo = Boolean(p.videoYouTube || p.videoVimeo || p.videoUpload)

  return (
    <>
      <SmoothScroll />
      <SiteNav dark ctaHref="/work#contact" />

      {/* A cor do projeto vira variável local: o acento da página é dele,
          não do site. */}
      <main
        className={`on-dark ${s.page}`}
        style={p.color ? ({ "--tint": p.color } as React.CSSProperties) : undefined}
      >
        {/* ---------- Capa ---------- */}
        <section className={`section ${s.hero}`}>
          <div className={`container ${s.heroInner}`}>
            <div className={s.heroText}>
              <p className="overline">
                {p.year}
                {p.what ? <span className={s.sep}>·</span> : null}
                {p.what}
              </p>
              <h1 className={`h1 ${s.title}`}>{name}</h1>
            </div>

            {hero ? (
              <MaskReveal className={s.heroImage} span={0.5} shift={24}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={hero}
                  alt={name}
                  width={heroSize?.w}
                  height={heroSize?.h}
                  /* a capa é o que a pessoa vê primeiro: carrega na frente */
                  fetchPriority="high"
                />
              </MaskReveal>
            ) : null}
          </div>
        </section>

        {/* ---------- Ficha e descrição ---------- */}
        <section className={`section ${s.intro}`}>
          <div className={`container ${s.introInner}`}>
            <div className={s.metaRow}>
              {p.linkUrl ? (
                <a
                  className="overline"
                  href={p.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {p.linkText ?? p.linkUrl.replace(/^https?:\/\//, "")}
                </a>
              ) : (
                <span className="overline">{name}</span>
              )}
              <span className="overline">{p.type}</span>
            </div>

            {p.description ? (
              <p className={`body-lg ${s.lead}`}>{p.description}</p>
            ) : null}
          </div>
        </section>

        {/* ---------- Vídeo ---------- */}
        {temVideo ? (
          <section className={`section ${s.videoSection}`}>
            <div className="container">
              <ProjectVideo
                youtube={p.videoYouTube}
                vimeo={p.videoVimeo}
                file={asset(p.videoUpload)}
                title={name}
              />
            </div>
          </section>
        ) : null}

        {/* ---------- Problema e resposta ---------- */}
        <section className={`section ${s.case}`}>
          <div className={`container ${s.caseInner}`}>
            {p.challenge ? (
              <div className={s.block}>
                <div className="head-row">
                  <h2 className="h4">The challenge</h2>
                  <span className="rule rule-md" />
                </div>
                <p className="body">{p.challenge}</p>
              </div>
            ) : null}

            {antes.map((src, i) => (
              <Shot key={src} src={src} alt={`${name} — ${i + 1}`} lag={0.04 + (i % 3) * 0.05} />
            ))}

            {p.solution ? (
              <div className={s.block}>
                <div className="head-row">
                  <h2 className="h4">The solution</h2>
                  <span className="rule rule-md" />
                </div>
                <p className="body">{p.solution}</p>
              </div>
            ) : null}

            {depois.map((src, i) => (
              <Shot
                key={src}
                src={src}
                alt={`${name} — ${antes.length + i + 1}`}
                lag={0.04 + (i % 3) * 0.05}
              />
            ))}
          </div>
        </section>

        {/* ---------- Posts ---------- */}
        {posts.length ? (
          <section className={`section ${s.posts}`}>
            <div className={`container ${s.postsInner}`}>
              <div className="head-row">
                <h2 className="h5">Social</h2>
                <span className="rule rule-sm" />
              </div>
              <ul className={s.postsGrid}>
                {posts.map((src, i) => (
                  <li key={src}>
                    <Shot src={src} alt={`${name} — post ${i + 1}`} lag={0.04 + (i % 3) * 0.06} />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {/* ---------- Resultado ---------- */}
        {p.outcome || hasText(p.press) ? (
          <section className={`section ${s.outcome}`}>
            <div className={`container ${s.outcomeInner}`}>
              <p className="overline">Outcome</p>
              {p.outcome ? <p className={`h3 ${s.outcomeText}`}>{p.outcome}</p> : null}
              {hasText(p.press) ? (
                <div
                  className={s.press}
                  /* HTML do nosso próprio CMS, exportado do Framer: são
                     parágrafos e links, nada de script. Só o Tattoaria usa. */
                  dangerouslySetInnerHTML={{ __html: p.press as string }}
                />
              ) : null}
            </div>
          </section>
        ) : null}

        {/* ---------- Próximo ---------- */}
        {next ? (
          <section className={`section ${s.next}`}>
            <Link href={`/projects/${next.slug}`} className={`container ${s.nextInner}`}>
              <span className="overline">Next project</span>
              <span className={`h2 ${s.nextName}`}>
                {next.projectName ?? next.slug}
              </span>
              <span className={s.nextArrow} aria-hidden="true">
                <svg viewBox="0 0 18 18" width="18" height="18" fill="none"
                     stroke="currentColor" strokeWidth="1.6"
                     strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3.5 9h11M10 4.5 14.5 9 10 13.5" />
                </svg>
              </span>
            </Link>
          </section>
        ) : null}

        <section className={`section ${s.back}`}>
          <div className={`container ${s.backInner}`}>
            <PillButton href="/work#projects">See all work</PillButton>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
