import { PDFDocument } from 'pdf-lib'

/** Unisce i PDF nell'ordine dato (introduzione, contenuto) nel libro completo. */
export async function mergePdf(parts: Blob[]): Promise<Blob> {
  const merged = await PDFDocument.create()
  for (const part of parts) {
    const source = await PDFDocument.load(await part.arrayBuffer())
    const pages = await merged.copyPages(source, source.getPageIndices())
    pages.forEach((page) => merged.addPage(page))
  }
  // Senza object stream gli oggetti restano leggibili da `verifyPdf`.
  const bytes = await merged.save({ useObjectStreams: false })
  return new Blob([bytes as BlobPart], { type: 'application/pdf' })
}
