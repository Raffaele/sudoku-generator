import { useEffect, useState } from 'react'
import { DEFAULT_CONFIG, validateConfig, type BookConfig, type IntroConfig } from './config.ts'
import { verifyFigures } from './content/figures.ts'
import { TRIM_PRESETS, resolveTrim, type TrimPreset } from './kdpLimits.ts'
import { computeBookLayout, type BookLayout } from './layout.ts'
import { LOCALES } from './locales/index.ts'
import { mergePdf } from './mergePdf.ts'
import type { Sudoku } from './lib/sudoku-generator.ts'
import { generatePuzzles, verifyBook } from './puzzles.ts'
import { renderPdf } from './renderPdf.ts'
import { verifyPdf } from './verifyPdf.ts'
import './App.css'

interface Result {
  book: Sudoku[]
  config: BookConfig
  layout: BookLayout
  /** URL dei PDF già renderizzati (blob): contenuto, introduzione (se generata) e libro completo. */
  contentUrl: string
  introUrl: string | null
  bookUrl: string | null
  /** Problemi trovati dal controllo sul PDF finito (vuoto se tutto a posto). */
  pdfProblems: string[]
}

type NumericKey = {
  [K in keyof BookConfig]: BookConfig[K] extends number ? K : never
}[keyof BookConfig]

type BooleanKey = {
  [K in keyof BookConfig]: BookConfig[K] extends boolean ? K : never
}[keyof BookConfig]

const NUMBER_FIELDS: { key: NumericKey; label: string }[] = [
  { key: 'puzzlesPerPage', label: 'Puzzle per pagina' },
  { key: 'solutionsPerPage', label: 'Soluzioni per pagina' },
  { key: 'totalPuzzles', label: 'Numero di puzzle' },
  { key: 'cluesStart', label: 'Celle occupate (primo)' },
  { key: 'cluesEnd', label: 'Celle occupate (ultimo)' },
  { key: 'seed', label: 'Seed' },
]

const BOOLEAN_FIELDS: { key: BooleanKey; label: string }[] = [
  { key: 'singlesOnly', label: 'Solo tecniche base' },
  { key: 'showDateTime', label: 'Riga Date/Time' },
  { key: 'solutionsDivider', label: 'Pagina "Solutions"' },
  { key: 'includeIntro', label: 'Genera introduzione' },
]

const INTRO_TEXT_FIELDS: { key: Exclude<keyof IntroConfig, 'year'>; label: string }[] = [
  { key: 'badge', label: 'Riga sopra il titolo' },
  { key: 'title', label: 'Titolo' },
  { key: 'subtitle', label: 'Sottotitolo' },
  { key: 'features', label: 'Caratteristiche' },
  { key: 'volume', label: 'Volume' },
  { key: 'author', label: 'Autore' },
  { key: 'isbn', label: 'ISBN' },
]

const CUSTOM_TRIM = 'custom'

function App() {
  const [config, setConfig] = useState<BookConfig>(DEFAULT_CONFIG)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const generate = () => {
    setBusy(true)
    setError(null)
    // Rimanda la generazione (sincrona e pesante) per far comparire lo stato "in corso".
    setTimeout(async () => {
      try {
        const errors = validateConfig(config)
        if (errors.length > 0) throw new Error(errors.join('\n'))
        const layout = computeBookLayout(config)
        const book = generatePuzzles(config)
        verifyBook(book, config)
        if (config.includeIntro) verifyFigures()

        const { pageWidth: width, pageHeight: height } = layout
        const check = async (blob: Blob, name: string, pages: number) =>
          verifyPdf(new Uint8Array(await blob.arrayBuffer()), { name, pages, width, height })

        const content = await renderPdf({ kind: 'content', book, config, layout })
        const pdfProblems = await check(content, 'Contenuto', layout.pdfPages)
        let intro: Blob | null = null
        let full: Blob | null = null
        if (config.includeIntro) {
          intro = await renderPdf({ kind: 'intro', config, layout })
          pdfProblems.push(...(await check(intro, 'Introduzione', layout.frontMatterPages)))
          full = await mergePdf([intro, content])
          pdfProblems.push(...(await check(full, 'Libro completo', layout.bookPages)))
        }
        const url = (b: Blob | null) => (b ? URL.createObjectURL(b) : null)
        setResult({
          book,
          config,
          layout,
          contentUrl: URL.createObjectURL(content),
          introUrl: url(intro),
          bookUrl: url(full),
          pdfProblems,
        })
      } catch (e) {
        setResult(null)
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setBusy(false)
      }
    }, 0)
  }

  // Libera il blob precedente quando viene sostituito o al termine.
  const urls = result && [result.contentUrl, result.introUrl, result.bookUrl]
  useEffect(
    () => () => urls?.forEach((u) => (u ? URL.revokeObjectURL(u) : undefined)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [result],
  )
  const [preview, setPreview] = useState<'bookUrl' | 'contentUrl' | 'introUrl'>('bookUrl')
  const trimIsPreset = typeof config.trimSize === 'string'
  const trimDims = resolveTrim(config.trimSize)
  const setIntro = (patch: Partial<IntroConfig>) => setConfig({ ...config, intro: { ...config.intro, ...patch } })

  const { layout } = result ?? {}

  return (
    <main className="app">
      <aside className="side">
      <h1>Sudoku book generator</h1>
      <div className="controls">
        {NUMBER_FIELDS.map(({ key, label }) => (
          <label key={key}>
            {label}
            <input
              type="number"
              value={config[key]}
              onChange={(e) => setConfig({ ...config, [key]: Number(e.target.value) })}
            />
          </label>
        ))}
        {BOOLEAN_FIELDS.map(({ key, label }) => (
          <label key={key} className="check">
            <input
              type="checkbox"
              checked={config[key]}
              onChange={(e) => setConfig({ ...config, [key]: e.target.checked })}
            />
            {label}
          </label>
        ))}
        <label>
          Formato
          <select
            value={trimIsPreset ? (config.trimSize as TrimPreset) : CUSTOM_TRIM}
            onChange={(e) =>
              setConfig({
                ...config,
                trimSize: e.target.value === CUSTOM_TRIM ? { ...trimDims } : (e.target.value as TrimPreset),
              })
            }
          >
            {Object.keys(TRIM_PRESETS).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
            <option value={CUSTOM_TRIM}>personalizzato</option>
          </select>
        </label>
        {!trimIsPreset &&
          (['widthIn', 'heightIn'] as const).map((k) => (
            <label key={k}>
              {k === 'widthIn' ? 'Larghezza (")' : 'Altezza (")'}
              <input
                type="number"
                step="0.01"
                value={trimDims[k]}
                onChange={(e) => setConfig({ ...config, trimSize: { ...trimDims, [k]: Number(e.target.value) } })}
              />
            </label>
          ))}
        <label>
          Lingua etichette
          <select value={config.locale} onChange={(e) => setConfig({ ...config, locale: e.target.value as BookConfig['locale'] })}>
            {Object.keys(LOCALES).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        {config.includeIntro && (
          <>
            {INTRO_TEXT_FIELDS.map(({ key, label }) => (
              <label key={key}>
                {label}
                <input type="text" value={config.intro[key]} onChange={(e) => setIntro({ [key]: e.target.value })} />
              </label>
            ))}
            <label>
              Anno
              <input type="number" value={config.intro.year} onChange={(e) => setIntro({ year: Number(e.target.value) })} />
            </label>
          </>
        )}
        <button type="button" onClick={generate} disabled={busy}>
          {busy ? 'Generazione…' : 'Genera'}
        </button>
        {result && (
          <>
            <a href={result.contentUrl} download={`content-seed${result.config.seed}.pdf`}>
              Scarica contenuto
            </a>
            {result.introUrl && (
              <a href={result.introUrl} download="intro.pdf">
                Scarica introduzione
              </a>
            )}
            {result.bookUrl && (
              <a href={result.bookUrl} download={`book-seed${result.config.seed}.pdf`}>
                Scarica libro completo (KDP)
              </a>
            )}
          </>
        )}
      </div>
      {error && <pre className="error">{error}</pre>}
      {result && layout && (
        <>
          <p className="summary">
            {layout.bookPages} pagine totali ({layout.pdfPages} di contenuto + {layout.frontMatterPages} di introduzione) · margine interno{' '}
            {(layout.innerMargin / 72).toFixed(3)}&quot; · puzzle {layout.puzzleGrid.cols}×
            {layout.puzzleGrid.rows} (titolo {layout.puzzleGrid.arrangement === 'side' ? 'a lato' : 'sopra'}), cifre {layout.puzzleGrid.digitSize.toFixed(1)} pt · soluzioni{' '}
            {layout.solutionGrid.cols}×{layout.solutionGrid.rows}, cifre{' '}
            {layout.solutionGrid.digitSize.toFixed(1)} pt
          </p>
          {result.pdfProblems.map((p) => (
            <p key={p} className="pdf-problem">
              ✖ {p}
            </p>
          ))}
          {layout.warnings.map((w) => (
            <p key={w} className="warning">
              ⚠ {w}
            </p>
          ))}
        </>
      )}
      </aside>
      <section className="preview">
        {result ? (
          <>
          <label className="check">
            Anteprima
            <select value={preview} onChange={(e) => setPreview(e.target.value as typeof preview)}>
              {result.bookUrl && <option value="bookUrl">libro completo</option>}
              {result.introUrl && <option value="introUrl">introduzione</option>}
              <option value="contentUrl">contenuto</option>
            </select>
          </label>
          <iframe className="viewer" src={result[preview] ?? result.contentUrl} title="Anteprima PDF" />
          </>
        ) : (
          <p className="placeholder">L&apos;anteprima del PDF compare qui dopo «Genera».</p>
        )}
      </section>
    </main>
  )
}

export default App
