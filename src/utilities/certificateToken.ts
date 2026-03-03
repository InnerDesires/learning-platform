import { createHmac } from 'crypto'

const CERT_HMAC_KEY = 'certificate-v1'

function getSecret(): string {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('PAYLOAD_SECRET is not set')
  return secret
}

function buildPayload(enrollmentId: number, userId: number, courseId: number): string {
  return `${CERT_HMAC_KEY}:${enrollmentId}:${userId}:${courseId}`
}

function hmacSign(data: string): string {
  return createHmac('sha256', getSecret()).update(data).digest('hex')
}

export function generateCertificateToken(
  enrollmentId: number,
  userId: number,
  courseId: number,
): string {
  const payload = buildPayload(enrollmentId, userId, courseId)
  const signature = hmacSign(payload)
  const data = Buffer.from(`${enrollmentId}:${userId}:${courseId}`).toString('base64url')
  return `${data}~${signature}`
}

export function verifyCertificateToken(
  token: string,
): { valid: true; enrollmentId: number; userId: number; courseId: number } | { valid: false } {
  const sepIndex = token.indexOf('~')
  if (sepIndex === -1) return { valid: false }

  const dataPart = token.slice(0, sepIndex)
  const signaturePart = token.slice(sepIndex + 1)

  let decoded: string
  try {
    decoded = Buffer.from(dataPart, 'base64url').toString('utf-8')
  } catch {
    return { valid: false }
  }

  const parts = decoded.split(':')
  if (parts.length !== 3) return { valid: false }

  const enrollmentId = Number(parts[0])
  const userId = Number(parts[1])
  const courseId = Number(parts[2])

  if ([enrollmentId, userId, courseId].some((n) => !Number.isFinite(n) || n <= 0)) {
    return { valid: false }
  }

  const expectedPayload = buildPayload(enrollmentId, userId, courseId)
  const expectedSignature = hmacSign(expectedPayload)

  if (signaturePart !== expectedSignature) return { valid: false }

  return { valid: true, enrollmentId, userId, courseId }
}
