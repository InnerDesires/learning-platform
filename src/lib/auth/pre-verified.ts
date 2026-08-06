// Emails that passed OTP verification during registration. On globalThis so it survives
// HMR reloads in dev.
const globalStore = globalThis as unknown as {
  __preVerifiedEmails?: Map<string, number>
}
if (!globalStore.__preVerifiedEmails) {
  globalStore.__preVerifiedEmails = new Map()
}
const store = globalStore.__preVerifiedEmails

export function markPreVerified(email: string): void {
  store.set(email.toLowerCase(), Date.now() + 10 * 60 * 1000)
}

export function consumePreVerified(email: string): boolean {
  const key = email.toLowerCase()
  const expiry = store.get(key)
  if (!expiry || expiry < Date.now()) {
    store.delete(key)
    return false
  }
  store.delete(key)
  return true
}
