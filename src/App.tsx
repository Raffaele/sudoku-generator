import { useEffect, useState } from 'react'
import { DEFAULT_CONFIG, validateConfig, type BookConfig } from './config.ts'
import { computeBookLayout, type BookLayout } from './layout.ts'
import type { Sudoku } from './lib/sudoku-generator.ts'
import { generatePuzzles, verifyBook } from './puzzles.ts'
import { renderPdf } from './renderPdf.ts'
import './App.css'

interface Result {
  book: Sudoku[]
  config: BookConfig
  layout: BookLayout
  /** URL del PDF già renderizzato (blob). */
  url: string
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
  { key: 'startPageNumber', label: 'Numero prima pagina' },
  { key: 'totalPuzzles', label: 'Numero di puzzle' },
  { key: 'cluesStart', label: 'Celle occupate (primo)' },
  { key: 'cluesEnd', label: 'Celle occupate (ultimo)' },
  { key: 'seed', label: 'Seed' },
]

const BOOLEAN_FIELDS: { key: BooleanKey; label: string }[] = [
  { key: 'singlesOnly', label: 'Solo tecniche base' },
  { key: 'showDateTime', label: 'Riga Date/Time' },
  { key: 'solutionsDivider', label: 'Pagina "Solutions"' },
]

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
        const blob = await renderPdf({ book, config, layout })
        setResult({ book, config, layout, url: URL.createObjectURL(blob) })
      } catch (e) {
        setResult(null)
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setBusy(false)
      }
    }, 0)
  }

  // Libera il blob precedente quando viene sostituito o al termine.
  const url = result?.url
  useEffect(() => () => (url ? URL.revokeObjectURL(url) : undefined), [url])

  const { layout } = result ?? {}

  return (
    <main className="app">
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
        <button type="button" onClick={generate} disabled={busy}>
          {busy ? 'Generazione…' : 'Genera'}
        </button>
        {result && (
          <a href={result.url} download={`interior-seed${result.config.seed}.pdf`}>
            Scarica PDF
          </a>
        )}
      </div>
      {error && <pre className="error">{error}</pre>}
      {result && layout && (
        <>
          <p className="summary">
            {layout.bookPages} pagine totali ({layout.pdfPages} in questo PDF) · margine interno{' '}
            {(layout.innerMargin / 72).toFixed(3)}&quot; · puzzle {layout.puzzleGrid.cols}×
            {layout.puzzleGrid.rows} (titolo {layout.puzzleGrid.arrangement === 'side' ? 'a lato' : 'sopra'}), cifre {layout.puzzleGrid.digitSize.toFixed(1)} pt · soluzioni{' '}
            {layout.solutionGrid.cols}×{layout.solutionGrid.rows}, cifre{' '}
            {layout.solutionGrid.digitSize.toFixed(1)} pt
          </p>
          {layout.warnings.map((w) => (
            <p key={w} className="warning">
              ⚠ {w}
            </p>
          ))}
          <iframe className="viewer" src={result.url} title="Anteprima PDF" />
        </>
      )}
    </main>
  )
}

export default App
