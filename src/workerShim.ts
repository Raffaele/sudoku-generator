// Alcune dipendenze di @react-pdf/renderer leggono `window`, che in un Web Worker non esiste.
;(globalThis as { window?: unknown }).window ??= globalThis
