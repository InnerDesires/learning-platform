import { beforeAll, describe, it, expect } from 'vitest'
import { generateCertificateToken, verifyCertificateToken } from '@/utilities/certificateToken'

describe('certificateToken', () => {
  beforeAll(() => {
    process.env.PAYLOAD_SECRET = 'test-secret-for-cert-token-tests'
  })

  describe('generate + verify roundtrip', () => {
    it('verifies a generated token with the correct IDs', () => {
      const token = generateCertificateToken(1, 2, 3)
      const result = verifyCertificateToken(token)

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.enrollmentId).toBe(1)
        expect(result.userId).toBe(2)
        expect(result.courseId).toBe(3)
      }
    })

    it('preserves large IDs correctly', () => {
      const token = generateCertificateToken(99999, 88888, 77777)
      const result = verifyCertificateToken(token)

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.enrollmentId).toBe(99999)
        expect(result.userId).toBe(88888)
        expect(result.courseId).toBe(77777)
      }
    })

    it('produces different tokens for different ID combinations', () => {
      const t1 = generateCertificateToken(1, 2, 3)
      const t2 = generateCertificateToken(4, 5, 6)
      expect(t1).not.toBe(t2)
    })
  })

  describe('invalid inputs', () => {
    it('returns invalid when the ~ separator is missing', () => {
      expect(verifyCertificateToken('nodatanorsig')).toEqual({ valid: false })
    })

    it('returns invalid for an empty string', () => {
      expect(verifyCertificateToken('')).toEqual({ valid: false })
    })

    it('returns invalid when the signature is tampered', () => {
      const token = generateCertificateToken(1, 2, 3)
      const tampered = token.slice(0, token.indexOf('~') + 1) + 'deadbeefdeadbeef'
      expect(verifyCertificateToken(tampered)).toEqual({ valid: false })
    })

    it('returns invalid when the data part has too few segments', () => {
      const data = Buffer.from('1:2').toString('base64url')
      expect(verifyCertificateToken(`${data}~somesig`)).toEqual({ valid: false })
    })

    it('returns invalid when IDs are non-numeric', () => {
      const data = Buffer.from('a:b:c').toString('base64url')
      expect(verifyCertificateToken(`${data}~somesig`)).toEqual({ valid: false })
    })

    it('returns invalid when any ID is zero', () => {
      const data = Buffer.from('0:1:2').toString('base64url')
      expect(verifyCertificateToken(`${data}~somesig`)).toEqual({ valid: false })
    })

    it('returns invalid when any ID is negative', () => {
      const data = Buffer.from('-1:1:2').toString('base64url')
      expect(verifyCertificateToken(`${data}~somesig`)).toEqual({ valid: false })
    })
  })

  describe('secret isolation', () => {
    it('a token generated with one secret fails verification with a different secret', () => {
      process.env.PAYLOAD_SECRET = 'secret-one'
      const token = generateCertificateToken(10, 20, 30)

      process.env.PAYLOAD_SECRET = 'secret-two'
      expect(verifyCertificateToken(token)).toEqual({ valid: false })

      process.env.PAYLOAD_SECRET = 'test-secret-for-cert-token-tests'
    })
  })
})
