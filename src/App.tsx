import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { formSchema, type FormSchemaType } from '@/lib/validation'
import { formValuesToSubmission } from '@/lib/formToSubmission'
import { exportToPdf, printForm } from '@/lib/exportPdf'
import { exportToExcel, exportToCsv } from '@/lib/exportCsv'
import { useFormSubmission } from '@/hooks/useFormSubmission'
import { MOCK_FORM } from '@/data/mockData'
import { decodeFormFromUrl, encodeFormToUrl } from '@/lib/formUrlEncoder'
import { sendApprovalRequestEmail, sendHrFinalEmail } from '@/lib/emailService'
import { Header } from '@/components/layout/Header'
import { EmployeeDetailsSection } from '@/components/form/EmployeeDetailsSection'
import { PerformanceScoresSection } from '@/components/form/PerformanceScoresSection'
import { WrittenEvaluationSection } from '@/components/form/WrittenEvaluationSection'
import { SalarySection } from '@/components/form/SalarySection'
import { ApprovalsSection } from '@/components/approvals/ApprovalsSection'
import { ManagerDraftSection } from '@/components/approvals/ManagerDraftSection'
import { PreviewModal } from '@/components/preview/PreviewModal'
import { Button } from '@/components/ui/Button'
import {
  Save, FileText, FileSpreadsheet, Eye,
  RotateCcw, Trash2, Mail, Printer, Copy, Check,
  CheckCircle2, Send, AlertCircle,
} from 'lucide-react'
import { useState, useCallback } from 'react'
import type { ApprovalStep, FormSubmission, FormStatus } from '@/types'
import { format } from 'date-fns'

// ─── helpers ──────────────────────────────────────────────────────────────────

function getFirstErrorPath(obj: object, prefix = ''): string | null {
  for (const [key, val] of Object.entries(obj)) {
    if (val?.message) return prefix ? `${prefix}.${key}` : key
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const nested = getFirstErrorPath(val as object, prefix ? `${prefix}.${key}` : key)
      if (nested) return nested
    }
  }
  return null
}

function getNestedValue(obj: object, path: string): unknown {
  return path.split('.').reduce((o: unknown, k) => (o as Record<string, unknown>)?.[k], obj)
}

// ─── init: אם יש טופס מה-URL נטען אותו, אחרת מצב ברירת מחדל ─────────────────

const urlForm = decodeFormFromUrl()
const initialForm: FormSubmission = urlForm ?? { ...MOCK_FORM, id: `form-${Date.now()}` }

const defaultValues: FormSchemaType = {
  employeeDetails: initialForm.employeeDetails,
  performanceScores: initialForm.performanceScores,
  writtenEvaluation: initialForm.writtenEvaluation,
  salaryRecommendation: initialForm.salaryRecommendation,
}

// ─── מסך הצלחה ────────────────────────────────────────────────────────────────

interface SuccessInfo {
  employeeName: string
  nextApproverName: string
  nextApproverEmail: string
  formLink: string
}

function SuccessScreen({
  info,
  onReset,
}: {
  info: SuccessInfo
  onReset: () => void
}) {
  const [copied, setCopied] = useState(false)

  const copyLink = () => {
    navigator.clipboard?.writeText(info.formLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    })
  }

  const openMailTo = () => {
    const subject = encodeURIComponent(`לאישורך – טופס הערכת עובד עבור ${info.employeeName}`)
    window.open(`mailto:${info.nextApproverEmail}?subject=${subject}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col" dir="rtl">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-aminach-accent">
          <span className="text-lg font-bold text-white">ע</span>
        </div>
        <h1 className="text-xl font-bold text-aminach-primary">המלצה לעדכון שכר / תנאים – עמינח</h1>
      </div>

      <main className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* כרטיס הצלחה */}
          <div className="rounded-2xl bg-white shadow-lg p-8 text-center">
            <div className="mb-5 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-slate-800">הטופס נשלח בהצלחה!</h2>
            <p className="text-slate-500 mb-1">
              הערכת העובד עבור{' '}
              <span className="font-semibold text-slate-700">{info.employeeName}</span>
            </p>
            <p className="text-slate-500">
              ממתינה לאישור{' '}
              <span className="font-semibold text-aminach-primary">{info.nextApproverName}</span>
            </p>
          </div>

          {/* שלח את הקישור */}
          <div className="mt-6 rounded-xl bg-white shadow p-6">
            <h3 className="mb-1 font-semibold text-slate-800 flex items-center gap-2">
              <Send className="h-4 w-4 text-aminach-accent" />
              שלח את הקישור ל-{info.nextApproverName}
            </h3>
            <p className="mb-4 text-sm text-slate-500">
              שלח את הקישור הבא ל-
              <span className="font-medium text-slate-700"> {info.nextApproverEmail}</span>
            </p>

            {/* קישור + כפתור העתקה */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 truncate" dir="ltr">
                {info.formLink.slice(0, 60)}…
              </div>
              <Button
                type="button"
                variant={copied ? 'primary' : 'outline'}
                size="sm"
                onClick={copyLink}
                className="shrink-0"
              >
                {copied ? (
                  <><Check className="ml-1 h-4 w-4" />הועתק!</>
                ) : (
                  <><Copy className="ml-1 h-4 w-4" />העתק</>
                )}
              </Button>
            </div>

            {/* פתח תוכנת מייל */}
            <Button
              type="button"
              variant="primary"
              onClick={openMailTo}
              className="w-full"
            >
              <Mail className="ml-2 h-4 w-4" />
              פתח מייל ל-{info.nextApproverName}
            </Button>
            <p className="mt-2 text-center text-xs text-slate-400">
              העתק את הקישור למעלה והדבק בגוף המייל
            </p>
          </div>

          {/* הגדרת EmailJS */}
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 mb-1">
                  רוצה שהמייל יישלח אוטומטית?
                </p>
                <p className="text-amber-700">
                  הגדר EmailJS כדי לשלוח מיילים אוטומטיים ללא צורך להעתיק קישורים.{' '}
                  <a
                    href="https://emailjs.com"
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-medium"
                  >
                    פתח emailjs.com →
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* כפתור מילוי טופס חדש */}
          <div className="mt-6 text-center">
            <Button type="button" variant="outline" onClick={onReset}>
              <RotateCcw className="ml-2 h-4 w-4" />
              מלא טופס חדש לעובד אחר
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

// ─── component ────────────────────────────────────────────────────────────────

export default function App() {
  const [showPreview, setShowPreview] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null)

  const {
    form,
    updateForm,
    handleApproval,
    handleSignatureSave,
    handleSignatureClear,
    resetToDraft,
  } = useFormSubmission(urlForm ?? undefined)

  const methods = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  // ── determine current step ──────────────────────────────────────────────────
  const currentStepIndex = form.approvalSteps.findIndex((s) => s.status === 'pending')
  const isCeoTurn = form.status === 'pending_approval' && currentStepIndex === 2
  const formSectionsReadOnly = form.status === 'approved' || isCeoTurn

  // ── step 1: direct manager submits form ─────────────────────────────────────
  const handleSendFromManager = useCallback(
    (signature: string, deptManagerName: string, deptManagerEmail: string) => {
      methods.handleSubmit(
        async (values) => {
          setIsSending(true)
          setStatusMsg(null)
          try {
            const freshSteps: ApprovalStep[] = [
              {
                id: 'a1',
                title: 'מנהל ישיר',
                role: 'מנהל ישיר',
                status: 'approved',
                managerName: values.employeeDetails.directManagerName,
                managerEmail: '',
                comment: '',
                signedAt: format(new Date(), 'yyyy-MM-dd HH:mm'),
                signatureData: signature,
              },
              {
                id: 'a2',
                title: 'מנהל בכיר',
                role: 'מנהל בכיר',
                status: 'pending',
                managerName: deptManagerName,
                managerEmail: deptManagerEmail,
                comment: '',
                signedAt: null,
                signatureData: null,
              },
              {
                id: 'a3',
                title: 'מנכ"ל',
                role: 'מנכ"ל',
                status: 'pending',
                managerName: 'רונן בר שלום',
                managerEmail: import.meta.env.VITE_CEO_EMAIL ?? '',
                comment: '',
                signedAt: null,
                signatureData: null,
              },
            ]

            const submission = formValuesToSubmission(values, freshSteps, 'pending_approval')
            const updatedForm: FormSubmission = {
              ...form,
              ...submission,
              approvalSteps: freshSteps,
              status: 'pending_approval',
              updatedAt: format(new Date(), 'yyyy-MM-dd'),
            }

            updateForm({
              ...submission,
              approvalSteps: freshSteps,
              status: 'pending_approval',
            })

            const formLink = encodeFormToUrl(updatedForm)

            // שלח מייל למנהל המחלקה (EmailJS אם מוגדר, אחרת fallback)
            await sendApprovalRequestEmail(updatedForm, freshSteps[1])

            // הצג מסך הצלחה עם הקישור
            setSuccessInfo({
              employeeName: values.employeeDetails.employeeName,
              nextApproverName: deptManagerName,
              nextApproverEmail: deptManagerEmail,
              formLink,
            })
          } finally {
            setIsSending(false)
          }
        },
        (err) => {
          const firstPath = getFirstErrorPath(err)
          const firstError = firstPath ? getNestedValue(err, firstPath) : null
          const msg =
            (firstError as { message?: string })?.message ?? 'יש למלא את כל השדות הנדרשים'
          alert(`שגיאה: ${msg}\n\nגלול למעלה לבדוק את השדות המסומנים באדום.`)
          if (firstPath) methods.setFocus(firstPath as Parameters<typeof methods.setFocus>[0])
        }
      )()
    },
    [form, methods, updateForm]
  )

  // ── save draft ──────────────────────────────────────────────────────────────
  const handleSaveDraft = () => {
    const values = methods.getValues()
    if (!formSchema.safeParse(values).success) {
      methods.handleSubmit(() => {}, (err) => console.log('Validation errors:', err))()
      return
    }
    const submission = formValuesToSubmission(values, form.approvalSteps, 'draft')
    updateForm(submission)
    setStatusMsg('הטיוטה נשמרה')
  }

  // ── handle approval (with email) ────────────────────────────────────────────
  const handleApprovalWithEmail = useCallback(
    async (
      stepId: string,
      status: 'approved' | 'rejected',
      comment?: string,
      hrEmail?: string
    ) => {
      const currentValues = methods.getValues()
      const currentFieldSubmission = formValuesToSubmission(
        currentValues,
        form.approvalSteps,
        form.status
      )

      const steps: ApprovalStep[] = form.approvalSteps.map((s) =>
        s.id === stepId
          ? {
              ...s,
              status,
              comment: comment ?? s.comment,
              signedAt: format(new Date(), 'yyyy-MM-dd HH:mm'),
            }
          : s
      )

      const allApproved = steps.every((s) => s.status === 'approved')
      const anyRejected = steps.some((s) => s.status === 'rejected')
      const newStatus: FormStatus = anyRejected
        ? 'rejected'
        : allApproved
          ? 'approved'
          : 'pending_approval'

      handleApproval(stepId, status, comment)
      updateForm(currentFieldSubmission)

      const updatedForm: FormSubmission = {
        ...form,
        ...currentFieldSubmission,
        approvalSteps: steps,
        status: newStatus,
        updatedAt: format(new Date(), 'yyyy-MM-dd'),
      }

      setIsSending(true)
      setStatusMsg(null)
      try {
        if (newStatus === 'approved') {
          const result = await sendHrFinalEmail(updatedForm, hrEmail ?? '')
          setStatusMsg(
            result.success
              ? `✅ כל האישורים הושלמו! הטופס נשלח ל-${hrEmail}`
              : `⚠️ הטופס אושר אך ${result.message}`
          )
        } else if (newStatus === 'pending_approval') {
          const nextApprover = steps.find((s) => s.status === 'pending')
          if (nextApprover) {
            const result = await sendApprovalRequestEmail(updatedForm, nextApprover)
            setStatusMsg(
              result.success
                ? `✅ אישורך נרשם! ${result.message}`
                : `⚠️ אישורך נרשם אך ${result.message}`
            )
          }
        } else if (newStatus === 'rejected') {
          setStatusMsg(
            `⛔ הטופס נדחה ע"י ${steps.find((s) => s.id === stepId)?.managerName ?? 'מאשר'}`
          )
        }
      } finally {
        setIsSending(false)
      }
    },
    [form, handleApproval, updateForm, methods]
  )

  // ── clear form ──────────────────────────────────────────────────────────────
  const handleClearForm = () => {
    if (confirm('האם אתה בטוח שברצונך לנקות את הטופס?')) {
      methods.reset(defaultValues)
      resetToDraft()
      setStatusMsg(null)
      setSuccessInfo(null)
    }
  }

  // ── exports ─────────────────────────────────────────────────────────────────
  const getFullSubmission = () => {
    const values = methods.getValues()
    return formValuesToSubmission(values, form.approvalSteps, form.status)
  }
  const handleExportPdf = () => exportToPdf({ ...form, ...getFullSubmission(), id: form.id })
  const handleExportPdfAndEmail = () =>
    exportToPdf({ ...form, ...getFullSubmission(), id: form.id }, true)
  const handlePrint = () => printForm({ ...form, ...getFullSubmission(), id: form.id })
  const handleExportExcel = () => exportToExcel({ ...form, ...getFullSubmission(), id: form.id })
  const handleExportCsv = () => exportToCsv({ ...form, ...getFullSubmission(), id: form.id })

  const handlePreview = () => {
    const values = methods.getValues()
    const submission = formValuesToSubmission(values, form.approvalSteps, form.status)
    updateForm({ ...submission })
    setShowPreview(true)
  }

  // ── approval link copy ──────────────────────────────────────────────────────
  const nextApprover = form.approvalSteps.find((s) => s.status === 'pending')
  const copyApprovalLink = useCallback(() => {
    const values = methods.getValues()
    const submission = formValuesToSubmission(values, form.approvalSteps, form.status)
    const fullForm: FormSubmission = { ...form, ...submission, id: form.id }
    const link = encodeFormToUrl(fullForm)
    navigator.clipboard?.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [form, methods])

  const currentFormForPreview = {
    ...form,
    ...getFullSubmission(),
    id: form.id,
  }

  // ─── מסך הצלחה לאחר שליחת הטופס ───────────────────────────────────────────
  if (successInfo) {
    return (
      <SuccessScreen
        info={successInfo}
        onReset={() => {
          setSuccessInfo(null)
          methods.reset(defaultValues)
          resetToDraft()
        }}
      />
    )
  }

  const isDraftOrRejected = form.status === 'draft' || form.status === 'rejected'

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-100" dir="rtl">
      <Header form={form} />

      <main className="mx-auto max-w-4xl px-4 py-8">

        {statusMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {statusMsg}
          </div>
        )}

        {form.status === 'pending_approval' && (
          <div className="mb-4 rounded-xl border border-aminach-accent/30 bg-aminach-light/30 px-4 py-3 text-sm text-aminach-primary">
            {currentStepIndex === 1 && (
              <span>
                <strong>מנהל מחלקה</strong> – ניתן לערוך את הטופס ולחתום עליו לפני שליחה למנכ&quot;ל.
              </span>
            )}
            {isCeoTurn && (
              <span>
                <strong>מנכ&quot;ל – רונן בר שלום</strong> – הטופס מוכן עם שתי חתימות. חתום והזן מייל HR.
              </span>
            )}
          </div>
        )}

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(() => {})} className="space-y-6">

            <fieldset
              disabled={formSectionsReadOnly}
              className={formSectionsReadOnly ? 'pointer-events-none opacity-75' : ''}
            >
              <div className="space-y-6">
                <EmployeeDetailsSection />
                <PerformanceScoresSection />
                <WrittenEvaluationSection />
                <SalarySection />
              </div>
            </fieldset>

            {isDraftOrRejected ? (
              <ManagerDraftSection
                managerName={methods.watch('employeeDetails.directManagerName') ?? ''}
                onSubmit={handleSendFromManager}
                isSubmitting={isSending}
              />
            ) : (
              <ApprovalsSection
                formSubmission={currentFormForPreview}
                onApprovalAction={handleApprovalWithEmail}
                onSignatureSave={handleSignatureSave}
                onSignatureClear={handleSignatureClear}
                isReadOnly={form.status === 'approved'}
              />
            )}

            {form.status === 'pending_approval' && nextApprover && (
              <div className="rounded-xl border border-aminach-accent/30 bg-aminach-light/30 p-4">
                <div className="mb-2 font-medium text-aminach-primary">
                  קישור לשליחה ידנית ל-{nextApprover.managerName} ({nextApprover.title})
                </div>
                <p className="mb-2 text-sm text-slate-500">
                  אם המייל לא הגיע, ניתן להעתיק ולשלוח ישירות:
                </p>
                <Button type="button" variant="outline" size="sm" onClick={copyApprovalLink}>
                  {copied ? (
                    <><Check className="ml-1 h-4 w-4 text-green-600" />הועתק</>
                  ) : (
                    <><Copy className="ml-1 h-4 w-4" />העתק קישור</>
                  )}
                </Button>
              </div>
            )}

            <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-6">
              {form.status === 'draft' && (
                <Button type="button" variant="outline" onClick={handleSaveDraft}>
                  <Save className="ml-2 h-4 w-4" />
                  שמור טיוטה
                </Button>
              )}
              {form.status === 'rejected' && (
                <Button type="button" variant="outline" onClick={resetToDraft}>
                  <RotateCcw className="ml-2 h-4 w-4" />
                  החזר לטיוטה
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={handleClearForm}>
                <Trash2 className="ml-2 h-4 w-4" />
                נקה טופס
              </Button>
              <Button type="button" variant="ghost" onClick={handlePreview}>
                <Eye className="ml-2 h-4 w-4" />
                תצוגה מקדימה
              </Button>
              <Button type="button" variant="outline" onClick={handleExportPdf}>
                <FileText className="ml-2 h-4 w-4" />
                ייצא PDF
              </Button>
              <Button type="button" variant="outline" onClick={handleExportPdfAndEmail}>
                <Mail className="ml-2 h-4 w-4" />
                PDF + מייל
              </Button>
              <Button type="button" variant="outline" onClick={handlePrint}>
                <Printer className="ml-2 h-4 w-4" />
                הדפס
              </Button>
              <Button type="button" variant="outline" onClick={handleExportExcel}>
                <FileSpreadsheet className="ml-2 h-4 w-4" />
                Excel
              </Button>
              <Button type="button" variant="outline" onClick={handleExportCsv}>
                CSV
              </Button>
            </div>
          </form>
        </FormProvider>
      </main>

      {showPreview && (
        <PreviewModal
          form={currentFormForPreview}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}
