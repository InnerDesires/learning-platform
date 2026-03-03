import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Rect,
  Font,
  renderToBuffer,
  Link,
} from '@react-pdf/renderer'
import QRCode from 'qrcode'

Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
      fontWeight: 700,
    },
  ],
})

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 0,
    fontFamily: 'Roboto',
  },
  outerBorder: {
    margin: 30,
    border: '3pt solid #1a365d',
    padding: 8,
    flex: 1,
  },
  innerBorder: {
    border: '1pt solid #2a4a7f',
    padding: 40,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerDecoration: {
    position: 'absolute',
    width: 60,
    height: 60,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTop: '2pt solid #c9a84c',
    borderLeft: '2pt solid #c9a84c',
  },
  topRight: {
    top: 0,
    right: 0,
    borderTop: '2pt solid #c9a84c',
    borderRight: '2pt solid #c9a84c',
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottom: '2pt solid #c9a84c',
    borderLeft: '2pt solid #c9a84c',
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottom: '2pt solid #c9a84c',
    borderRight: '2pt solid #c9a84c',
  },
  platformName: {
    fontSize: 14,
    letterSpacing: 4,
    color: '#1a365d',
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  divider: {
    width: 80,
    height: 2,
    backgroundColor: '#c9a84c',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    color: '#1a365d',
    marginBottom: 30,
    letterSpacing: 1,
  },
  presented: {
    fontSize: 12,
    color: '#4a5568',
    marginBottom: 12,
  },
  userName: {
    fontSize: 26,
    color: '#1a365d',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottom: '1pt solid #c9a84c',
    paddingHorizontal: 30,
  },
  forText: {
    fontSize: 12,
    color: '#4a5568',
    marginBottom: 12,
    marginTop: 8,
  },
  courseTitle: {
    fontSize: 18,
    color: '#2d3748',
    marginBottom: 30,
    textAlign: 'center',
    maxWidth: 400,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  footerItem: {
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 9,
    color: '#718096',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footerValue: {
    fontSize: 11,
    color: '#2d3748',
  },
  qrSection: {
    alignItems: 'center',
  },
  verifyLabel: {
    fontSize: 7,
    color: '#718096',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  verifyUrl: {
    fontSize: 7,
    color: '#2a4a7f',
    marginTop: 2,
    textDecoration: 'none',
  },
})

type CertificateProps = {
  platformName: string
  title: string
  presented: string
  userName: string
  forText: string
  courseTitle: string
  dateLabel: string
  formattedDate: string
  certIdLabel: string
  certId: string
  verifyUrl?: string
  verifyLabel?: string
}

function QRCodeSvg({ url, size = 70 }: { url: string; size?: number }) {
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
            fill="#1a365d"
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
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.outerBorder}>
          <View style={styles.innerBorder}>
            <View style={[styles.cornerDecoration, styles.topLeft]} />
            <View style={[styles.cornerDecoration, styles.topRight]} />
            <View style={[styles.cornerDecoration, styles.bottomLeft]} />
            <View style={[styles.cornerDecoration, styles.bottomRight]} />

            <Text style={styles.platformName}>{props.platformName}</Text>
            <View style={styles.divider} />
            <Text style={styles.title}>{props.title}</Text>
            <Text style={styles.presented}>{props.presented}</Text>
            <Text style={styles.userName}>{props.userName}</Text>
            <Text style={styles.forText}>{props.forText}</Text>
            <Text style={styles.courseTitle}>{props.courseTitle}</Text>

            <View style={styles.footer}>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>{props.dateLabel}</Text>
                <Text style={styles.footerValue}>{props.formattedDate}</Text>
              </View>

              {props.verifyUrl && (
                <View style={styles.qrSection}>
                  <QRCodeSvg url={props.verifyUrl} size={70} />
                  {props.verifyLabel && (
                    <Text style={styles.verifyLabel}>{props.verifyLabel}</Text>
                  )}
                  <Link src={props.verifyUrl} style={styles.verifyUrl}>
                    <Text style={styles.verifyUrl}>{props.verifyUrl}</Text>
                  </Link>
                </View>
              )}

              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>{props.certIdLabel}</Text>
                <Text style={styles.footerValue}>{props.certId}</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export async function renderCertificatePdf(props: CertificateProps): Promise<Buffer> {
  return renderToBuffer(<CertificateDocument {...props} />)
}
