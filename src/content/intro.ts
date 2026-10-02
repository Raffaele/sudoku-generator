import type { LocaleId } from '../locales/index.ts'
import { introEn, type IntroContent } from './intro.en.ts'

export const INTRO_CONTENT: Record<LocaleId, IntroContent> = { en: introEn }

/** Prima lettera di ogni parola maiuscola, il resto minuscolo ("EASY SUDOKU" → "Easy Sudoku"). */
export function titleCase(s: string): string {
  return s.toLowerCase().replace(/(^|\s)(\S)/g, (_, space: string, c: string) => space + c.toUpperCase())
}
