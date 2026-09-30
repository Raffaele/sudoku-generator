import './workerShim.ts'
import { pdf } from '@react-pdf/renderer'
import { BookDocument } from './components/BookDocument.tsx'
import type { BookConfig } from './config.ts'
import './fonts.ts'
import type { BookLayout } from './layout.ts'
import type { Sudoku } from './lib/sudoku-generator.ts'

export interface RenderRequest {
  book: Sudoku[]
  config: BookConfig
  layout: BookLayout
}

export type RenderResponse = { blob: Blob } | { error: string }

// Il rendering di centinaia di pagine è lento: fuori dal thread principale l'interfaccia non si blocca.
self.onmessage = async (event: MessageEvent<RenderRequest>) => {
  try {
    const blob = await pdf(<BookDocument {...event.data} />).toBlob()
    self.postMessage({ blob } satisfies RenderResponse)
  } catch (e) {
    self.postMessage({ error: e instanceof Error ? e.message : String(e) } satisfies RenderResponse)
  }
}
