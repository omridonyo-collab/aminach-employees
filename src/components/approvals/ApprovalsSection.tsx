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
    nextEmail?: string
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
  const [targetEmail, setTargetEmail] = useState('')
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
      <div className="space-y-6">
        {visibleSteps.map((step) => {
          const index = steps.indexOf(step)
          const isCurrentStep = index === currentStepIndex

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

              {/* שדה הזנת מייל ידני - מופיע לכל מאשר בתורו */}
              {canApprove && isCurrentStep && (
                <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <label className="mb-1 flex items-center gap-2 text-sm font-medium text-blue-800">
                    <Mail className="h-4 w-4" />
                    {isLastStep(index) 
                      ? "מייל משאבי אנוש לקבלת הטופס הסופי *" 
                      : "מייל המנכ\"ל לאישור סופי *"}
                  </label>
                  <input
                    type="email"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    placeholder="example@aminach.co.il"
                    dir="ltr"
                    className={inputClass}
                  />
                  {!targetEmail.trim() && (
                    <p className="mt-1 text-xs text-amber-600">
                      * חובה להזין כתובת מייל להמשך
                    </p>
                  )}
                </div>
              )}

              {/* כפתורי פעולה */}
              {canApprove && isCurrentStep && onApprovalAction && (
                <div className="mb-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onApprovalAction(step.id, 'approved', undefined, targetEmail)}
                    disabled={!targetEmail.trim()}
                    className="text-green-700"
                  >
                    <Check className="ml-1 h-4 w-4" />
                    אשר וחתום
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const comment = prompt('הערה לדחייה:')
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
                  <span className="font-medium">הערה: </span>{step.comment}
                </p>
              )}

              {step.signedAt && (
                <p className="mb-2 text-sm text-slate-500">תאריך: {step.signedAt}</p>
              )}

              {/* לוח חתימה */}
              {canApprove && isCurrentStep && onSignatureSave && (
                <div className="mt-3">
                  <label className="mb-2 block text-sm font-medium text-slate-700">חתימה דיגיטלית</label>
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

function ApprovalTimeline({ steps, currentStepIndex }: { steps: ApprovalStep[], currentStepIndex: number }) {
  const allApproved = steps.every((s) => s.status === 'approved')
  return (
    <div className="mt-6 border-t border-slate-200 pt-4 text-center">
      {allApproved ? (
        <p className="text-sm font-medium text-green-600">כל האישורים הושלמו בהצלחה!</p>
      ) : (
        <p className="text-sm text-slate-500">שלב {currentStepIndex + 1} מתוך {steps.length} בתהליך האישור</p>
      )}
    </div>
  )
}
