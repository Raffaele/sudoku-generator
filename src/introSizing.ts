export interface IntroSizing {
  /** Lato della Figura 2 (pagina iv). */
  figure2Size: number
  /** Corpo del testo (pagine iii e iv). */
  bodySize: number
}

export const DEFAULT_INTRO_SIZING: IntroSizing = { figure2Size: 240, bodySize: 15 }

/** Tentativi in ordine: prima si riduce la Figura 2 (minimo 150 pt), poi il corpo del testo (minimo 14 pt). */
export const INTRO_SIZING_STEPS: IntroSizing[] = [
  DEFAULT_INTRO_SIZING,
  { figure2Size: 220, bodySize: 15 },
  { figure2Size: 200, bodySize: 15 },
  { figure2Size: 180, bodySize: 15 },
  { figure2Size: 150, bodySize: 15 },
  { figure2Size: 150, bodySize: 14.5 },
  { figure2Size: 150, bodySize: 14 },
]
