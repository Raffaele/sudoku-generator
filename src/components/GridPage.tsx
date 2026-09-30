import { Page, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import { FONT_REGULAR } from '../fonts.ts'
import { pageMargins, type GridLayout } from '../layout.ts'
import { PageNumber } from './PageNumber.tsx'

function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, i * size + size),
  )
}

interface GridPageProps<T> {
  items: T[]
  pageNumber: number
  innerMargin: number
  layout: GridLayout
  renderItem: (item: T) => ReactNode
}

/** Pagina KDP con margini specchiati, un blocco di griglie disposte come da `layout` e il numero di pagina. */
export function GridPage<T>({ items, pageNumber, innerMargin, layout, renderItem }: GridPageProps<T>) {
  const margins = pageMargins(pageNumber, innerMargin)
  return (
    <Page
      size="LETTER"
      wrap={false}
      style={{
        fontFamily: FONT_REGULAR,
        paddingTop: margins.top,
        paddingBottom: margins.bottom,
        paddingLeft: margins.left,
        paddingRight: margins.right,
      }}
    >
      <View style={{ marginTop: layout.offsetY }}>
        {chunk(items, layout.cols).map((row, r) => (
          <View
            key={r}
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              columnGap: layout.gap,
              marginTop: r === 0 ? 0 : layout.gap,
            }}
          >
            {row.map((item, c) => (
              <View key={c} style={{ width: layout.side, alignItems: 'center' }}>
                {renderItem(item)}
              </View>
            ))}
          </View>
        ))}
      </View>
      <PageNumber pageNumber={pageNumber} margins={margins} />
    </Page>
  )
}
