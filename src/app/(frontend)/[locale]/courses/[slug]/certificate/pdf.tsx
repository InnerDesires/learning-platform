import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Svg,
  Rect,
  Font,
  renderToBuffer,
  Link,
} from '@react-pdf/renderer'
import QRCode from 'qrcode'
import { certificateBgDataUri } from './certificate-bg'

Font.register({
  family: 'PT Serif',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/ptserif/PT_Serif-Web-Regular.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/ptserif/PT_Serif-Web-Bold.ttf',
      fontWeight: 700,
    },
  ],
})

Font.registerHyphenationCallback((word) => [word])

// Page geometry mirrors the mockup PDF (595.5 x 419.25 pt). All static artwork —
// title, labels, tagline, partner logos — is baked into the background image;
// only the dynamic values are overlaid at the coordinates measured from the mockup.
const PAGE_WIDTH = 595.5
const PAGE_HEIGHT = 419.25
const NAVY = '#161271'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'PT Serif',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
  },
  // White rounded field in the mockup: x 65.7-529.1, top 158.3-199.8
  nameBox: {
    position: 'absolute',
    top: 158.3,
    left: 65.7,
    width: 463.4,
    height: 41.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontWeight: 700,
    color: NAVY,
    textAlign: 'center',
  },
  // Free band between "УСПІШНО ЗАВЕРШИ(ЛА) КУРС" (ends 222.7) and the footer labels (290.2)
  courseBox: {
    position: 'absolute',
    top: 234,
    left: 60,
    width: 475.5,
    alignItems: 'center',
  },
  courseTitle: {
    fontWeight: 700,
    color: '#FFFFFF',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Centered under "ДАТА ЗАВЕРШЕННЯ:" (label center x 96.25, bottom 299.6)
  dateValue: {
    position: 'absolute',
    top: 303.5,
    left: 6,
    width: 180,
    fontSize: 10.5,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  // Centered under "НОМЕР СЕРТИФІКАТУ:" (label center x 493.65)
  certIdValue: {
    position: 'absolute',
    top: 303.5,
    left: 403.5,
    width: 180,
    fontSize: 10.5,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  // Free dark strip right of the partner logos: below the tagline (bottom 340.2)
  // and above the bottom-edge ornament (starts at y ~402)
  qrBox: {
    position: 'absolute',
    top: 346,
    left: 526,
    width: 52,
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    alignItems: 'center',
    paddingTop: 3.5,
  },
  qrLabel: {
    fontSize: 4.5,
    color: NAVY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 1.5,
  },
})

// Shrink to fit the fixed boxes: PT Serif Bold Cyrillic averages ~0.62em per glyph
// (~0.85em for uppercase with letter spacing).
function fitFontSize(
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize: number,
  emFactor = 0.62,
): number {
  const estimated = maxWidth / (emFactor * Math.max(text.length, 1))
  return Math.max(minSize, Math.min(maxSize, estimated))
}

type CertificateProps = {
  userName: string
  courseTitle: string
  formattedDate: string
  certId: string
  verifyUrl?: string
  verifyLabel?: string
}

function QRCodeSvg({ url, size = 44 }: { url: string; size?: number }) {
  const qr = QRCode.create(url, { errorCorrectionLevel: 'M' })
  const modules = qr.modules
  const moduleCount = modules.size
  const cellSize = size / moduleCount

  const rects: React.ReactElement[] = []
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (modules.get(row, col)) {
        rects.push(
          <Rect
            key={`${row}-${col}`}
            x={col * cellSize}
            y={row * cellSize}
            width={cellSize}
            height={cellSize}
            fill={NAVY}
          />,
        )
      }
    }
  }

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect x={0} y={0} width={size} height={size} fill="#FFFFFF" />
      {rects}
    </Svg>
  )
}

function CertificateDocument(props: CertificateProps) {
  const nameFontSize = fitFontSize(props.userName, 440, 20, 12)
  // Course title may wrap to two lines inside the free band, hence double width
  const courseFontSize = fitFontSize(props.courseTitle, 930, 14, 11, 0.85)

  return (
    <Document>
      <Page size={[PAGE_WIDTH, PAGE_HEIGHT]} style={styles.page}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image has no alt prop */}
        <Image src={certificateBgDataUri} style={styles.background} />

        <View style={styles.nameBox}>
          <Text style={[styles.userName, { fontSize: nameFontSize }]}>{props.userName}</Text>
        </View>

        <View style={styles.courseBox}>
          <Text style={[styles.courseTitle, { fontSize: courseFontSize }]}>
            {props.courseTitle}
          </Text>
        </View>

        <Text style={styles.dateValue}>{props.formattedDate}</Text>
        <Text style={styles.certIdValue}>{props.certId}</Text>

        {props.verifyUrl && (
          <Link src={props.verifyUrl}>
            <View style={styles.qrBox}>
              <QRCodeSvg url={props.verifyUrl} size={37} />
              {props.verifyLabel && <Text style={styles.qrLabel}>{props.verifyLabel}</Text>}
            </View>
          </Link>
        )}
      </Page>
    </Document>
  )
}

export async function renderCertificatePdf(props: CertificateProps): Promise<Buffer> {
  return renderToBuffer(<CertificateDocument {...props} />)
}
