import { useState } from 'react'
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer'
import { SudokuBookPdf } from './components/SudokuBookPdf'
import { generateBook, type Sudoku } from './lib/sudoku-generator'
import './App.css'

function App() {
  const [count, setCount] = useState(6)
  const [clues, setClues] = useState(38)
  const [book, setBook] = useState<Sudoku[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generate = () => {
    try {
      setBook(generateBook(count, clues, { singlesOnly: true }))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <main className="app">
      <h1>Generatore di sudoku</h1>
      <div className="controls">
        <label>
          Puzzle
          <input
            type="number"
            min={1}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </label>
        <label>
          Celle occupate
          <input
            type="number"
            min={17}
            max={81}
            value={clues}
            onChange={(e) => setClues(Number(e.target.value))}
          />
        </label>
        <button type="button" onClick={generate}>
          Genera
        </button>
        {book && (
          <PDFDownloadLink document={<SudokuBookPdf book={book} />} fileName="sudoku.pdf">
            Scarica PDF
          </PDFDownloadLink>
        )}
      </div>
      {error && <p className="error">{error}</p>}
      {book && (
        <PDFViewer className="viewer">
          <SudokuBookPdf book={book} />
        </PDFViewer>
      )}
    </main>
  )
}

export default App
