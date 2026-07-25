'use server'

import { headers } from 'next/headers'

import { getPayload } from '@/lib/payload'
import { getSession } from '@/lib/auth/getSession'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import type { User } from '@/payload-types'

export type SettingsResult = { success: true } | { success: false; error: string }

const AVATAR_MAX_BYTES = 5 * 1024 * 1024
const AVATAR_MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export async function updateAvatar(formData: FormData): Promise<SettingsResult> {
  const session = await getSession()
  if (!session?.user) return { success: false, error: 'AUTH_REQUIRED' }

  const file = formData.get('file')
  if (!(file instanceof File)) return { success: false, error: 'INVALID_FILE' }
  const ext = AVATAR_MIME_EXT[file.type]
  if (!ext) return { success: false, error: 'INVALID_TYPE' }
  if (file.size > AVATAR_MAX_BYTES) return { success: false, error: 'TOO_LARGE' }

  const payload = await getPayload()
  const buffer = Buffer.from(await file.arrayBuffer())

  const media = await payload.create({
    collection: 'media',
    data: { alt: session.user.name || session.user.email },
    file: {
      data: buffer,
      mimetype: file.type,
      name: `avatar-${session.user.id}-${Date.now()}.${ext}`,
      size: buffer.length,
    },
  })

  // better-auth's `image` is a plain text column, so this is a snapshot: it will
  // not follow a later change in how media is served. Avatars uploaded before
  // the Blob CDN switch had to be rewritten by hand
  // (src/migrations/20260724_200000_backfill_blob_urls.ts).
  const url = getMediaUrl(media.sizes?.square?.url ?? media.url)
  if (!url) return { success: false, error: 'UPLOAD_FAILED' }

  await payload.betterAuth.api.updateUser({
    body: { image: url },
    headers: await headers(),
  })

  return { success: true }
}

export async function removeAvatar(): Promise<SettingsResult> {
  const session = await getSession()
  if (!session?.user) return { success: false, error: 'AUTH_REQUIRED' }

  // better-auth's updateUser drops null fields, so clear the image via Payload;
  // the client refreshes the session cookie cache afterwards.
  const payload = await getPayload()
  await payload.update({
    collection: 'users',
    id: Number(session.user.id),
    data: { image: null },
  })

  return { success: true }
}

const MAX_ABOUT_LENGTH = 500

export async function updateAbout(about: string): Promise<SettingsResult> {
  const session = await getSession()
  if (!session?.user) return { success: false, error: 'AUTH_REQUIRED' }

  if (typeof about !== 'string') return { success: false, error: 'INVALID_ABOUT' }
  const trimmed = about.trim()
  if (trimmed.length > MAX_ABOUT_LENGTH) return { success: false, error: 'TOO_LONG' }

  const payload = await getPayload()
  await payload.update({
    collection: 'users',
    id: Number(session.user.id),
    data: { about: trimmed || null },
  })

  return { success: true }
}

export async function updateHideProfileComments(hide: boolean): Promise<SettingsResult> {
  const session = await getSession()
  if (!session?.user) return { success: false, error: 'AUTH_REQUIRED' }

  if (typeof hide !== 'boolean') return { success: false, error: 'INVALID_VALUE' }

  const payload = await getPayload()
  await payload.update({
    collection: 'users',
    id: Number(session.user.id),
    data: { hideProfileComments: hide },
  })

  return { success: true }
}

type SocialLink = NonNullable<User['socialLinks']>[number]

const SOCIAL_PLATFORMS: SocialLink['platform'][] = [
  'instagram',
  'facebook',
  'telegram',
  'youtube',
  'tiktok',
  'linkedin',
  'x',
  'website',
]
const MAX_SOCIAL_LINKS = 8
const MAX_URL_LENGTH = 300

export async function updateSocialLinks(
  links: { platform: string; url: string }[],
): Promise<SettingsResult> {
  const session = await getSession()
  if (!session?.user) return { success: false, error: 'AUTH_REQUIRED' }

  if (!Array.isArray(links) || links.length > MAX_SOCIAL_LINKS) {
    return { success: false, error: 'INVALID_LINKS' }
  }

  const cleaned: { platform: SocialLink['platform']; url: string }[] = []
  for (const link of links) {
    const platform = SOCIAL_PLATFORMS.find((p) => p === link.platform)
    const url = typeof link.url === 'string' ? link.url.trim() : ''
    if (!platform || !url || url.length > MAX_URL_LENGTH) {
      return { success: false, error: 'INVALID_LINKS' }
    }
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      return { success: false, error: 'INVALID_URL' }
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { success: false, error: 'INVALID_URL' }
    }
    cleaned.push({ platform, url })
  }

  const payload = await getPayload()
  await payload.update({
    collection: 'users',
    id: Number(session.user.id),
    data: { socialLinks: cleaned },
  })

  return { success: true }
}

export async function setInitialPassword(newPassword: string): Promise<SettingsResult> {
  const session = await getSession()
  if (!session?.user) return { success: false, error: 'AUTH_REQUIRED' }

  if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
    return { success: false, error: 'INVALID_PASSWORD' }
  }

  const payload = await getPayload()

  // setPassword is only for accounts without a credential provider — existing
  // passwords must go through changePassword with the current password.
  const credential = await payload.find({
    collection: 'accounts',
    where: {
      and: [
        { user: { equals: Number(session.user.id) } },
        { providerId: { equals: 'credential' } },
      ],
    },
    limit: 1,
    depth: 0,
  })
  if (credential.totalDocs > 0) return { success: false, error: 'HAS_PASSWORD' }

  await payload.betterAuth.api.setPassword({
    body: { newPassword },
    headers: await headers(),
  })

  return { success: true }
}
