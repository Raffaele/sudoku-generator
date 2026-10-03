# Agent.md — Generatore PDF interno libro Sudoku KDP

## Obiettivo

Generare il PDF **interno** (senza copertina) di un libro di sudoku per **Amazon KDP**, pronto per il caricamento come paperback: le **pagine introduttive** (numerate in numeri romani) e il **contenuto** (puzzle e soluzioni, in numeri arabi).
Il progetto deve essere parametrizzabile e riproducibile: stessa configurazione e stesso seed producono lo stesso PDF.

La copertina **non** fa parte di questo progetto.

L'app produce tre file: l'introduzione, il contenuto e il **libro completo** (i due uniti), che è il file da caricare su KDP. L'introduzione si può non generare (`includeIntro`), ma il contenuto resta impaginato come se fosse presente.

## Contesto di prodotto (decisioni già prese, non cambiarle senza chiedere)

- **Mercato:** Amazon US. **Target:** senior e principianti. **Nicchia:** "Large Print Easy Sudoku".
- **Lingua del testo stampato:** inglese (`Sudoku 12`, `Solution 12`, `Solutions`, `Date`, `Time to solve`). Le etichette arrivano dal dizionario del `locale` (vedi Parametri).
- **Formato:** 8,5" × 11" (612 × 792 pt), **senza bleed**, carta bianca, paperback. Il formato è un parametro (`trimSize`), ma per questo libro resta 8,5×11.
- **Quantità:** 306 puzzle, così "300+" è onesto e l'ultima pagina di soluzioni è piena (306 / 6 = 51).
- **Default di impaginazione:** 2 puzzle per pagina, **6 soluzioni per pagina** (scelta per la leggibilità: con 9 per pagina le celle scendono a circa 6,4 mm).
- **Difficoltà:** solo easy, con **progressione graduale** da molto facile a easy-plus. Tutti i puzzle devono essere risolvibili con le sole tecniche base (naked e hidden singles).
- **Cifre dei puzzle:** circa 22,4 pt con i default, **da non aumentare per dichiararle**: i concorrenti principali arrivano a 30-32 pt, quindi il libro non si posiziona sulla dimensione delle cifre ma sulla quantità (2 per pagina) e sulla difficoltà verificata.
- **Pagine:** 4 di introduzione + 153 di puzzle + 1 divisoria + 51 di soluzioni = **209** pagine fisiche.
- **Motivazione:** il libro precedente (1020 puzzle, 12 per pagina A4, celle da 6 mm) non ha venduto. Leggibilità e qualità contano più della quantità.

## Stack

- **App Vite + React + TypeScript** (`strict`), gestore di pacchetti **yarn**. Il PDF si genera nel browser: `yarn dev` per avviare, `yarn build` per compilare.
- `pdf-lib` per unire introduzione e contenuto nel libro completo.
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

| Parametro                 | Default             | Descrizione                                                                                                                           |
| ------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `puzzlesPerPage`          | `2`                 | Puzzle per pagina (1, 2, 4, 6…)                                                                                                       |
| `solutionsPerPage`        | `6`                 | Soluzioni per pagina (4, 6, 9, 12…)                                                                                                   |
| `trimSize`                | `"letter"`          | Formato: preset (`"letter"` 8,5×11", `"a4"` 8,27×11,69", `"8x10"`) oppure `{ widthIn, heightIn }` personalizzato                      |
| `locale`                  | `"en"`              | Dizionario delle etichette stampate (vedi sotto)                                                                                      |
| `totalPuzzles`            | `306`               | Numero di puzzle                                                                                                                      |
| `cluesStart` / `cluesEnd` | `45` / `36`         | Celle occupate nel primo e nell'ultimo puzzle, con interpolazione lineare arrotondata                                                 |
| `singlesOnly`             | `true`              | Solo tecniche base                                                                                                                    |
| `seed`                    | `2026`              | Seed principale. Seed del puzzle _i_ = derivato in modo deterministico da `seed` e `i`                                                |
| `showDateTime`            | `true`              | Righe "Date" e "Time to solve" per ogni puzzle                                                                                        |
| `solutionsDivider`        | `true`              | Pagina "Solutions" prima delle soluzioni                                                                                              |
| `includeIntro`            | `true`              | Genera le pagine introduttive (vedi "Introduzione"). Non cambia l'impaginazione del contenuto                  |
| `intro`                   | vedi "Introduzione" | Testi variabili dell'introduzione: titolo, autore, anno, ISBN                                                      |

**Costanti (non sono parametri):** `START_PAGE_NUMBER` = 1 (numero stampato sulla prima pagina del contenuto) e `FRONT_MATTER_PAGES` = 4 (pagine fisiche dell'introduzione, in `src/config.ts`).

- La pagina fisica di ogni pagina generata è `FRONT_MATTER_PAGES + indice + 1` (indice da 0 nel PDF). È questa, non il numero stampato, a decidere la parità dei margini.
- L'introduzione ha un numero pari di pagine, così la prima pagina del contenuto cade a destra.

**`trimSize`:**

- Tutte le dimensioni di pagina e i layout derivano dal formato scelto: niente valori fissi 612 × 792 nel codice di layout e nelle verifiche (`PAGE_WIDTH` / `PAGE_HEIGHT` calcolati dal formato).
- I margini KDP non cambiano con il formato (stessa tabella in pollici).
- Il numero massimo di pagine può dipendere dal formato e dalla carta: leggilo da una tabella in `src/kdpLimits.ts` compilata con i dati KDP ufficiali (carta bianca, inchiostro nero: `letter` 590, `a4` 780, `8x10` 828), **non** da valori scritti a memoria. Per un formato non in tabella (personalizzato) usa 828 come limite e mostra un avviso.

**`locale`:**

- Un file per lingua in `src/locales/` (`en.ts`, poi `it.ts`, ecc.), con le chiavi: `puzzleTitle` (es. `"Sudoku"`), `solutionTitle` (`"Solution"`), `solutionsDivider` (`"Solutions"`), `date` (`"Date"`), `timeToSolve` (`"Time to solve"`).
- Nessuna etichetta stampata scritta direttamente nei componenti: aggiungere una lingua significa aggiungere un file, senza toccare il layout.
- Per il libro attuale si usa solo `en`.

## Introduzione (pagine i-iv)

### Regola fondamentale sui testi

**I testi dell'introduzione sono scritti dall'utente e vanno riprodotti alla lettera.** Non riformularli, non correggerli, non aggiungere frasi, non inventare testi mancanti: il motivo è la dichiarazione sull'uso dell'AI richiesta da KDP, che dipende da chi ha scritto il testo. Qualsiasi modifica va chiesta all'utente. Se un testo manca, lascia il campo vuoto e mostra un avviso nell'interfaccia.

I testi fissi stanno in `src/content/intro.en.ts` (un file per lingua, come i `locale`), copiati esattamente da questo documento. I testi variabili arrivano da `BookConfig.intro`.

### Parametri `intro`

| Campo             | Default                                                                                               | Note                                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `badge`           | `"LARGE PRINT"`                                                                                       | riga sopra il titolo                                                                                          |
| `title`           | `"EASY SUDOKU"`                                                                                       |                                                                                                               |
| `subtitle`        | `"300+ Easy Puzzles for Adults & Seniors"`                                                            | **segnaposto**, da confermare dall'utente                                                                     |
| `features`        | `"2 Puzzles per Page · Gradually Increasing Difficulty · Every Puzzle Verified · Solutions Included"` | **segnaposto**, da confermare dall'utente                                                                     |
| `volume`          | `"Volume 1"`                                                                                          |                                                                                                               |
| `author`          | `""`                                                                                                  | nome dell'autore o del marchio; vuoto → avviso                                                                |
| `year`            | `2026`                                                                                                |                                                                                                               |
| `isbn`            | `""`                                                                                                  | ISBN gratuito KDP; vuoto → avviso "ISBN mancante: da assegnare su KDP prima del file definitivo"              |

Titolo e sottotitolo devono coincidere con quelli della copertina e della scheda KDP.

### Struttura

Sempre **4 pagine** (numero pari: la prima pagina del contenuto cade così su una pagina destra). Stesso formato (`trimSize`), stessi margini specchiati e stessi font del contenuto. Pagine fisiche 1-4: la i è a destra, la ii a sinistra, e così via.

**Pagina i — Titolo** (nessun numero di pagina), centrata:

- `badge`: Roboto Bold circa 20 pt, su una fascia o in un riquadro
- `title`: Roboto Bold, il più grande possibile su una riga (circa 48-60 pt)
- `subtitle`: Roboto Bold circa 20 pt
- `features`: Roboto Regular circa 14 pt, **una voce per riga** (il testo è diviso in corrispondenza del separatore `·`)
- `volume`: Roboto Regular circa 14 pt
- `author`: Roboto Regular circa 16 pt
- in fondo alla pagina: `This book belongs to: ______________________` (Roboto Regular circa 14 pt, riga su cui scrivere come quelle di Date/Time)

**Pagina ii — Copyright** (nessun numero di pagina), testo in basso, Roboto Regular 10-11 pt, allineato a sinistra:

```
{title in Title Case} – {badge in Title Case}, {volume}
Copyright © {year} {author}. All rights reserved.

Do not copy, photocopy, or reproduce this book or any part of this book, in commercial or non-commercial settings, except as permitted below. It is also forbidden to copy, adapt, or reuse this book or any part of this book for use on websites or blogs.

The only photocopying allowed is for personal, non-commercial use.

Every sudoku has exactly one solution and can be solved with basic techniques (computer-verified).

ISBN: {isbn}
Independently published
```

Con i default la prima riga è `Easy Sudoku – Large Print, Volume 1`.

**Pagina iii — How to Play** (numero `iii`). Titolo in Roboto Bold circa 24 pt, testo in Roboto Regular 15 pt:

```
How to Play

Add a number in every empty cell to obtain all the numbers from 1 to 9, without repeating, in every row, column and 3×3 box.

[Figura 1]

NO MATH NEEDED
EXACTLY 1 CORRECT SOLUTION
NO GUESSING NEEDED
```

Le tre righe in maiuscolo sono in Roboto Bold 16 pt, una per riga, con spazio fra l'una e l'altra.

Impaginazione: titolo e testo in alto; la Figura 1 centrata nello spazio che resta; le tre righe in maiuscolo ancorate in basso, sopra il numero di pagina.

**Pagina iv — Tips e What You'll Find in This Book** (numero `iv`). Titoli in Roboto Bold circa 22 pt, testo in Roboto Regular 15 pt; le parti tra `**` sono in Bold:

```
Tips

**The only empty cell.** If there is only 1 empty cell in a row, column or 3×3 box, the only missing number goes there.

**The only possible place.** Choose a box, and one of the missing numbers in that box (for example, 3). Check if some columns or rows are blocking all the cells except 1: that's your "3".

[Figura 2]

**Easy corrections with a pencil.**

What You'll Find in This Book

Difficulty grows gradually, from "very easy" to "easy".

You can see your progress by writing down the date and the solving time next to each sudoku.

The solutions are at the end of the book, with gray used for given numbers and handwriting style for the numbers you find.

Enjoy!
```

Se il testo della pagina iv non entra, riduci la Figura 2 fino a un minimo di 150 pt di lato; se ancora non entra, riduci il corpo del testo fino a 14 pt. Sotto i 14 pt, errore: non spezzare la pagina iv in due.

### Figure

Disegnate con `SudokuGrid` (stesse linee e stessi font dei puzzle), in bianco, nero e grigi, senza colori: la stampa interna è in bianco e nero.

- **Figura 1 (pagina iii):** **tre griglie risolte, due sulla prima riga e la terza a capo, centrata** (generate per questo libro, non copiate da altre fonti), ciascuna con **una sola zona** evidenziata: una riga, una colonna, un box 3×3. Ogni zona è in grigio chiaro (`#E6E6E6`) con un contorno nero spesso (3 pt) che ne mostra l'estensione, e ha sotto la sua etichetta in Roboto Bold 16 pt: `row`, `column`, `3×3 box`. Le griglie sono il più grandi possibile compatibilmente con l'altezza della pagina (circa 200 pt di lato). Le cifre date (traccia) sono in Roboto Bold, le altre sono scritte a mano (Patrick Hand, 85% della cella) come nelle soluzioni. Così ciascuna zona mostra i numeri da 1 a 9 senza ripetizioni, cioè la regola descritta nel testo.
- **Figura 2 (pagina iv):** esempio della tecnica "The only possible place" con il numero **3**. Griglia completa (circa 200-240 pt), con:
  - il box di destinazione con il bordo più spesso;
  - i 3 già presenti nelle righe e colonne che attraversano il box, evidenziati (cerchio o fondo grigio);
  - da ciascuno di questi 3 una linea grigia scura (`#555`, eventualmente tratteggiata) che attraversa il box lungo la sua riga o colonna, mostrando le celle bloccate;
  - l'unica cella rimasta libera nel box con fondo grigio chiaro e il **3 in Patrick Hand** all'85% della cella, come le cifre risolte nelle soluzioni.
    La figura deve far capire da sola che una riga o una colonna blocca una cella perché contiene già un 3.

I dati delle due figure sono scritti a mano in `src/content/figures.ts`. Prima del rendering, `verifyFigures` controlla che nella Figura 2 la cella indicata sia **l'unica** del box dove il 3 può andare (considerando righe, colonne e cifre già presenti nel box), e che le cifre date non violino le regole. Controlla anche che la griglia della Figura 1 sia una soluzione completa e valida e che le cifre date coincidano con essa. Se un controllo fallisce, errore.

### Numerazione e unione

- Pagine i e ii senza numero; iii e iv con numeri romani minuscoli, stessa posizione e stesso stile dei numeri del contenuto.
- `FRONT_MATTER_PAGES` vale 4 e il contenuto parte dal numero 1.
- Il **libro completo** si ottiene unendo i due PDF con `pdf-lib`, nel browser. Il margine interno di introduzione e contenuto si calcola sul totale delle pagine fisiche del libro completo.

## Font (requisito KDP: font incorporati)

- **Usa Roboto** (Regular e Bold). Metti i file TTF in `public/fonts/` (`Roboto-Regular.ttf`, `Roboto-Bold.ttf`) e aggiungi il file di licenza nella stessa cartella. Controlla la licenza al momento del download: deve permettere l'uso commerciale e l'incorporamento.
- I font sono registrati in `src/fonts.ts` come famiglie separate, `Roboto` (Regular), `Roboto-Bold` (Bold) e `PatrickHand`, così vale anche dentro `<Svg>`. Usa sempre le costanti `FONT_REGULAR`, `FONT_BOLD` e `FONT_HANDWRITTEN`.
- **Vietato** usare i font integrati di react-pdf (Helvetica, Times, Courier): sono font PDF standard che **non vengono incorporati** e KDP li segnala. Il libro precedente aveva proprio questo problema.
- Disattiva la sillabazione: `Font.registerHyphenationCallback(w => [w])`.
- Uso: cifre date dei puzzle in **Bold**; titoli in Bold; testo e numeri di pagina in Regular. Nelle soluzioni, cifre date (traccia) in Roboto **Regular** grigio e cifre risolte in **Patrick Hand** (aspetto scritto a mano) nero e più grande, così si distinguono a colpo d'occhio.
- **Patrick Hand** (Regular, licenza OFL) sta in `public/fonts/` con `PatrickHand-OFL.txt`. Si usa solo per le cifre risolte nelle soluzioni, mai nei puzzle. Le cifre risolte sono più grandi di quelle della traccia (vedi Leggibilità). Il tratto di Patrick Hand è sottile e a schermo appare grigio, quindi in `SudokuGrid.tsx` ogni cifra risolta è disegnata due volte con uno scarto di 0,3 pt (`HANDWRITTEN_EMBOLDEN`), sempre in nero `#000`: react-pdf ignora `stroke` sul testo dentro `<Svg>`.

## Margini KDP (senza bleed)

Tutto in punti (1" = 72 pt).

**Margine interno (verso la rilegatura):** dipende dal numero **totale** di pagine fisiche del libro finale, introduzione compresa. Calcolalo come `FRONT_MATTER_PAGES + pagine generate`.

| Pagine totali | Margine interno minimo |
| ------------- | ---------------------- |
| 24–150        | 0,375"                 |
| 151–300       | 0,5"                   |
| 301–500       | 0,625"                 |
| 501–700       | 0,75"                  |
| 701–828       | 0,875"                 |

Poiché il numero di pagine dipende dal layout, calcola prima il numero di pagine e poi il margine. Se il totale supera il limite del formato (vedi `trimSize`), interrompi con un errore.

**Margini usati dal progetto:**

- interno: il minimo KDP della tabella + 0,125" di sicurezza
- esterno: 0,5" (il minimo KDP è 0,25")
- superiore: 0,5"
- inferiore: 0,75" (contiene il numero di pagina)

**Margini specchiati:** la parità si basa sulla **pagina fisica** (`FRONT_MATTER_PAGES + indice + 1`), non sul numero stampato né sull'indice nel PDF.

- Pagina fisica **dispari** (a destra): margine interno a **sinistra**.
- Pagina fisica **pari** (a sinistra): margine interno a **destra**.

L'introduzione deve avere lo stesso formato senza bleed.

## Numeri di pagina

- Presenti su **ogni** pagina generata, compresa la pagina "Solutions", a partire da `START_PAGE_NUMBER`, in numeri arabi.
- Centrati orizzontalmente nell'area del contenuto (tenendo conto dei margini specchiati), in Roboto Regular 11 pt.
- Posizione: la base del testo a circa 0,4" dal bordo inferiore. Nessun elemento deve trovarsi a meno di 0,25" da **qualsiasi** bordo della pagina: il libro precedente aveva i numeri a 0,15" dal bordo.

## Layout delle griglie (calcolo generico)

Per un numero N di griglie per pagina, scegli la disposizione `cols × rows` (con `cols × rows ≥ N`) che **massimizza la dimensione della griglia** nell'area disponibile, tenendo conto di:

- spazi fra le griglie (almeno 0,3")
- due disposizioni per i puzzle, scelte automaticamente (vince quella con la griglia più grande, a parità quella con il titolo sopra):
  - **titolo sopra** la griglia (`Sudoku 12`, Bold) e riga Date/Time sotto. Usata con 1 puzzle per pagina e con 4 o più.
  - **titolo a lato**: pannello accanto alla griglia con titolo e Date/Time (se `showDateTime`), ciascuno con la riga su cui scrivere (0,75 pt, `#555`) sotto l'etichetta e lunga 130 pt (`LINE_WIDTH` in `PuzzlePanel.tsx`); il resto del pannello resta bianco. Le etichette Date e Time to solve sono in Roboto Regular **14-16 pt**, leggibili per il pubblico senior. Usata con 2 puzzle per pagina, dove l'altezza è il vincolo e la larghezza avanza. Il pannello sta **sempre dal lato del margine interno** (pagine fisiche dispari: a sinistra; pari: a destra), così la griglia resta dal lato esterno, più comodo per scrivere. Larghezza minima del pannello 130 pt; il pannello occupa tutta la larghezza che resta.
- le soluzioni usano sempre il titolo sopra

Le griglie devono essere quadrate. Con il titolo sopra sono centrate nello slot.

**Leggibilità (verifiche obbligatorie):**

- Cifre dei puzzle: 60% del lato della cella massima possibile. Con il pannello a lato la cella viene poi rimpicciolita fino a un rapporto cifra/cella di **0,66** (`PUZZLE_SIDE_CELL_RATIO` in `layout.ts`) senza cambiare la dimensione delle cifre, e lo spazio avanzato si divide in parti uguali sopra, tra e sotto i puzzle. Soglia minima **22 pt**: sotto questa soglia l'interfaccia mostra un avviso (si perde il posizionamento "large print"). Con i default (2 per pagina, titolo a lato) le cifre sono circa 22,4 pt, la cella circa 34 pt e la griglia circa 309 pt. Con 4 puzzle per pagina le cifre scendono a circa 17 pt e l'avviso compare.
- Cifre delle soluzioni: con i default (6 per pagina) le griglie sono di circa 201 pt e le celle di circa 22,3 pt. Cifre della traccia al 72% della cella (circa 16,1 pt), cifre risolte all'85% (circa 19 pt). Minimo **11 pt** per le cifre della traccia: sotto questa soglia il calcolo del layout lancia un errore.

**Linee della griglia:**

- bordo esterno: 2,5 pt
- bordi dei blocchi 3×3: 2 pt
- linee delle celle: 0,75 pt, grigio scuro (es. `#555`)
- questi sono gli spessori pieni, validi per griglie di almeno 300 pt di lato (puzzle). Sotto i 300 pt scalano in proporzione al lato (`lineWidths` in `layout.ts`), con minimi di 1,25 / 1 / 0,5 pt. Le soluzioni (griglie di circa 201 pt con i default) hanno quindi circa 1,68 / 1,34 / 0,5 pt.
- tutto su sfondo bianco, testo nero puro (alto contrasto). Unica eccezione: nelle soluzioni le cifre della traccia (date) sono grigio scuro `#555`, così si distinguono sensibilmente dalle cifre risolte, che restano nere

## Struttura del PDF

0. Nel libro completo: le 4 pagine introduttive (vedi "Introduzione"), poi il contenuto
1. Pagine dei puzzle, in ordine numerico (`Sudoku 1` … `Sudoku 306`)
2. Pagina divisoria "Solutions" (se `solutionsDivider`)
3. Pagine delle soluzioni, in ordine numerico (`Solution 1` …)

Non aggiungere pagine vuote.

## Struttura del progetto

```
public/fonts/          Roboto-Regular.ttf, Roboto-Bold.ttf, PatrickHand-Regular.ttf, licenze
src/
  lib/sudoku-generator.ts  esistente, non modificare
  config.ts            BookConfig, DEFAULT_CONFIG, validateConfig
  kdpLimits.ts         formati (trim size) e limiti di pagine KDP per formato (dati ufficiali)
  locales/
    en.ts              etichette stampate in inglese
  content/
    intro.en.ts        testi fissi dell'introduzione, copiati alla lettera (vedi "Introduzione")
    figures.ts         dati delle Figure 1 e 2, verifyFigures
  puzzles.ts           generazione con progressione e dedup, verifyBook (controlli sul contenuto)
  verifyPdf.ts         controlli sul PDF prodotto (pagine, dimensioni, font)
  renderPdf.ts         render del PDF in un Web Worker (pdf.worker.tsx)
  layout.ts            margini KDP, parità, calcolo cols×rows, dimensioni font, avvisi
  fonts.ts             registrazione dei font Roboto
  components/
    SudokuGrid.tsx     griglia Svg (puzzle o soluzione)
    GridPage.tsx       pagina con margini specchiati e blocco di griglie
    PuzzlePage.tsx
    PuzzlePanel.tsx    titolo e Date/Time accanto alla griglia
    SolutionPage.tsx
    DividerPage.tsx
    PageNumber.tsx
    IntroDocument.tsx  Document con le 4 pagine introduttive
    IntroFigure.tsx    Figure 1 e 2
    BookDocument.tsx   Document con le pagine del contenuto
  mergePdf.ts          unione di introduzione e contenuto con pdf-lib
  App.tsx              interfaccia: parametri, anteprima, download di introduzione, contenuto e libro completo
```

Comandi:

- `yarn dev`: avvia l'app
- `yarn build`: controllo dei tipi e build di produzione
- `yarn lint`

Alla pressione di "Genera" l'app valida i parametri, calcola il layout (numero di pagine, pagine fisiche totali con l'introduzione, margine interno, dimensioni), genera i puzzle, esegue `verifyBook` e `verifyFigures` e mostra un riepilogo con gli eventuali avvisi (compresi ISBN e autore mancanti).

## Verifiche

**Contenuto**, prima del rendering (`verifyBook`, già implementate):

- ogni puzzle ha **soluzione unica** (`countSolutions(p, 2) === 1`)
- ogni puzzle è risolvibile con le sole tecniche base (se `singlesOnly`)
- ogni cifra data coincide con la soluzione
- nessun puzzle duplicato
- il numero di celle occupate segue la progressione configurata

**PDF**, dopo il rendering:

Automatici (`src/verifyPdf.ts`, eseguiti a ogni "Genera"; i problemi compaiono in rosso sopra l'anteprima):

- numero di pagine uguale a quello calcolato dal layout (segnala pagine vuote o mancanti)
- dimensione di tutte le pagine uguale a quella del `trimSize` scelto (612 × 792 pt con il default)
- introduzione: esattamente 4 pagine; libro completo: pagine = introduzione + contenuto (209 con i default)
- nessun font standard non incorporato (Helvetica, Times, Courier) e ogni font con il file incorporato

Ancora da fare a mano sul file scaricato:

- verifica con `pdffonts` (colonna `emb` = `yes` per ogni font), come conferma indipendente
- nessun contenuto entro 0,25" dai bordi, e margine interno ≥ minimo KDP sul lato corretto per ogni pagina
- numero di pagina presente e corretto su ogni pagina (nessuno su i e ii; `iii` e `iv`; poi da 1)
- testi dell'introduzione identici a quelli di questo documento

## Cose da NON fare

- Non usare i font standard del PDF (Helvetica, Times, Courier).
- Non scrivere, riformulare o correggere i testi dell'introduzione, compresa la nota di copyright (fissa, in 2 capoversi): arrivano dall'utente (vedi "Regola fondamentale sui testi").
- Non generare puzzle senza verificarne l'unicità.
- Non stampare testo in italiano nel libro attuale: è per il mercato US. Le altre lingue passano solo dai file in `src/locales/`.
- Non scrivere etichette stampate direttamente nei componenti: usa il dizionario del `locale`.
- Non aggiungere elementi decorativi, citazioni o immagini senza richiesta. Le uniche figure sono le due dell'introduzione.
- Non usare `wrap={false}` su `<Page>`: react-pdf smette di imporre l'altezza e ogni pagina si riduce all'altezza del suo contenuto (la pagina "Solutions" risultava alta 137 pt). Il formato si passa sempre con `size={[PAGE_WIDTH, PAGE_HEIGHT]}`.
- Il numero di pagina sta nel margine inferiore, fuori dall'area di contenuto: deve essere `fixed`, altrimenti react-pdf crea una pagina vuota con solo il numero.
- Non modificare `src/lib/sudoku-generator.ts` senza chiedere. Se serve qualcosa in più, crea un modulo separato che lo usa.
