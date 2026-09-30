import { Page, Text } from '@react-pdf/renderer'
import { FONT_BOLD } from '../fonts.ts'
import { pageMargins } from '../layout.ts'
import { PageNumber } from './PageNumber.tsx'

export function DividerPage({ pageNumber, innerMargin }: { pageNumber: number; innerMargin: number }) {
  const margins = pageMargins(pageNumber, innerMargin)
  return (
    <Page
      size="LETTER"
      wrap={false}
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: margins.top,
        paddingBottom: margins.bottom,
        paddingLeft: margins.left,
        paddingRight: margins.right,
      }}
    >
      <Text style={{ fontFamily: FONT_BOLD, fontSize: 40 }}>Solutions</Text>
      <PageNumber pageNumber={pageNumber} margins={margins} />
    </Page>
  )
}
