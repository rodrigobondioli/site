import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * Largura e altura de uma imagem, lidas do cabeçalho do arquivo em tempo de
 * build. Só roda no servidor — e como o site é `output: "export"`, "servidor"
 * aqui quer dizer `next build` e mais nada.
 *
 * Por que isto existe: o MaskReveal calcula o progresso pela posição da
 * caixa. Imagem sem `width`/`height` declarados nasce com altura zero até
 * carregar, o progresso sai de uma posição errada e a peça pula na tela.
 * O CMS do Framer não guardava as dimensões, então elas vêm do arquivo.
 *
 * Ler o cabeçalho em vez de instalar uma dependência: são quatro formatos
 * (PNG, WebP, JPEG, GIF) e os bytes que interessam estão todos nos
 * primeiros quilobytes.
 */

export type Size = { w: number; h: number }

const cache = new Map<string, Size | null>()

function parse(buf: Buffer): Size | null {
  // PNG: assinatura de 8 bytes, depois o chunk IHDR com largura e altura
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
  }

  // GIF: "GIF8", largura e altura em little-endian logo na sequência
  if (buf.length > 10 && buf.toString("ascii", 0, 4) === "GIF8") {
    return { w: buf.readUInt16LE(6), h: buf.readUInt16LE(8) }
  }

  /* WebP: contêiner RIFF com três variantes de miolo, e cada uma guarda as
     medidas num lugar diferente. Precisa das três porque o conversor pode
     escolher qualquer uma dependendo da imagem. */
  if (buf.length > 30 && buf.toString("ascii", 0, 4) === "RIFF" &&
      buf.toString("ascii", 8, 12) === "WEBP") {
    const tipo = buf.toString("ascii", 12, 16)

    // VP8 (com perda): medidas de 14 bits logo depois da assinatura 9d 01 2a
    if (tipo === "VP8 ") {
      return {
        w: buf.readUInt16LE(26) & 0x3fff,
        h: buf.readUInt16LE(28) & 0x3fff,
      }
    }

    // VP8L (sem perda): 14 bits de largura-1 e 14 de altura-1, empacotados
    if (tipo === "VP8L") {
      const b = buf.readUInt32LE(21)
      return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 }
    }

    // VP8X (estendido: alfa, animação): 24 bits de cada medida, menos 1
    if (tipo === "VP8X") {
      const w = buf[24] | (buf[25] << 8) | (buf[26] << 16)
      const h = buf[27] | (buf[28] << 8) | (buf[29] << 16)
      return { w: w + 1, h: h + 1 }
    }
  }

  // JPEG: percorre os marcadores até um SOF, que é onde ficam as medidas.
  // Os marcadores 0xC4, 0xC8 e 0xCC também começam com 0xC mas não são SOF.
  if (buf.length > 4 && buf.readUInt16BE(0) === 0xffd8) {
    let i = 2
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) {
        i++
        continue
      }
      const marker = buf[i + 1]
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) }
      }
      i += 2 + buf.readUInt16BE(i + 2)
    }
  }

  return null
}

/** `src` é o caminho público ("/projects/x/gallery.png"), não o do disco. */
export function imageSize(src?: string | null): Size | null {
  if (!src || !src.startsWith("/")) return null
  if (cache.has(src)) return cache.get(src) ?? null

  let size: Size | null = null
  try {
    // 64KB dá de sobra pra qualquer cabeçalho, inclusive JPEG com EXIF grande
    size = parse(readFileSync(join(process.cwd(), "public", src)).subarray(0, 65536))
  } catch {
    // arquivo ausente não derruba o build: a imagem vai sem dimensão
    size = null
  }

  cache.set(src, size)
  return size
}
