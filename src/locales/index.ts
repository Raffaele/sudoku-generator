import { en } from './en.ts'

/** Etichette stampate. Aggiungere una lingua = aggiungere un file qui e la chiave in `LOCALES`. */
export type Labels = typeof en

export const LOCALES = { en } satisfies Record<string, Labels>

export type LocaleId = keyof typeof LOCALES
