import type { ReactNode } from 'react'
import type { FormSubmission } from '@/types'
import {
  PERFORMANCE_LABELS,
  RECOMMENDATION_LABELS,
  SCORE_LABELS,
  type PerformanceScores,
} from '@/types'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const STATUS_LABELS = {
  draft: 'טיוטה',
  pending_approval: 'ממתין לאישור',
  rejected: 'נדחה',
  approved: 'אושר סופית',
}

const APPROVAL_STATUS = {
  pending: 'ממתין',
  approved: 'אושר',
  rejected: 'נדחה',
}

interface PreviewModalProps {
  form: FormSubmission
  onClose: () => void
}

export function PreviewModal({ form, onClose }: PreviewModalProps) {
  const ed = form.employeeDetails
  const scores = form.performanceScores as PerformanceScores
  const we = form.writtenEvaluation
  const sr = form.salaryRecommendation
  const avg = (Object.values(scores) as number[]).reduce((a, b) => a + b, 0) / 8

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl"
        dir="rtl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 className="text-xl font-bold text-aminach-primary">תצוגה מקדימה</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm font-medium text-slate-500">סטטוס</p>
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-sm font-medium',
                  form.status === 'approved' && 'bg-green-100 text-green-800',
                  form.status === 'rejected' && 'bg-red-100 text-red-800',
                  form.status === 'pending_approval' && 'bg-amber-100 text-amber-800',
                  form.status === 'draft' && 'bg-slate-100 text-slate-700'
                )}
              >
                {STATUS_LABELS[form.status]}
              </span>
            </div>

            <PreviewSection title="1. פרטי עובד">
              <p>שם: {ed.employeeName}</p>
              <p>מספר עובד: {ed.employeeId}</p>
              <p>מחלקת מפעל: {ed.plantDepartment}</p>
              <p>מחלקה: {ed.department}</p>
              <p>תפקיד: {ed.position}</p>
              <p>מנהל ישיר: {ed.directManagerName}</p>
              <p>ותק: {ed.tenureInCompany}</p>
              <p>תאריך מילוי: {ed.formFillDate}</p>
            </PreviewSection>

            <PreviewSection title="2. דירוג ביצועים">
              {(Object.entries(scores) as [keyof PerformanceScores, number][]).map(([k, v]) => (
                <p key={k}>
                  {PERFORMANCE_LABELS[k]}: {v} - {SCORE_LABELS[v]}
                </p>
              ))}
              <p className="mt-2 font-semibold">ממוצע: {avg.toFixed(1)}</p>
            </PreviewSection>

            <PreviewSection title="3. הערכה מילולית">
              <p><strong>חוזקות:</strong> {we.strengths}</p>
              <p><strong>שיפורים:</strong> {we.improvements}</p>
              <p><strong>הערות:</strong> {we.generalComments}</p>
              <p><strong>המלצה:</strong> {RECOMMENDATION_LABELS[we.managerRecommendation]}</p>
            </PreviewSection>

            <PreviewSection title="4. שכר">
              <p>שכר נוכחי: {sr.currentSalary.toLocaleString('he-IL')} ₪</p>
              <p>שכר מוצע: {sr.proposedSalary.toLocaleString('he-IL')} ₪</p>
              <p>העלאה: {sr.raiseAmount.toLocaleString('he-IL')} ₪ ({sr.raisePercentage.toFixed(1)}%)</p>
              <p>תאריך תחילה: {sr.newSalaryStartDate}</p>
              <p>נימוק: {sr.raiseJustification}</p>
            </PreviewSection>

            <PreviewSection title="5. אישורים">
              {form.approvalSteps.map((s, i) => (
                <div key={s.id} className="mb-3">
                  <p className="font-medium">{i + 1}. {s.title} - {s.managerName}</p>
                  <p className="text-sm text-slate-600">סטטוס: {APPROVAL_STATUS[s.status]}</p>
                  {s.comment && <p className="text-sm">הערה: {s.comment}</p>}
                  {s.signatureData && (
                    <img src={s.signatureData} alt="חתימה" className="mt-1 h-12 object-contain" />
                  )}
                </div>
              ))}
            </PreviewSection>
          </div>
        </div>
        <div className="border-t border-slate-200 p-4">
          <Button onClick={onClose}>סגור</Button>
        </div>
      </div>
    </div>
  )
}

function PreviewSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <h3 className="mb-3 border-b border-slate-100 pb-2 font-semibold text-aminach-primary">
        {title}
      </h3>
      <div className="space-y-1 text-sm text-slate-700">{children}</div>
    </div>
  )
}
