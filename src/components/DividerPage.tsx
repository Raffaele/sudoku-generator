import { Page, Text } from '@react-pdf/renderer'
import { FONT_BOLD } from '../fonts.ts'
import { pageMargins, type PageSpec } from '../layout.ts'
import { PageNumber } from './PageNumber.tsx'

export function DividerPage({ page, title }: { page: PageSpec; title: string }) {
  const margins = pageMargins(page.physicalPage, page.innerMargin)
  return (
    <Page
      size={[page.width, page.height]}
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: margins.top,
        paddingBottom: margins.bottom,
        paddingLeft: margins.left,
        paddingRight: margins.right,
      }}
    >
      <Text style={{ fontFamily: FONT_BOLD, fontSize: 40 }}>{title}</Text>
      <PageNumber label={page.label} margins={margins} />
    </Page>
  )
}
