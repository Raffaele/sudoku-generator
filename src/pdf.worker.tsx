import './workerShim.ts'
import { pdf } from '@react-pdf/renderer'
import { BookDocument } from './components/BookDocument.tsx'
import { IntroDocument } from './components/IntroDocument.tsx'
import type { BookConfig } from './config.ts'
import './fonts.ts'
import { INTRO_SIZING_STEPS } from './introSizing.ts'
import type { BookLayout } from './layout.ts'
import type { Sudoku } from './lib/sudoku-generator.ts'
import { countPages } from './verifyPdf.ts'

export type RenderRequest =
  | { kind: 'content'; book: Sudoku[]; config: BookConfig; layout: BookLayout }
  | { kind: 'intro'; config: BookConfig; layout: BookLayout }

export type RenderResponse = { blob: Blob } | { error: string }

/** Prova le dimensioni della Figura 2 e del testo finché l'introduzione sta in 4 pagine (vedi agent.md). */
async function renderIntro(config: BookConfig, layout: BookLayout, expectedPages: number): Promise<Blob> {
  for (const sizing of INTRO_SIZING_STEPS) {
    const blob = await pdf(<IntroDocument config={config} layout={layout} sizing={sizing} />).toBlob()
    if (countPages(new Uint8Array(await blob.arrayBuffer())) === expectedPages) return blob
  }
  throw new Error(
    `Il testo dell'introduzione non entra in ${expectedPages} pagine nemmeno con la Figura 2 a 150 pt e il testo a 14 pt`,
  )
}

// Il rendering di centinaia di pagine è lento: fuori dal thread principale l'interfaccia non si blocca.
self.onmessage = async (event: MessageEvent<RenderRequest>) => {
  try {
    const request = event.data
    const blob =
      request.kind === 'intro'
        ? await renderIntro(request.config, request.layout, request.layout.frontMatterPages)
        : await pdf(<BookDocument {...request} />).toBlob()
    self.postMessage({ blob } satisfies RenderResponse)
  } catch (e) {
    self.postMessage({ error: e instanceof Error ? e.message : String(e) } satisfies RenderResponse)
  }
}
