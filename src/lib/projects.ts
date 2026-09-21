import data from "@/content/projects.json"

export interface GalleryItem { [key: string]: unknown }

export interface Project {
  id: string
  slug: string
  draft: boolean
  projectName: string | null
  linkText: string | null
  linkUrl: string | null
  color: string | null
  isTemplate: boolean | null
  year: string | null
  type: string | null
  what: string | null
  description: string | null
  challenge: string | null
  solution: string | null
  thumb: string | null
  heroImage: string | null
  gallery: GalleryItem[] | null
  galleryPosts: GalleryItem[] | null
  videoYouTube: string | null
  videoUpload: string | null
  videoVimeo: string | null
  outcome: string | null
  press: string | null
}

export const projects = data as unknown as Project[]

export const publishedProjects = projects.filter((p) => !p.draft)

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug)
}

export function allSlugs(): string[] {
  return publishedProjects.map((p) => p.slug)
}

/* ---------- Assets ---------- *
 * O CMS do Framer guarda URLs de framerusercontent.com. Os arquivos foram
 * baixados e vivem em /public. Este mapa traduz uma coisa na outra.
 *
 * Se um URL não estiver no mapa, ele passa direto: a página ainda funciona,
 * só que servindo do Framer. É o modo degradado, não o esperado.            */

import assetMap from "@/content/assets.json"

const ASSETS = assetMap as Record<string, string>

export function asset(url?: string | null): string | null {
  if (!url) return null
  return ASSETS[url] ?? url
}

/** Achata o formato do CMS ({ fieldData: { <campo>: { value } } }) em URLs. */
export function galleryUrls(items?: GalleryItem[] | null): string[] {
  if (!items?.length) return []
  const urls: string[] = []
  for (const item of items) {
    const fieldData = (item as { fieldData?: Record<string, unknown> }).fieldData
    if (!fieldData) continue
    for (const field of Object.values(fieldData)) {
      const value = (field as { value?: unknown })?.value
      if (typeof value === "string" && value) {
        const local = asset(value)
        if (local) urls.push(local)
      }
    }
  }
  return urls
}

/** Ordem de exibição no arquivo. order.json manda; o resto vai atrás. */
export function orderedProjects(order: string[]): Project[] {
  const rank = new Map(order.map((slug, i) => [slug, i]))
  return [...publishedProjects].sort(
    (a, b) => (rank.get(a.slug) ?? 999) - (rank.get(b.slug) ?? 999)
  )
}
