import { useState } from 'react'
import { SectionCard } from '@/components/ui/SectionCard'
import { SignaturePad } from '@/components/approvals/SignaturePad'
import { Button } from '@/components/ui/Button'
import { Check, X, Clock, Mail } from 'lucide-react'
import type { FormSubmission, ApprovalStep, ApprovalStatus } from '@/types'
import { cn } from '@/lib/utils'

const STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: 'ממתין',
  approved: 'אושר',
  rejected: 'נדחה',
}

interface ApprovalsSectionProps {
  formSubmission: FormSubmission
  onApprovalAction?: (
    stepId: string,
    status: 'approved' | 'rejected',
    comment?: string,
    nextApproverEmail?: string
  ) => void
  onSignatureSave?: (stepId: string, signatureData: string) => void
  onSignatureClear?: (stepId: string) => void
  isReadOnly?: boolean
}

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-right focus:border-aminach-accent focus:outline-none focus:ring-1 focus:ring-aminach-accent'

export function ApprovalsSection({
  formSubmission,
  onApprovalAction,
  onSignatureSave,
  onSignatureClear,
  isReadOnly = false,
}: ApprovalsSectionProps) {
  const [nextEmail, setNextEmail] = useState('')
  const steps = formSubmission.approvalSteps
  const currentStepIndex = steps.findIndex((s) => s.status === 'pending')
  
  const canApprove =
    formSubmission.status === 'pending_approval' &&
    !isReadOnly &&
    currentStepIndex >= 0

  const isLastStep = (index: number) => index === steps.length - 1

  const visibleSteps = steps.filter(
    (step, index) => step.status !== 'pending' || index === currentStepIndex
  )

  return (
    <SectionCard title="5. אישורים וחתימות">
      {/* תיקון לוגו שבור - במידה והוא מופיע כאן או בקומפוננטה אחרת, וודא שהנתיב מתחיל בשם הריפוזיטורי */}
      <div className="space-y-6">
        {visibleSteps.map((step) => {
          const index = steps.indexOf(step)
          const isCurrentStep = index === currentStepIndex
          
          // הגדרה: האם השלב הנוכחי דורש הזנת מייל? 
          // (כל שלב חוץ מהראשון, או לפי דרישתך - כאן הגדרתי שכל שלב פעיל יציג את זה)
          const needsEmailInput = canApprove && isCurrentStep;
          const emailLabel = isLastStep(index) 
            ? "מייל מחלקת משאבי האנוש לקבלת הטופס הסופי *" 
            : "מייל המאשר הבא (מנכ\"ל/הנהלה) להמשך התהליך *";

          return (
            <div
              key={step.id}
              className={cn(
                'rounded-lg border p-4',
                step.status === 'approved' && 'border-green-200 bg-green-50/50',
                step.status === 'rejected' && 'border-red-200 bg-red-50/50',
                step.status === 'pending' && 'border-slate-200 bg-slate-50/30'
              )}
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-aminach-primary">
                    {index + 1}. {step.title}
                  </h4>
                  <p className="text-sm text-slate-600">
                    {step.managerName} - {step.role}
                  </p>
                </div>
                <StatusBadge status={step.status} />
              </div>

              {/* שדה הזנת מייל - מופיע למאשר הנוכחי */}
              {needsEmailInput && (
                <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <label className="mb-1 flex items-center gap-2 text-sm font-medium text-blue-800">
                    <Mail className="h-4 w-4" />
                    {emailLabel}
                  </label>
                  <input
                    type="email"
                    value={nextEmail}
                    onChange={(e) => setNextEmail(e.target.value)}
                    placeholder="example@aminach.co.il"
                    dir="ltr"
                    className={inputClass}
                  />
                  {!nextEmail.trim() && (
                    <p className="mt-1 text-xs text-amber-600">
                      * שדה חובה להמשך התהליך
                    </p>
                  )}
                </div>
              )}

              {/* כפתורי אישור / דחייה */}
              {canApprove && isCurrentStep && onApprovalAction && (
                <div className="mb-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      onApprovalAction(
                        step.id,
                        'approved',
                        undefined,
                        nextEmail // שולח את המייל שהוזן ידנית
                      )
                    }
                    disabled={!nextEmail.trim()}
                    className="text-green-700"
                  >
                    <Check className="ml-1 h-4 w-4" />
                    אשר וחתום
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const comment = prompt('הכנס הערה לדחייה (אופציונלי):')
                      onApprovalAction(step.id, 'rejected', comment || undefined)
                    }}
                    className="text-red-700"
                  >
                    <X className="ml-1 h-4 w-4" />
                    דחה
                  </Button>
                </div>
              )}

              {step.comment && (
                <p className="mb-2 text-sm text-slate-600">
                  <span className="font-medium">הערה: </span>
                  {step.comment}
                </p>
              )}

              {step.signedAt && (
                <p className="mb-2 text-sm text-slate-500">תאריך: {step.signedAt}</p>
              )}

              {canApprove && isCurrentStep && onSignatureSave && (
                <div className="mt-3">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    חתימה דיגיטלית
                  </label>
                  <SignaturePad
                    savedSignature={step.signatureData}
                    onSave={(data) => onSignatureSave(step.id, data)}
                    onClear={onSignatureClear ? () => onSignatureClear(step.id) : undefined}
                  />
                </div>
              )}

              {step.signatureData && step.status !== 'pending' && (
                <div className="mt-3">
                  <label className="mb-2 block text-sm font-medium text-slate-700">חתימה</label>
                  <SignaturePad savedSignature={step.signatureData} onSave={() => {}} disabled />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ApprovalTimeline steps={steps} currentStepIndex={currentStepIndex} />
    </SectionCard>
  )
}

function StatusBadge({ status }: { status: ApprovalStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        status === 'approved' && 'bg-green-100 text-green-800',
        status === 'rejected' && 'bg-red-100 text-red-800',
        status === 'pending' && 'bg-amber-100 text-amber-800'
      )}
    >
      {status === 'approved' && <Check className="h-3 w-3" />}
      {status === 'rejected' && <X className="h-3 w-3" />}
      {status === 'pending' && <Clock className="h-3 w-3" />}
      {STATUS_LABELS[status]}
    </span>
  )
}

function ApprovalTimeline({
  steps,
  currentStepIndex,
}: {
  steps: ApprovalStep[]
  currentStepIndex: number
}) {
  const allApproved = steps.every((s) => s.status === 'approved')
  const anyRejected = steps.some((s) => s.status === 'rejected')
  const approvedCount = steps.filter((s) => s.status === 'approved').length

  return (
    <div className="mt-6 border-t border-slate-200 pt-4">
      <h4 className="mb-3 text-sm font-medium text-slate-700">מהלך האישורים</h4>
      <div className="flex items-center gap-2">
        {steps.map((step, i) => (
          <div key={step.id} className="flex flex-1 items-center">
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium',
                step.status === 'approved' && 'bg-green-500 text-white',
                step.status === 'rejected' && 'bg-red-500 text-white',
                step.status === 'pending' &&
                  i === currentStepIndex &&
                  'border-2 border-aminach-accent bg-white text-aminach-accent',
                step.status === 'pending' &&
                  i !== currentStepIndex &&
                  'bg-slate-200 text-slate-400'
              )}
            >
              {step.status === 'approved' ? '✓' : step.status === 'rejected' ? '✗' : i + 1}
            </div>
            <div
              className={cn(
                'h-0.5 flex-1',
                approvedCount > i ? 'bg-green-300' : 'bg-slate-200'
              )}
            />
          </div>
        ))}
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm',
            allApproved ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
          )}
        >
          {allApproved ? '✓' : '↪'}
        </div>
      </div>
    </div>
  )
}
