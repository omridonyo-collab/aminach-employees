import html2pdf from 'html2pdf.js'
import type { FormSubmission } from '@/types'
import { format } from 'date-fns'
import {
  PERFORMANCE_LABELS,
  RECOMMENDATION_LABELS,
  SCORE_LABELS,
  type PerformanceScores,
} from '@/types'

const STATUS_LABELS = {
  draft: 'טיוטה',
  pending_approval: 'ממתין לאישור',
  rejected: 'נדחה',
  approved: 'אושר סופית',
}

const APPROVAL_STATUS_LABELS = {
  pending: 'ממתין',
  approved: 'אושר',
  rejected: 'נדחה',
}

export function openEmailWithPdf(form: FormSubmission, filename: string): void {
  const subject = encodeURIComponent(`טופס הערכת עובד - ${form.employeeDetails.employeeName}`)
  const body = encodeURIComponent(
    `שלום,\n\nמצורף טופס הערכת העובד.\n\nאנא צרף את קובץ ה-PDF (${filename}) כצרופה למייל.\n\nבברכה`
  )
  window.location.href = `mailto:?subject=${subject}&body=${body}`
}

export function printForm(form: FormSubmission): void {
  const html = buildPdfHtml(form)
  const win = window.open('', '_blank')
  if (!win) {
    alert('יש לאפשר חלונות קופצים להדפסה')
    return
  }
  win.document.write(`
    <!DOCTYPE html><html dir="rtl"><head>
    <meta charset="utf-8"><title>טופס הערכת עובד</title>
    <style>body{font-family:Arial,sans-serif;margin:20px;}</style>
    </head><body>${html}</body></html>
  `)
  win.document.close()
  win.focus()
  setTimeout(() => {
    win.print()
    win.onafterprint = () => win.close()
  }, 300)
}

function buildPdfHtml(form: FormSubmission): string {
  const ed = form.employeeDetails
  const scores = form.performanceScores as PerformanceScores
  const we = form.writtenEvaluation
  const sr = form.salaryRecommendation
  const avg = (Object.values(scores) as number[]).reduce((a, b) => a + b, 0) / 8

  const scoreRows = (Object.entries(scores) as [keyof PerformanceScores, number][])
    .map(
      ([key, value]) =>
        `<tr><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">${PERFORMANCE_LABELS[key]}</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center;">${value}</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">${SCORE_LABELS[value] || ''}</td></tr>`
    )
    .join('')

  const approvalRows = form.approvalSteps
    .map(
      (step, i) => `
      <div style="margin-bottom: 12px; padding: 8px; background: #f8fafc; border-radius: 6px;">
        <strong>${i + 1}. ${step.title} - ${step.managerName}</strong>
        <div style="font-size: 13px; color: #475569;">סטטוס: ${APPROVAL_STATUS_LABELS[step.status]}</div>
        ${step.comment ? `<div style="font-size: 13px;">הערה: ${step.comment}</div>` : ''}
        ${step.signedAt ? `<div style="font-size: 12px; color: #64748b;">תאריך: ${step.signedAt}</div>` : ''}
        ${step.signatureData ? `<img src="${step.signatureData}" alt="חתימה" style="height: 40px; margin-top: 4px;" />` : ''}
      </div>
    `
    )
    .join('')

  return `
    <div dir="rtl" style="font-family: Arial, 'Segoe UI', Tahoma, sans-serif; padding: 24px; font-size: 14px; color: #1e293b; line-height: 1.6;">
      <h1 style="font-size: 22px; margin-bottom: 8px; color: #0f172a;">טופס הערכת עובד - עמינח</h1>
      <p style="margin-bottom: 20px;"><strong>סטטוס:</strong> ${STATUS_LABELS[form.status]}</p>

      <div style="margin-bottom: 20px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="font-size: 16px; margin-bottom: 12px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">1. פרטי עובד</h2>
        <p>שם העובד: ${ed.employeeName}</p>
        <p>מספר עובד: ${ed.employeeId}</p>
        <p>מחלקת מפעל: ${ed.plantDepartment}</p>
        <p>מחלקה: ${ed.department}</p>
        <p>תפקיד: ${ed.position}</p>
        <p>מנהל ישיר: ${ed.directManagerName}</p>
        <p>ותק: ${ed.tenureInCompany}</p>
        <p>תאריך מילוי: ${ed.formFillDate}</p>
      </div>

      <div style="margin-bottom: 20px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="font-size: 16px; margin-bottom: 12px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">2. דירוג ביצועים</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="text-align: right; padding: 8px; border: 1px solid #e2e8f0;">מדד</th>
              <th style="text-align: center; padding: 8px; border: 1px solid #e2e8f0;">ציון</th>
              <th style="text-align: right; padding: 8px; border: 1px solid #e2e8f0;">תיאור</th>
            </tr>
          </thead>
          <tbody>${scoreRows}</tbody>
        </table>
        <p style="margin-top: 12px; font-weight: bold;">ממוצע ציונים: ${avg.toFixed(1)}</p>
      </div>

      <div style="margin-bottom: 20px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="font-size: 16px; margin-bottom: 12px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">3. הערכה מילולית</h2>
        <p><strong>נקודות חוזקה:</strong> ${we.strengths}</p>
        <p><strong>נקודות לשיפור:</strong> ${we.improvements}</p>
        <p><strong>הערות כלליות:</strong> ${we.generalComments}</p>
        <p><strong>המלצת מנהל:</strong> ${RECOMMENDATION_LABELS[we.managerRecommendation]}</p>
      </div>

      <div style="margin-bottom: 20px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="font-size: 16px; margin-bottom: 12px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">4. שכר והמלצה</h2>
        <p>שכר נוכחי: ${sr.currentSalary.toLocaleString('he-IL')} ₪</p>
        <p>שכר מוצע: ${sr.proposedSalary.toLocaleString('he-IL')} ₪</p>
        <p>גובה העלאה: ${sr.raiseAmount.toLocaleString('he-IL')} ₪ (${sr.raisePercentage.toFixed(1)}%)</p>
        <p>תאריך תחילה: ${sr.newSalaryStartDate}</p>
        <p>נימוק: ${sr.raiseJustification}</p>
      </div>

      <div style="margin-bottom: 20px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="font-size: 16px; margin-bottom: 12px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">5. אישורים וחתימות</h2>
        ${approvalRows}
      </div>
    </div>
  `
}

function cleanupExportUI(overlay: HTMLElement, wrapper: HTMLElement): void {
  try {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay)
    if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper)
  } catch {
    // ignore
  }
}

export function exportToPdf(form: FormSubmission, thenOpenEmail = false): void {
  const html = buildPdfHtml(form)
  const filename = `הערכת-עובד-${form.employeeDetails.employeeName}-${format(new Date(), 'yyyy-MM-dd')}.pdf`

  const overlay = document.createElement('div')
  overlay.setAttribute('id', 'pdf-export-overlay')
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 99999; background: rgba(0,0,0,0.6);
    display: flex; align-items: center; justify-content: center;
    font-family: Arial,sans-serif; font-size: 18px; color: white;
  `
  overlay.innerHTML = '<div dir="rtl">מייצא PDF... אנא המתן</div>'

  const wrapper = document.createElement('div')
  wrapper.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; overflow: scroll;
    z-index: 99998; background: white;
  `

  const container = document.createElement('div')
  container.innerHTML = html
  container.style.cssText = `
    position: relative; width: 595px; min-height: 842px; background: white;
  `
  wrapper.appendChild(container)
  document.body.appendChild(wrapper)
  document.body.appendChild(overlay)

  const runExport = () => {
    html2pdf()
      .set({
        margin: 10,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(container)
      .save()
      .then(() => {
        cleanupExportUI(overlay, wrapper)
        if (thenOpenEmail) openEmailWithPdf(form, filename)
      })
      .catch((err: unknown) => {
        cleanupExportUI(overlay, wrapper)
        console.error('PDF export failed:', err)
      })
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setTimeout(runExport, 100)
    })
  })
}
