// Small helpers for saving things in the browser's own storage (localStorage).
//
// What this means in plain English: the information is kept inside the
// student's browser on their device. It is not sent anywhere.
//
// Since Stage 2, the browser is no longer where your *consent record* lives —
// that is now saved on the server against your account (see prisma/schema.prisma).
// The browser copy is only a temporary hand-off: it holds your answers while you
// are away at Google signing in, and is deleted once the server has them.
//
// These helpers may only be used from components marked "use client", because
// `window` does not exist while a page is being prepared on the server.

export const STORAGE_KEYS = {
  // The cookie banner's answer. Stays in the browser on purpose: a cookie
  // choice belongs to a device, not to an account.
  cookieChoice: "internpilot.cookieChoice",

  // Your consent answers, kept as a convenience so the boxes are pre-filled if
  // you come back to the page.
  consent: "internpilot.consent",

  // Consent answers waiting to be handed to the server after you sign in.
  // Deleted as soon as the server confirms it has them.
  pendingConsent: "internpilot.pendingConsent",
};

// Reading and writing can fail (private browsing, storage switched off), so
// these quietly give up instead of crashing the page. Returning null means
// "nothing saved yet".
export function readStoredJSON(key) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeStoredJSON(key, value) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Nothing useful to do here — the value simply will not be remembered.
  }
}

export function clearStored(key) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing useful to do here.
  }
}
