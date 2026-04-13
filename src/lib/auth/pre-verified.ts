/** In-memory store of emails that passed OTP verification during registration.
 *  Uses globalThis to survive HMR reloads in dev mode.
 *  Set by the verify-registration API route, checked by databaseHooks in auth options. */
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
