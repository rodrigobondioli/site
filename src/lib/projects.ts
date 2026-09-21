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
