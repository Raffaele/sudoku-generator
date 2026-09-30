import type { RenderRequest, RenderResponse } from './pdf.worker.tsx'

/** Renderizza il PDF in un Web Worker e restituisce il Blob. */
export function renderPdf(request: RenderRequest): Promise<Blob> {
  const worker = new Worker(new URL('./pdf.worker.tsx', import.meta.url), { type: 'module' })
  return new Promise((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<RenderResponse>) => {
      worker.terminate()
      if ('error' in event.data) reject(new Error(event.data.error))
      else resolve(event.data.blob)
    }
    worker.onerror = (event) => {
      worker.terminate()
      reject(new Error(event.message || 'Errore nel worker del PDF'))
    }
    worker.postMessage(request)
  })
}
