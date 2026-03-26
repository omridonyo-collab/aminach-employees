import * as XLSX from 'xlsx'
import type { FormSubmission } from '@/types'
import { PERFORMANCE_LABELS, RECOMMENDATION_LABELS, type PerformanceScores } from '@/types'

const STATUS_LABELS = {
  draft: 'טיוטה',
  pending_approval: 'ממתין לאישור',
  rejected: 'נדחה',
  approved: 'אושר סופית',
}

export function exportToExcel(form: FormSubmission): void {
  const ed = form.employeeDetails
  const we = form.writtenEvaluation
  const sr = form.salaryRecommendation
  const scores = form.performanceScores as PerformanceScores

  const rows = [
    ['שדה', 'ערך'],
    ['סטטוס', STATUS_LABELS[form.status]],
    ['שם העובד', ed.employeeName],
    ['מספר עובד', ed.employeeId],
    ['מחלקת מפעל', ed.plantDepartment],
    ['מחלקה', ed.department],
    ['תפקיד', ed.position],
    ['מנהל ישיר', ed.directManagerName],
    ['ותק', ed.tenureInCompany],
    ['תאריך מילוי', ed.formFillDate],
    [''],
    ...(Object.entries(scores).map(([k, v]) => [PERFORMANCE_LABELS[k as keyof PerformanceScores], v]) as [string, number][]),
    ['ממוצע', ((Object.values(scores) as number[]).reduce((a, b) => a + b, 0) / 8).toFixed(1)],
    [''],
    ['נקודות חוזקה', we.strengths],
    ['נקודות לשיפור', we.improvements],
    ['הערות כלליות', we.generalComments],
    ['המלצת מנהל', RECOMMENDATION_LABELS[we.managerRecommendation]],
    [''],
    ['שכר נוכחי', sr.currentSalary],
    ['שכר מוצע', sr.proposedSalary],
    ['גובה העלאה', sr.raiseAmount],
    ['אחוז העלאה', `${sr.raisePercentage.toFixed(1)}%`],
    ['תאריך תחילה', sr.newSalaryStartDate],
    ['נימוק', sr.raiseJustification],
    [''],
    ...form.approvalSteps.map((s, i) => [
      `אישור ${i + 1} - ${s.title}`,
      `${s.managerName} - ${s.status}${s.comment ? ` - ${s.comment}` : ''}`,
    ]),
  ]

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 25 }, { wch: 60 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'הערכת עובד')
  XLSX.writeFile(wb, `הערכת-עובד-${ed.employeeName}.xlsx`)
}

export function exportToCsv(form: FormSubmission): void {
  const ed = form.employeeDetails
  const csvRows: string[] = []
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  csvRows.push(['שם עובד', 'מספר עובד', 'מחלקה', 'תפקיד', 'שכר נוכחי', 'שכר מוצע', 'אחוז העלאה', 'המלצה', 'סטטוס'].map(escape).join(','))
  csvRows.push(
    [
      ed.employeeName,
      ed.employeeId,
      ed.department,
      ed.position,
      form.salaryRecommendation.currentSalary,
      form.salaryRecommendation.proposedSalary,
      `${form.salaryRecommendation.raisePercentage.toFixed(1)}%`,
      RECOMMENDATION_LABELS[form.writtenEvaluation.managerRecommendation],
      STATUS_LABELS[form.status],
    ].map(escape).join(',')
  )
  const blob = new Blob(['\ufeff' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `הערכת-עובד-${ed.employeeName}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}
