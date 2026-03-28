import type { FormSubmission, ApprovalStep } from '@/types'
import { encodeFormToUrl } from './formUrlEncoder'

// הגדרות EmailJS – מוגדרים בקובץ .env
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID ?? ''
const TEMPLATE_APPROVAL_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_APPROVAL_ID ?? ''
const TEMPLATE_HR_FINAL_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_HR_FINAL_ID ?? ''
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY ?? ''

// מייל HR ברירת מחדל (fallback אם המנכ"ל לא הזין)
export const HR_FINAL_EMAIL = 'romi@aminach.co.il'

function isEmailJsConfigured(): boolean {
  return !!(SERVICE_ID && TEMPLATE_APPROVAL_ID && TEMPLATE_HR_FINAL_ID && PUBLIC_KEY)
}

/**
 * פותח תוכנת מייל + מעתיק את הקישור ללוח כגיבוי.
 */
async function openMailtoWithLink(
  toEmail: string,
  toName: string,
  subject: string,
  formLink: string
): Promise<{ success: boolean; message: string }> {
  let clipboardOk = false
  try {
    await navigator.clipboard.writeText(formLink)
    clipboardOk = true
  } catch {
    // clipboard לא זמין – לא קריטי
  }

  try {
    const body =
      `שלום ${toName},\n\n` +
      `ממתין לאישורך טופס הערכת עובד.\n\n` +
      `לחץ על הקישור לפתיחת הטופס:\n` +
      `${formLink}`

    const mailtoHref =
      `mailto:${encodeURIComponent(toEmail)}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`

    const a = document.createElement('a')
    a.href = mailtoHref
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch {
    return {
      success: clipboardOk,
      message: clipboardOk
        ? `הקישור הועתק ללוח – שלח אותו ידנית ל-${toEmail}`
        : `לא ניתן לפתוח מייל. שלח ידנית ל-${toEmail}`,
    }
  }

  return {
    success: true,
    message: clipboardOk
      ? `✉️ תוכנת המייל נפתחה! הקישור גם הועתק ללוח אם תצטרך`
      : `✉️ תוכנת המייל נפתחה לשליחה ל-${toName} (${toEmail})`,
  }
}

/**
 * שולח מייל לאישור למנהל הבא בשרשרת.
 * אם EmailJS מוגדר – משתמש ב-API.
 * אחרת – פותח mailto: ומעתיק קישור ללוח.
 */
export async function sendApprovalRequestEmail(
  form: FormSubmission,
  approver: ApprovalStep
): Promise<{ success: boolean; message: string }> {
  if (!approver.managerEmail) {
    return { success: false, message: `לא הוגדר מייל עבור ${approver.managerName}` }
  }

  const formLink = encodeFormToUrl(form)
  const subject = `בקשת אישור – הערכת עובד ${form.employeeDetails.employeeName}`

  if (!isEmailJsConfigured()) {
    console.log('📧 [EmailJS לא מוגדר] פותח mailto:', { to: approver.managerEmail })
    return openMailtoWithLink(approver.managerEmail, approver.managerName, subject, formLink)
  }

  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore – @emailjs/browser נוסף ל-package.json; הרץ npm install
    const emailjs = await import('@emailjs/browser')
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_APPROVAL_ID,
      {
        to_email: approver.managerEmail,
        to_name: approver.managerName,
        approver_role: approver.title,
        employee_name: form.employeeDetails.employeeName,
        employee_id: form.employeeDetails.employeeId,
        department: form.employeeDetails.department,
        position: form.employeeDetails.position,
        form_link: formLink,
      },
      PUBLIC_KEY
    )
    return { success: true, message: `מייל נשלח בהצלחה ל-${approver.managerName}` }
  } catch (err) {
    console.error('שגיאה בשליחת מייל EmailJS:', err)
    return openMailtoWithLink(approver.managerEmail, approver.managerName, subject, formLink)
  }
}

/**
 * שולח מייל סיכום למשאבי האנוש לאחר כל האישורים.
 * @param hrEmail - מייל HR שהוזן ע"י המנכ"ל
 */
export async function sendHrFinalEmail(
  form: FormSubmission,
  hrEmail: string
): Promise<{ success: boolean; message: string }> {
  const toEmail = hrEmail || HR_FINAL_EMAIL
  const formLink = encodeFormToUrl(form)
  const approversChain = form.approvalSteps
    .map((s) => `${s.managerName} (${s.title})`)
    .join(' → ')

  const subject = `טופס הערכת עובד מאושר – ${form.employeeDetails.employeeName}`

  if (!isEmailJsConfigured()) {
    console.log('📧 [EmailJS לא מוגדר] פותח mailto לHR:', { to: toEmail })
    return openMailtoWithLink(toEmail, 'מחלקת משאבי אנוש', subject, formLink)
  }

  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const emailjs = await import('@emailjs/browser')
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_HR_FINAL_ID,
      {
        to_email: toEmail,
        to_name: 'מחלקת משאבי אנוש',
        employee_name: form.employeeDetails.employeeName,
        employee_id: form.employeeDetails.employeeId,
        department: form.employeeDetails.department,
        position: form.employeeDetails.position,
        current_salary: form.salaryRecommendation.currentSalary.toLocaleString('he-IL'),
        proposed_salary: form.salaryRecommendation.proposedSalary.toLocaleString('he-IL'),
        raise_percentage: form.salaryRecommendation.raisePercentage,
        approvers_chain: approversChain,
        form_link: formLink,
      },
      PUBLIC_KEY
    )
    return { success: true, message: `מייל סיכום נשלח ל-${toEmail}` }
  } catch (err) {
    console.error('שגיאה בשליחת מייל HR EmailJS:', err)
    return openMailtoWithLink(toEmail, 'מחלקת משאבי אנוש', subject, formLink)
  }
}
