import type { FormSubmission } from '@/types'

/**
 * מזהה חתימה מקוצרת ב-URL – במקום data URI שלמה (50-100KB)
 * החתימות האמיתיות נשמרות רק ב-state המקומי
 */
export const SIG_MARKER = '__sig__'

/** מסיר נתוני חתימה לפני קידוד ה-URL */
function compactForUrl(form: FormSubmission): FormSubmission {
  return {
    ...form,
    approvalSteps: form.approvalSteps.map((s) => ({
      ...s,
      signatureData: s.signatureData ? SIG_MARKER : null,
    })),
  }
}

/**
 * מקודד את הטופס ל-URL לשיתוף עם מאשרים.
 * משתמש ב-encodeURIComponent ישירות – פשוט ואמין לכל תו.
 */
export function encodeFormToUrl(form: FormSubmission): string {
  try {
    const compact = compactForUrl(form)
    const json = JSON.stringify(compact)
    const encoded = encodeURIComponent(json)
    const base =
      typeof window !== 'undefined'
        ? window.location.origin + window.location.pathname
        : ''
    return `${base}?form=${encoded}`
  } catch {
    return typeof window !== 'undefined' ? window.location.href : ''
  }
}

/**
 * מפענח נתוני טופס מה-URL.
 * URLSearchParams.get() מפענח percent-encoding אוטומטית.
 */
export function decodeFormFromUrl(): FormSubmission | null {
  if (typeof window === 'undefined') return null
  try {
    const params = new URLSearchParams(window.location.search)
    const raw = params.get('form')
    if (!raw) return null
    return JSON.parse(raw) as FormSubmission
  } catch {
    return null
  }
}

/** מנקה את פרמטר הטופס מה-URL */
export function clearFormFromUrl(): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.delete('form')
  window.history.replaceState({}, '', url.toString())
}
