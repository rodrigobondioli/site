/**
 * O que a API pública do YouTube responde sem login.
 *
 * Só o que é público: inscritos, total de vídeos e a lista de uploads com
 * as views de cada um. Impressões, CTR, retenção, idade, gênero e países
 * moram na YouTube Analytics API, que exige OAuth do dono do canal — esses
 * continuam vindo do `mediakit.json`.
 *
 * Três regras, e nenhuma é opcional:
 *
 * 1. **Sem chave, nem tenta.** `YOUTUBE_API_KEY` vazia devolve `null` na
 *    hora, sem rede. O build tem que rodar offline — é a mesma razão de as
 *    fontes serem auto-hospedadas (ver src/app/fonts.ts).
 * 2. **Falha não derruba build.** Timeout curto, try/catch em tudo, e
 *    quem chama usa o JSON como rede. Um número velho é melhor que uma
 *    página que não sobe.
 * 3. **Nada disso vai pro navegador.** A chave é lida no servidor, no
 *    build (e na revalidação diária). O cliente recebe só o número pronto.
 *
 * Custo de cota: ~5 unidades por atualização, de 10.000 por dia.
 */

const API = "https://www.googleapis.com/youtube/v3"
const HANDLE = "falabondioli"

/* O canal tem 69 vídeos. Duzentos dá folga de anos sem virar paginação
   infinita se um dia a API devolver mais do que o esperado. */
const TETO_DE_UPLOADS = 200

/* Shorts ficam de fora: a grade é 16:9, e um vertical entraria decepado.
   O limite do formato hoje é 3 minutos. */
const SEGUNDOS_MINIMOS = 180

export type Video = { id: string; title: string; views: number }

export type Canal = {
  /** já formatado em inglês: "31,300" */
  inscritos: string | null
  videos: string | null
  maisVistos: Video[]
  /** quando estes números foram buscados: "Sep 24, 2026" */
  atualizado: string
}

type ItemDeCanal = {
  statistics?: { subscriberCount?: string; videoCount?: string }
  contentDetails?: { relatedPlaylists?: { uploads?: string } }
}

type ItemDePlaylist = { contentDetails?: { videoId?: string } }

type ItemDeVideo = {
  id?: string
  snippet?: { title?: string }
  statistics?: { viewCount?: string }
  contentDetails?: { duration?: string }
}

const numero = new Intl.NumberFormat("en-US")

/* O fuso é o do Rodrigo, não o do servidor: na Vercel o build roda em UTC,
   e depois das 21h aqui a data viraria "amanhã" pra quem está em São
   Paulo olhando a própria página. */
const data = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
})

/** PT1H2M3S → 3723 */
function segundos(iso: string | undefined): number {
  if (!iso) return 0
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso)
  if (!m) return 0
  const [, h, min, s] = m
  return Number(h ?? 0) * 3600 + Number(min ?? 0) * 60 + Number(s ?? 0)
}

async function buscar<T>(caminho: string, chave: string): Promise<T | null> {
  try {
    const r = await fetch(`${API}/${caminho}&key=${chave}`, {
      signal: AbortSignal.timeout(4000),
    })
    if (!r.ok) return null
    return (await r.json()) as T
  } catch {
    return null
  }
}

export async function dadosDoCanal(): Promise<Canal | null> {
  const chave = process.env.YOUTUBE_API_KEY
  if (!chave) return null

  const canal = await buscar<{ items?: ItemDeCanal[] }>(
    `channels?part=statistics,contentDetails&forHandle=${HANDLE}`,
    chave
  )
  const perfil = canal?.items?.[0]
  if (!perfil) return null

  const inscritos = perfil.statistics?.subscriberCount
  const videos = perfil.statistics?.videoCount
  const uploads = perfil.contentDetails?.relatedPlaylists?.uploads

  /* A lista de uploads e a ordenação por views acontecem aqui, e não num
     `search?order=viewCount`: a busca custa 100 unidades de cota, sai de
     um índice que atrasa, e não devolve as views pra conferir. */
  const ids: string[] = []
  let pagina: string | undefined
  while (uploads && ids.length < TETO_DE_UPLOADS) {
    const lista = await buscar<{
      items?: ItemDePlaylist[]
      nextPageToken?: string
    }>(
      `playlistItems?part=contentDetails&maxResults=50&playlistId=${uploads}` +
        (pagina ? `&pageToken=${pagina}` : ""),
      chave
    )
    if (!lista?.items?.length) break
    for (const item of lista.items) {
      const id = item.contentDetails?.videoId
      if (id) ids.push(id)
    }
    pagina = lista.nextPageToken
    if (!pagina) break
  }

  const achados: Video[] = []
  for (let i = 0; i < ids.length; i += 50) {
    const lote = ids.slice(i, i + 50).join(",")
    const detalhe = await buscar<{ items?: ItemDeVideo[] }>(
      `videos?part=snippet,statistics,contentDetails&id=${lote}`,
      chave
    )
    for (const v of detalhe?.items ?? []) {
      if (!v.id || !v.snippet?.title) continue
      if (segundos(v.contentDetails?.duration) < SEGUNDOS_MINIMOS) continue
      achados.push({
        id: v.id,
        title: v.snippet.title,
        views: Number(v.statistics?.viewCount ?? 0),
      })
    }
  }

  achados.sort((a, b) => b.views - a.views)

  return {
    inscritos: inscritos ? numero.format(Number(inscritos)) : null,
    videos: videos ? numero.format(Number(videos)) : null,
    maisVistos: achados.slice(0, 4),
    atualizado: data.format(new Date()),
  }
}
