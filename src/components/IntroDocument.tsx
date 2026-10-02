import { Document, Page, Text, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import type { BookConfig } from '../config.ts'
import { INTRO_CONTENT, titleCase } from '../content/intro.ts'
import type { Segment } from '../content/intro.en.ts'
import { FONT_BOLD, FONT_REGULAR } from '../fonts.ts'
import { pageMargins, pageSpec, type BookLayout, type PageSpec } from '../layout.ts'
import { DEFAULT_INTRO_SIZING, type IntroSizing } from '../introSizing.ts'
import { Figure1, Figure2 } from './IntroFigure.tsx'
import { PageNumber } from './PageNumber.tsx'

const LINE_COLOR = '#555'
const COPYRIGHT_TEXT = { fontFamily: FONT_REGULAR, fontSize: 10.5, lineHeight: 1.4 }

interface IntroDocumentProps {
  config: BookConfig
  layout: BookLayout
  sizing?: IntroSizing
}

function IntroPage({ page, children }: { page: PageSpec; children: ReactNode }) {
  const margins = pageMargins(page.physicalPage, page.innerMargin)
  return (
    <Page
      size={[page.width, page.height]}
      style={{
        fontFamily: FONT_REGULAR,
        paddingTop: margins.top,
        paddingBottom: margins.bottom,
        paddingLeft: margins.left,
        paddingRight: margins.right,
      }}
    >
      {children}
      <PageNumber label={page.label} margins={margins} />
    </Page>
  )
}

function Rich({ segments, size }: { segments: Segment[]; size: number }) {
  return (
    <Text style={{ fontFamily: FONT_REGULAR, fontSize: size, lineHeight: 1.35 }}>
      {segments.map((s, i) => (
        <Text key={i} style={{ fontFamily: s.bold ? FONT_BOLD : FONT_REGULAR }}>
          {s.text}
        </Text>
      ))}
    </Text>
  )
}

export function IntroDocument({ config, layout, sizing = DEFAULT_INTRO_SIZING }: IntroDocumentProps) {
  const t = INTRO_CONTENT[config.locale]
  const { intro } = config
  const page = (index: number, label: string | null) => pageSpec(layout, index, label)
  const margins = pageMargins(1, layout.innerMargin)
  const contentWidth = layout.pageWidth - margins.left - margins.right
  const { bodySize, figure2Size } = sizing
  const gap = bodySize * 0.8

  // Titolo: il più grande possibile su una riga (le maiuscole Bold larghe circa 0,68 em).
  const titleSize = Math.max(30, Math.min(60, contentWidth / (Math.max(intro.title.length, 1) * 0.68)))
  const figure1Size = Math.min(320, contentWidth)

  return (
    <Document title={`${titleCase(intro.title)} – ${titleCase(intro.badge)}`} language="en">
      {/* i: titolo */}
      <IntroPage page={page(0, 'i')}>
        <View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', rowGap: 26 }}>
          <View style={{ borderWidth: 2, borderColor: '#000', paddingVertical: 8, paddingHorizontal: 22 }}>
            <Text style={{ fontFamily: FONT_BOLD, fontSize: 20 }}>{intro.badge}</Text>
          </View>
          <Text style={{ fontFamily: FONT_BOLD, fontSize: titleSize, textAlign: 'center' }}>{intro.title}</Text>
          <Text style={{ fontFamily: FONT_BOLD, fontSize: 20, textAlign: 'center' }}>{intro.subtitle}</Text>
          <View style={{ rowGap: 5, width: '100%' }}>
            {intro.features.split('·').map((line) => (
              <Text key={line} style={{ fontFamily: FONT_REGULAR, fontSize: 14, textAlign: 'center' }}>
                {line.trim()}
              </Text>
            ))}
          </View>
          <Text style={{ fontFamily: FONT_REGULAR, fontSize: 14 }}>{intro.volume}</Text>
          <Text style={{ fontFamily: FONT_REGULAR, fontSize: 16 }}>{intro.author}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', columnGap: 8, marginBottom: 6 }}>
          <Text style={{ fontFamily: FONT_REGULAR, fontSize: 14 }}>{t.belongsTo}</Text>
          <View style={{ flexGrow: 1, height: 14, borderBottomWidth: 0.75, borderBottomColor: LINE_COLOR }} />
        </View>
      </IntroPage>

      {/* ii: copyright */}
      <IntroPage page={page(1, 'ii')}>
        <View style={{ flexGrow: 1, justifyContent: 'flex-end', rowGap: 10 }}>
          <View>
            <Text style={COPYRIGHT_TEXT}>{`${titleCase(intro.title)} – ${titleCase(intro.badge)}, ${intro.volume}`}</Text>
            <Text style={COPYRIGHT_TEXT}>{`Copyright © ${intro.year} ${intro.author}. ${t.rightsReserved}`}</Text>
          </View>
          {intro.copyrightNotice !== '' && <Text style={COPYRIGHT_TEXT}>{intro.copyrightNotice}</Text>}
          <Text style={COPYRIGHT_TEXT}>{t.verified}</Text>
          <View>
            <Text style={COPYRIGHT_TEXT}>{`ISBN: ${intro.isbn}`}</Text>
            <Text style={COPYRIGHT_TEXT}>{t.publisher}</Text>
          </View>
        </View>
      </IntroPage>

      {/* iii: How to Play */}
      <IntroPage page={page(2, 'iii')}>
        <View style={{ rowGap: gap * 1.4 }}>
          <Text style={{ fontFamily: FONT_BOLD, fontSize: 24 }}>{t.howToPlay.title}</Text>
          <Text style={{ fontFamily: FONT_REGULAR, fontSize: 15, lineHeight: 1.35 }}>{t.howToPlay.text}</Text>
          <View style={{ alignItems: 'center' }}>
            <Figure1 size={figure1Size} />
          </View>
          <View style={{ rowGap: 10 }}>
            {t.howToPlay.rules.map((rule) => (
              <Text key={rule} style={{ fontFamily: FONT_BOLD, fontSize: 16 }}>
                {rule}
              </Text>
            ))}
          </View>
        </View>
      </IntroPage>

      {/* iv: Tips e contenuto del libro */}
      <IntroPage page={page(3, 'iv')}>
        <View style={{ rowGap: gap }}>
          <Text style={{ fontFamily: FONT_BOLD, fontSize: 22 }}>{t.tips.title}</Text>
          {t.tips.paragraphs.map((segments, i) => (
            <Rich key={i} segments={segments} size={bodySize} />
          ))}
          <View style={{ alignItems: 'center' }}>
            <Figure2 size={figure2Size} />
          </View>
          {t.tips.afterFigure.map((segments, i) => (
            <Rich key={i} segments={segments} size={bodySize} />
          ))}
          <Text style={{ fontFamily: FONT_BOLD, fontSize: 22, marginTop: gap * 0.5 }}>{t.inThisBook.title}</Text>
          {t.inThisBook.paragraphs.map((text) => (
            <Text key={text} style={{ fontFamily: FONT_REGULAR, fontSize: bodySize, lineHeight: 1.35 }}>
              {text}
            </Text>
          ))}
        </View>
      </IntroPage>
    </Document>
  )
}
