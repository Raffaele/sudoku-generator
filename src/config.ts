export interface BookConfig {
  /** Puzzle per pagina (1, 2, 4, 6…). */
  puzzlesPerPage: number
  /** Soluzioni per pagina (4, 6, 9, 12…). */
  solutionsPerPage: number
  /** Numero stampato sulla prima pagina di questo PDF. */
  startPageNumber: number
  totalPuzzles: number
  /** Celle occupate nel primo puzzle. */
  cluesStart: number
  /** Celle occupate nell'ultimo puzzle (interpolazione lineare arrotondata). */
  cluesEnd: number
  /** Solo naked/hidden singles. */
  singlesOnly: boolean
  seed: number
  /** Riga "Date: ___ Time: ___" sotto ogni puzzle. */
  showDateTime: boolean
  /** Pagina "Solutions" prima delle soluzioni. */
  solutionsDivider: boolean
}

export const DEFAULT_CONFIG: BookConfig = {
  puzzlesPerPage: 2,
  solutionsPerPage: 9,
  startPageNumber: 1,
  totalPuzzles: 306,
  cluesStart: 45,
  cluesEnd: 36,
  singlesOnly: true,
  seed: 2026,
  showDateTime: true,
  solutionsDivider: true,
}

/** Restituisce i messaggi di errore (array vuoto se la configurazione è valida). */
export function validateConfig(c: BookConfig): string[] {
  const errors: string[] = []
  const positiveInt = (name: string, v: number, min = 1) => {
    if (!Number.isInteger(v) || v < min) errors.push(`${name} deve essere un intero >= ${min}`)
  }
  positiveInt('puzzlesPerPage', c.puzzlesPerPage)
  positiveInt('solutionsPerPage', c.solutionsPerPage)
  positiveInt('startPageNumber', c.startPageNumber)
  positiveInt('totalPuzzles', c.totalPuzzles)
  positiveInt('seed', c.seed, 0)
  for (const [name, v] of [['cluesStart', c.cluesStart], ['cluesEnd', c.cluesEnd]] as const) {
    if (!Number.isInteger(v) || v < 17 || v > 81) errors.push(`${name} deve essere un intero tra 17 e 81`)
  }
  return errors
}
