import { useState } from 'react'
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer'
import { BookDocument } from './components/BookDocument.tsx'
import { DEFAULT_CONFIG, validateConfig, type BookConfig } from './config.ts'
import './fonts.ts'
import { computeBookLayout, type BookLayout } from './layout.ts'
import type { Sudoku } from './lib/sudoku-generator.ts'
import { generatePuzzles, verifyBook } from './puzzles.ts'
import './App.css'

interface Result {
  book: Sudoku[]
  config: BookConfig
  layout: BookLayout
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
    setTimeout(() => {
      try {
        const errors = validateConfig(config)
        if (errors.length > 0) throw new Error(errors.join('\n'))
        const layout = computeBookLayout(config)
        const book = generatePuzzles(config)
        verifyBook(book, config)
        setResult({ book, config, layout })
      } catch (e) {
        setResult(null)
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setBusy(false)
      }
    }, 0)
  }

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
          <PDFDownloadLink
            document={<BookDocument {...result} />}
            fileName={`interior-seed${result.config.seed}.pdf`}
          >
            Scarica PDF
          </PDFDownloadLink>
        )}
      </div>
      {error && <pre className="error">{error}</pre>}
      {result && layout && (
        <>
          <p className="summary">
            {layout.bookPages} pagine totali ({layout.pdfPages} in questo PDF) · margine interno{' '}
            {(layout.innerMargin / 72).toFixed(3)}&quot; · puzzle {layout.puzzleGrid.cols}×
            {layout.puzzleGrid.rows}, cifre {layout.puzzleGrid.digitSize.toFixed(1)} pt · soluzioni{' '}
            {layout.solutionGrid.cols}×{layout.solutionGrid.rows}, cifre{' '}
            {layout.solutionGrid.digitSize.toFixed(1)} pt
          </p>
          {layout.warnings.map((w) => (
            <p key={w} className="warning">
              ⚠ {w}
            </p>
          ))}
          <PDFViewer className="viewer">
            <BookDocument {...result} />
          </PDFViewer>
        </>
      )}
    </main>
  )
}

export default App
