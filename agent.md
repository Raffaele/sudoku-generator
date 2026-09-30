# Agent.md — Generatore PDF interno libro Sudoku KDP

## Obiettivo

Generare il PDF **interno** (senza copertina) di un libro di sudoku per **Amazon KDP**, pronto per il caricamento come paperback.
Il progetto deve essere parametrizzabile e riproducibile: stessa configurazione e stesso seed producono lo stesso PDF.

La copertina e l'introduzione (pagina del titolo, copyright, regole) **non** fanno parte di questo progetto. L'introduzione viene creata in un PDF separato e unita dopo (vedi il parametro `startPageNumber`).

## Contesto di prodotto (decisioni già prese, non cambiarle senza chiedere)

- **Mercato:** Amazon US. **Target:** senior e principianti. **Nicchia:** "Extra Large Print Easy Sudoku".
- **Lingua del testo stampato:** inglese (`Puzzle 12`, `Solution 12`, `Solutions`, `Date`, `Time`).
- **Formato:** 8,5" × 11" (612 × 792 pt), **senza bleed**, carta bianca, paperback.
- **Quantità:** 306 puzzle, così "300+" è onesto e l'ultima pagina di soluzioni è piena (306 / 9 = 34).
- **Default di impaginazione:** 2 puzzle per pagina, 9 soluzioni per pagina.
- **Difficoltà:** solo easy, con **progressione graduale** da molto facile a easy-plus. Tutti i puzzle devono essere risolvibili con le sole tecniche base (naked e hidden singles).
- **Pagine stimate:** circa 153 di puzzle + 34 di soluzioni + circa 5 di introduzione (PDF separato) = circa 192.
- **Motivazione:** il libro precedente (1020 puzzle, 12 per pagina A4, celle da 6 mm) non ha venduto. Leggibilità e qualità contano più della quantità.

## Stack

- **App Vite + React + TypeScript** (`strict`), gestore di pacchetti **yarn**. Il PDF si genera nel browser: `yarn dev` per avviare, `yarn build` per compilare.
- `@react-pdf/renderer` (React). Le griglie vanno disegnate con `<Svg>` (`Line`, `Rect`, `Text`), **non** con `<View>` e bordi: il risultato è più nitido in stampa e il rendering è più veloce.
- L'interfaccia (`src/App.tsx`) permette di modificare i parametri di `BookConfig`, mostra l'anteprima (`PDFViewer`) e scarica il PDF (`PDFDownloadLink`).
- Nei file `.ts`/`.tsx` gli import locali hanno l'estensione (`./config.ts`), come nel template Vite.
- Il generatore di sudoku **esiste già**: `src/lib/sudoku-generator.ts` (fornito dall'utente, già ripulito dal codice non necessario). Non riscriverlo. API esportata:
  - tipi `Cell`, `FilledCell`, `EmptyCell`, `Grid = Cell[]` (81 celle riga per riga, `0` = vuota), `Sudoku`, `GenerateOptions`
  - `generateSudoku(clues, { seed, singlesOnly, maxAttempts })` → `{ puzzle, solution, clues }`
  - `countSolutions(grid, limit)`, `solvableWithSingles(grid)`
  - `assertGrid` è interna al modulo
  - `generateBook` genera tutti i puzzle con lo stesso numero di celle occupate. Per la progressione di difficoltà, chiama invece `generateSudoku` per ogni puzzle con il suo numero di celle occupate e un seed derivato (vedi sotto), scartando i duplicati.

## Parametri (`src/config.ts`)

Esporta l'interfaccia `BookConfig`, `DEFAULT_CONFIG` con i default qui sotto e `validateConfig`. Tutti i parametri sono modificabili dall'interfaccia prima di generare il PDF.

| Parametro                  | Default                                               | Descrizione                                                                                      |
| -------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `puzzlesPerPage`           | `2`                                                   | Puzzle per pagina (1, 2, 4, 6…)                                                                  |
| `solutionsPerPage`         | `9`                                                   | Soluzioni per pagina (4, 6, 9, 12…)                                                              |
| `startPageNumber`          | `1`                                                   | Numero stampato sulla prima pagina di questo PDF. Serve se l'introduzione sta in un PDF separato |
| `totalPuzzles`             | `306`                                                 | Numero di puzzle                                                                                 |
| `cluesStart` / `cluesEnd`  | `45` / `36`                                           | Celle occupate nel primo e nell'ultimo puzzle, con interpolazione lineare arrotondata            |
| `singlesOnly`              | `true`                                                | Solo tecniche base                                                                               |
| `seed`                     | `2026`                                                | Seed principale. Seed del puzzle _i_ = derivato in modo deterministico da `seed` e `i`           |
| `showDateTime`             | `true`                                                | Riga "Date: **\_\_** Time: **\_\_**" sotto ogni puzzle                                           |
| `solutionsDivider`         | `true`                                                | Pagina "Solutions" prima delle soluzioni                                                         |

## Font (requisito KDP: font incorporati)

- **Usa Roboto** (Regular e Bold). Metti i file TTF in `public/fonts/` (`Roboto-Regular.ttf`, `Roboto-Bold.ttf`) e aggiungi il file di licenza nella stessa cartella. Controlla la licenza al momento del download: deve permettere l'uso commerciale e l'incorporamento.
- I font sono registrati in `src/fonts.ts` come due famiglie, `Roboto` (Regular) e `Roboto-Bold` (Bold), così vale anche dentro `<Svg>`. Usa sempre le costanti `FONT_REGULAR` e `FONT_BOLD`.
- **Vietato** usare i font integrati di react-pdf (Helvetica, Times, Courier): sono font PDF standard che **non vengono incorporati** e KDP li segnala. Il libro precedente aveva proprio questo problema.
- Disattiva la sillabazione: `Font.registerHyphenationCallback(w => [w])`.
- Uso: cifre date dei puzzle in **Bold**; titoli in Bold; testo e numeri di pagina in Regular. Nelle soluzioni, cifre date in **Bold** e cifre risolte in **Regular**, così si distinguono.

## Margini KDP (senza bleed)

Tutto in punti (1" = 72 pt).

**Margine interno (verso la rilegatura):** dipende dal numero **totale** di pagine del libro finale, introduzione compresa. Calcolalo come `startPageNumber - 1 + pagine generate`.

| Pagine totali | Margine interno minimo |
| ------------- | ---------------------- |
| 24–150        | 0,375"                 |
| 151–300       | 0,5"                   |
| 301–500       | 0,625"                 |
| 501–700       | 0,75"                  |
| 701–828       | 0,875"                 |

Poiché il numero di pagine dipende dal layout, calcola prima il numero di pagine e poi il margine. Se il totale supera 828, interrompi con un errore.

**Margini usati dal progetto:**

- interno: il minimo KDP della tabella + 0,125" di sicurezza
- esterno: 0,5" (il minimo KDP è 0,25")
- superiore: 0,5"
- inferiore: 0,75" (contiene il numero di pagina)

**Margini specchiati:** la parità si basa sul **numero di pagina reale** (`startPageNumber + indice`), non sull'indice nel PDF.

- Pagina **dispari** (a destra): margine interno a **sinistra**.
- Pagina **pari** (a sinistra): margine interno a **destra**.

Se `startPageNumber` è pari, stampa un avviso: di norma un contenuto inizia su una pagina dispari. L'introduzione deve avere lo stesso formato 8,5×11 senza bleed.

## Numeri di pagina

- Presenti su **ogni** pagina generata, compresa la pagina "Solutions", a partire da `startPageNumber`.
- Centrati orizzontalmente nell'area del contenuto (tenendo conto dei margini specchiati), in Roboto Regular 11 pt.
- Posizione: la base del testo a circa 0,4" dal bordo inferiore. Nessun elemento deve trovarsi a meno di 0,25" da **qualsiasi** bordo della pagina: il libro precedente aveva i numeri a 0,15" dal bordo.

## Layout delle griglie (calcolo generico)

Per un numero N di griglie per pagina, scegli la disposizione `cols × rows` (con `cols × rows ≥ N`) che **massimizza la dimensione della griglia** nell'area disponibile, tenendo conto di:

- titolo sopra ogni griglia (`Puzzle 12`, Bold)
- riga data e tempo sotto ogni puzzle (se `showDateTime`)
- spazi fra le griglie (almeno 0,3")

Le griglie devono essere quadrate e centrate nella loro cella di layout.

**Leggibilità (verifiche obbligatorie):**

- Cifre dei puzzle: 55% del lato della cella. Soglia minima **22 pt**: sotto questa soglia l'interfaccia mostra un avviso (si perde il posizionamento "large print"). Nota: con i margini KDP e 2 puzzle per pagina la griglia misura circa 282 pt (cifre circa 17 pt), quindi l'avviso compare con i default; per cifre da 22 pt serve 1 puzzle per pagina.
- Cifre delle soluzioni: 65% del lato della cella (le celle sono piccole). Minimo **11 pt**: sotto questa soglia il calcolo del layout lancia un errore.

**Linee della griglia:**

- bordo esterno: 2,5 pt
- bordi dei blocchi 3×3: 2 pt
- linee delle celle: 0,75 pt, grigio scuro (es. `#555`)
- tutto su sfondo bianco, testo nero puro (alto contrasto)

## Struttura del PDF

1. Pagine dei puzzle, in ordine numerico (`Puzzle 1` … `Puzzle 306`)
2. Pagina divisoria "Solutions" (se `solutionsDivider`)
3. Pagine delle soluzioni, in ordine numerico (`Solution 1` …)

Non aggiungere pagine vuote.

## Struttura del progetto

```
public/fonts/          Roboto-Regular.ttf, Roboto-Bold.ttf, licenza
src/
  lib/sudoku-generator.ts  esistente, non modificare
  config.ts            BookConfig, DEFAULT_CONFIG, validateConfig
  puzzles.ts           generazione con progressione e dedup, verifyBook (controlli sul contenuto)
  layout.ts            margini KDP, parità, calcolo cols×rows, dimensioni font, avvisi
  fonts.ts             registrazione dei font Roboto
  components/
    SudokuGrid.tsx     griglia Svg (puzzle o soluzione)
    GridPage.tsx       pagina con margini specchiati e blocco di griglie
    PuzzlePage.tsx
    SolutionPage.tsx
    DividerPage.tsx
    PageNumber.tsx
    BookDocument.tsx   Document con tutte le pagine
  App.tsx              interfaccia: parametri, anteprima, download
```

Comandi:

- `yarn dev`: avvia l'app
- `yarn build`: controllo dei tipi e build di produzione
- `yarn lint`

Alla pressione di "Genera" l'app valida i parametri, calcola il layout (numero di pagine, margine interno, dimensioni), genera i puzzle, esegue `verifyBook` e mostra un riepilogo con gli eventuali avvisi.

## Verifiche

**Contenuto**, prima del rendering (`verifyBook`, già implementate):

- ogni puzzle ha **soluzione unica** (`countSolutions(p, 2) === 1`)
- ogni puzzle è risolvibile con le sole tecniche base (se `singlesOnly`)
- ogni cifra data coincide con la soluzione
- nessun puzzle duplicato
- il numero di celle occupate segue la progressione configurata

**PDF**, dopo il rendering (non ancora automatizzate, da fare a mano sul file scaricato):

- dimensione di tutte le pagine = 612 × 792 pt
- **tutti i font incorporati** (`pdffonts`: colonna `emb` = `yes` per ogni font)
- nessun contenuto entro 0,25" dai bordi, e margine interno ≥ minimo KDP sul lato corretto per ogni pagina
- numero di pagina presente e corretto su ogni pagina

## Cose da NON fare

- Non usare i font standard del PDF (Helvetica, Times, Courier).
- Non generare puzzle senza verificarne l'unicità.
- Non stampare testo in italiano: il libro è per il mercato US.
- Non aggiungere elementi decorativi, citazioni o immagini senza richiesta.
- Non modificare `src/lib/sudoku-generator.ts` senza chiedere. Se serve qualcosa in più, crea un modulo separato che lo usa.
