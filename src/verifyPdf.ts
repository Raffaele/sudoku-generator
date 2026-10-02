
const STANDARD_FONTS = /\/BaseFont\s*\/(?:[A-Z]{6}\+)?(Helvetica|Times|Courier|Symbol|ZapfDingbats)/g
const TOLERANCE = 0.01

export function countPages(pdf: Uint8Array): number {
  return (new TextDecoder('latin1').decode(pdf).match(/\/Type\s*\/Page\b/g) ?? []).length
}

export interface PdfExpectation {
  pages: number
  /** Dimensioni di ogni pagina, in punti. */
  width: number
  height: number
  /** Nome per i messaggi (es. "Introduzione"). */
  name: string
}

/**
 * Controlli sul PDF prodotto. Restituisce i problemi trovati (array vuoto se tutto è a posto):
 * - numero di pagine uguale a quello calcolato dal layout
 * - ogni pagina misura le dimensioni del formato scelto
 * - nessun font standard non incorporato (Helvetica, Times, Courier) e ogni font con il file incorporato
 *
 * Non controlla margini e numeri di pagina: richiederebbe di estrarre la posizione del testo.
 */
export function verifyPdf(pdf: Uint8Array, expected: PdfExpectation): string[] {
  const { width: PAGE_WIDTH, height: PAGE_HEIGHT } = expected
  const text = new TextDecoder('latin1').decode(pdf)
  const problems: string[] = []
  const report = (message: string) => problems.push(`${expected.name}: ${message}`)

  const pages = (text.match(/\/Type\s*\/Page\b/g) ?? []).length
  if (pages !== expected.pages) {
    report(`Il PDF ha ${pages} pagine, attese ${expected.pages} (probabili pagine vuote o mancanti)`)
  }

  const wrongSizes = new Map<string, number>()
  for (const [, w, h] of text.matchAll(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/g)) {
    if (Math.abs(Number(w) - PAGE_WIDTH) > TOLERANCE || Math.abs(Number(h) - PAGE_HEIGHT) > TOLERANCE) {
      const size = `${Number(w)} × ${Number(h)}`
      wrongSizes.set(size, (wrongSizes.get(size) ?? 0) + 1)
    }
  }
  for (const [size, count] of wrongSizes) {
    report(`${count} pagine misurano ${size} pt invece di ${PAGE_WIDTH} × ${PAGE_HEIGHT}`)
  }

  const standard = new Set([...text.matchAll(STANDARD_FONTS)].map((m) => m[1]))
  if (standard.size > 0) {
    report(`Font non incorporati: ${[...standard].join(', ')}`)
  }
  const descriptors = (text.match(/\/Type\s*\/FontDescriptor\b/g) ?? []).length
  const embedded = (text.match(/\/FontFile[23]?\b/g) ?? []).length
  if (descriptors > embedded) {
    report(`${descriptors - embedded} font senza file incorporato`)
  }

  return problems
}
