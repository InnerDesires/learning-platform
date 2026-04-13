import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getPayload } from '@/lib/payload'
import { buildOtpEmailHtml } from '@/lib/email/verification-otp'
import { markPreVerified } from '@/lib/auth/pre-verified'

export async function POST(request: Request) {
  const body = await request.json()
  const { action } = body

  if (action === 'send-otp') return handleSendOtp(body)
  if (action === 'verify-otp') return handleVerifyOtp(body)

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

async function handleSendOtp(body: { email?: string }) {
  const email = body.email?.toLowerCase().trim()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const payload = await getPayload()

  const existingUsers = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
  })

  if (existingUsers.docs.length > 0) {
    return NextResponse.json({ error: 'Email already taken' }, { status: 409 })
  }

  // Use the internal createVerificationOTP endpoint (no user-existence check)
  const otp = await payload.betterAuth.api.createVerificationOTP({
    body: { email, type: 'email-verification' },
  })

  // Send the OTP email via Resend (skipped when API key is not configured, e.g. in CI/tests)
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: email,
      subject: `Код підтвердження: ${otp}`,
      html: buildOtpEmailHtml(otp),
    })
  }

  return NextResponse.json({ success: true })
}

async function handleVerifyOtp(body: { email?: string; otp?: string }) {
  const email = body.email?.toLowerCase().trim()
  const otp = body.otp?.trim()

  if (!email || !otp) {
    return NextResponse.json({ error: 'Email and OTP required' }, { status: 400 })
  }

  const payload = await getPayload()
  const identifier = `email-verification-otp-${email}`

  // Find the verification record
  const records = await payload.find({
    collection: 'verifications',
    where: { identifier: { equals: identifier } },
    limit: 1,
  })

  const record = records.docs[0]
  if (!record) {
    return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
  }

  if (new Date(record.expiresAt) < new Date()) {
    await payload.delete({ collection: 'verifications', id: record.id })
    return NextResponse.json({ error: 'OTP expired' }, { status: 400 })
  }

  // Value format is "otp:attempts"
  const value = record.value as string
  const lastColon = value.lastIndexOf(':')
  const storedOtp = value.substring(0, lastColon)
  const attempts = parseInt(value.substring(lastColon + 1), 10)

  if (attempts >= 3) {
    await payload.delete({ collection: 'verifications', id: record.id })
    return NextResponse.json({ error: 'Too many attempts' }, { status: 403 })
  }

  if (storedOtp !== otp) {
    // Increment attempt counter
    await payload.update({
      collection: 'verifications',
      id: record.id,
      data: { value: `${storedOtp}:${attempts + 1}` },
    })
    return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
  }

  // OTP valid — mark email as pre-verified and clean up
  markPreVerified(email)
  await payload.delete({ collection: 'verifications', id: record.id })

  return NextResponse.json({ verified: true })
}
