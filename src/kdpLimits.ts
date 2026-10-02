export interface CustomTrim {
  widthIn: number
  heightIn: number
}

export const TRIM_PRESETS = {
  letter: { widthIn: 8.5, heightIn: 11 },
  a4: { widthIn: 8.27, heightIn: 11.69 },
  '8x10': { widthIn: 8, heightIn: 10 },
} satisfies Record<string, CustomTrim>

export type TrimPreset = keyof typeof TRIM_PRESETS
export type TrimSize = TrimPreset | CustomTrim

export function resolveTrim(trim: TrimSize): CustomTrim {
  return typeof trim === 'string' ? TRIM_PRESETS[trim] : trim
}

export function trimKey(trim: TrimSize): string {
  if (typeof trim === 'string') return trim
  return `${trim.widthIn}x${trim.heightIn}`
}

/**
 * Pagine massime per formato, per **inchiostro nero e carta bianca** (il caso di questo libro).
 * Chiave = `trimKey`, valore = pagine massime. Fonte: tabella dei limiti nelle guide KDP
 * (https://kdp.amazon.com/en_US/help/topic/G201857950 e .../GVBQ3CMEQW3W2VL6), consultata il 2026-10-02.
 * Con carta crema o altri inchiostri i limiti sono più bassi: aggiorna la tabella se cambiano.
 * Un formato personalizzato non è in tabella: usa `DEFAULT_MAX_PAGES` con un avviso.
 */
export const KDP_MAX_PAGES: Record<string, number> = {
  letter: 590,
  a4: 780,
  '8x10': 828,
}

/** Ripiego per i formati non in tabella. */
export const DEFAULT_MAX_PAGES = 828

export function maxPagesFor(trim: TrimSize): { max: number; verified: boolean } {
  const max = KDP_MAX_PAGES[trimKey(trim)]
  return max === undefined ? { max: DEFAULT_MAX_PAGES, verified: false } : { max, verified: true }
}
