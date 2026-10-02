/** Testi fissi dell'introduzione: scritti dall'utente, da riprodurre alla lettera (vedi agent.md). */

/** Un frammento di testo; `bold` per le parti tra `**` nel testo originale. */
export interface Segment {
  text: string
  bold?: boolean
}

export const introEn = {
  belongsTo: 'This book belongs to:',
  rightsReserved: 'All rights reserved.',
  verified: 'Every sudoku has exactly one solution and can be solved with basic techniques (computer-verified).',
  publisher: 'Independently published',
  howToPlay: {
    title: 'How to Play',
    text: 'Add a number in every empty cell to obtain all the numbers from 1 to 9, without repeating, in every row, column and 3×3 box.',
    rules: ['NO MATH NEEDED', 'EXACTLY 1 CORRECT SOLUTION', 'NO GUESSING NEEDED'],
  },
  tips: {
    title: 'Tips',
    paragraphs: [
      [
        { text: 'The only empty cell.', bold: true },
        {
          text: ' If there is only 1 empty cell in a row, column or 3×3 box, the only missing number goes there.',
        },
      ],
      [
        { text: 'The only possible place.', bold: true },
        {
          text: ' Choose a box, and one of the missing numbers in that box (for example, 3). Check if some columns or rows are blocking all the cells except 1: that\'s your "3".',
        },
      ],
    ] as Segment[][],
    afterFigure: [[{ text: 'Easy corrections with a pencil.', bold: true }]] as Segment[][],
  },
  inThisBook: {
    title: "What You'll Find in This Book",
    paragraphs: [
      'Difficulty grows gradually, from "very easy" to "easy".',
      'You can see your progress by writing down the date and the solving time next to each sudoku.',
      'The solutions are at the end of the book, with gray used for given numbers and handwriting style for the numbers you find.',
      'Enjoy!',
    ],
  },
}

export type IntroContent = typeof introEn
