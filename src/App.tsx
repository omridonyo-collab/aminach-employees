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

// ─── init ─────────────────
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

function SuccessScreen({ info, onReset }: { info: SuccessInfo, onReset: () => void }) {
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
          <div className="rounded-2xl bg-white shadow-lg p-8 text-center">
            <div className="mb-5 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-slate-800">פעולה בוצעה בהצלחה!</h2>
            <p className="text-slate-500 mb-1">הטופס עבור <span className="font-semibold text-slate-700">{info.employeeName}</span> עודכן.</p>
            <p className="text-slate-500 font-medium">השלב הבא: {info.nextApproverName}</p>
          </div>
          <div className="mt-6 rounded-xl bg-white shadow p-6">
            <h3 className="mb-4 font-semibold text-slate-800 flex items-center gap-2">
              <Send className="h-4 w-4 text-aminach-accent" />
              שלח קישור ישירות ל-{info.nextApproverName}
            </h3>
            <div className="flex gap-2 mb-4">
              <div className="flex-1 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 truncate" dir="ltr">
                {info.formLink.slice(0, 60)}…
              </div>
              <Button type="button" variant={copied ? 'primary' : 'outline'} size="sm" onClick={copyLink}>
                {copied ? 'הועתק!' : 'העתק'}
              </Button>
            </div>
            <Button type="button" variant="primary" onClick={openMailTo} className="w-full">
              <Mail className="ml-2 h-4 w-4" />
              פתח מייל ל-{info.nextApproverEmail}
            </Button>
          </div>
          <div className="mt-6 text-center">
            <Button type="button" variant="outline" onClick={onReset}>חזרה לדף הבית</Button>
          </div>
        </div>
      </main>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
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

  const currentStepIndex = form.approvalSteps.findIndex((s) => s.status === 'pending')
  const formSectionsReadOnly = form.status === 'approved' || (form.status === 'pending_approval' && currentStepIndex === 2)

  // ── handle approval ────────────────────────────────────────────────────────────
  const handleApprovalWithEmail = useCallback(
    async (
      stepId: string,
      status: 'approved' | 'rejected',
      comment?: string,
      targetNextEmail?: string
    ) => {
      setIsSending(true)
      setStatusMsg(null)

      try {
        const currentValues = methods.getValues()
        const currentFieldSubmission = formValuesToSubmission(currentValues, form.approvalSteps, form.status)

        const steps: ApprovalStep[] = form.approvalSteps.map((s, idx) => {
          if (s.id === stepId) {
            return {
              ...s,
              status,
              comment: comment ?? s.comment,
              signedAt: format(new Date(), 'yyyy-MM-dd HH:mm'),
            }
          }
          if (idx === currentStepIndex + 1 && targetNextEmail) {
            return { ...s, managerEmail: targetNextEmail }
          }
          return s
        })

        const allApproved = steps.every((s) => s.status === 'approved')
        const anyRejected = steps.some((s) => s.status === 'rejected')
        const newStatus: FormStatus = anyRejected ? 'rejected' : allApproved ? 'approved' : 'pending_approval'

        const updatedForm: FormSubmission = {
          ...form,
          ...currentFieldSubmission,
          approvalSteps: steps,
          status: newStatus,
          updatedAt: format(new Date(), 'yyyy-MM-dd'),
        }

        updateForm(updatedForm)

        if (newStatus === 'rejected') {
          setStatusMsg(`⛔ הטופס נדחה`)
        } else if (newStatus === 'approved') {
          await sendHrFinalEmail(updatedForm, targetNextEmail || '')
          setSuccessInfo({
            employeeName: updatedForm.employeeDetails.employeeName,
            nextApproverName: 'משאבי אנוש',
            nextApproverEmail: targetNextEmail || '',
            formLink: encodeFormToUrl(updatedForm),
          })
        } else {
          const nextStep = steps[currentStepIndex + 1]
          if (nextStep) {
            await sendApprovalRequestEmail(updatedForm, nextStep)
            setSuccessInfo({
              employeeName: updatedForm.employeeDetails.employeeName,
              nextApproverName: nextStep.managerName || nextStep.title,
              nextApproverEmail: targetNextEmail || nextStep.managerEmail,
              formLink: encodeFormToUrl(updatedForm),
            })
          }
        }
      } catch (error) {
        console.error("Error in approval:", error)
        alert("אירעה שגיאה בתהליך האישור.")
      } finally {
        setIsSending(false)
      }
    },
    [form, currentStepIndex, updateForm, methods]
  )

  const handleSendFromManager = useCallback(
    (signature: string, deptManagerName: string, deptManagerEmail: string) => {
      methods.handleSubmit(async (values) => {
        setIsSending(true)
        try {
          const freshSteps: ApprovalStep[] = [
            { id: 'a1', title: 'מנהל ישיר', role: 'מנהל ישיר', status: 'approved', managerName: values.employeeDetails.directManagerName, managerEmail: '', comment: '', signedAt: format(new Date(), 'yyyy-MM-dd HH:mm'), signatureData: signature },
            { id: 'a2', title: 'מנהל בכיר', role: 'מנהל בכיר', status: 'pending', managerName: deptManagerName, managerEmail: deptManagerEmail, comment: '', signedAt: null, signatureData: null },
            { id: 'a3', title: 'מנכ"ל', role: 'מנכ"ל', status: 'pending', managerName: 'רונן בר שלום', managerEmail: '', comment: '', signedAt: null, signatureData: null },
          ]
          const submission = formValuesToSubmission(values, freshSteps, 'pending_approval')
          const updatedForm: FormSubmission = { ...form, ...submission, approvalSteps: freshSteps, status: 'pending_approval', updatedAt: format(new Date(), 'yyyy-MM-dd') }
          updateForm(updatedForm)
          await sendApprovalRequestEmail(updatedForm, freshSteps[1])
          setSuccessInfo({ employeeName: values.employeeDetails.employeeName, nextApproverName: deptManagerName, nextApproverEmail: deptManagerEmail, formLink: encodeFormToUrl(updatedForm) })
        } finally { setIsSending(false) }
      })()
    }, [form, methods, updateForm]
  )

  const handleSaveDraft = () => {
    const values = methods.getValues()
    const submission = formValuesToSubmission(values, form.approvalSteps, 'draft')
    updateForm(submission); setStatusMsg('הטיוטה נשמרה')
  }

  const handleClearForm = () => { if (confirm('לנקות טופס?')) { methods.reset(defaultValues); resetToDraft(); setStatusMsg(null); setSuccessInfo(null); } }
  const getFullSubmission = () => formValuesToSubmission(methods.getValues(), form.approvalSteps, form.status)
  const handleExportPdf = () => exportToPdf({ ...form, ...getFullSubmission() })
  const handlePrint = () => printForm({ ...form, ...getFullSubmission() })
  const handlePreview = () => { updateForm(getFullSubmission()); setShowPreview(true) }

  const copyApprovalLink = useCallback(() => {
    const link = encodeFormToUrl({ ...form, ...getFullSubmission() })
    navigator.clipboard?.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }, [form, methods])

  if (successInfo) return <SuccessScreen info={successInfo} onReset={() => { setSuccessInfo(null); methods.reset(defaultValues); resetToDraft(); }} />

  return (
    <div className="min-h-screen bg-slate-100" dir="rtl">
      <Header form={form} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        {statusMsg && <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"><CheckCircle2 className="h-4 w-4" />{statusMsg}</div>}
        <FormProvider {...methods}>
          <form className="space-y-6">
            <fieldset disabled={formSectionsReadOnly} className={formSectionsReadOnly ? 'pointer-events-none opacity-75' : ''}>
              <div className="space-y-6">
                <EmployeeDetailsSection />
                <PerformanceScoresSection />
                <WrittenEvaluationSection />
                <SalarySection />
              </div>
            </fieldset>

            {form.status === 'draft' || form.status === 'rejected' ? (
              <ManagerDraftSection managerName={methods.watch('employeeDetails.directManagerName') ?? ''} onSubmit={handleSendFromManager} isSubmitting={isSending} />
            ) : (
              <ApprovalsSection 
                formSubmission={{...form, ...getFullSubmission()}} 
                onApprovalAction={handleApprovalWithEmail} 
                onSignatureSave={handleSignatureSave} 
                onSignatureClear={handleSignatureClear} 
                isReadOnly={form.status === 'approved'} 
              />
            )}

            <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-6">
              <Button type="button" variant="ghost" onClick={handlePreview}><Eye className="ml-2 h-4 w-4" />תצוגה מקדימה</Button>
              <Button type="button" variant="outline" onClick={handleExportPdf}><FileText className="ml-2 h-4 w-4" />ייצא PDF</Button>
              <Button type="button" variant="outline" onClick={handlePrint}><Printer className="ml-2 h-4 w-4" />הדפס</Button>
            </div>
          </form>
        </FormProvider>
      </main>
      {showPreview && <PreviewModal form={{...form, ...getFullSubmission()}} onClose={() => setShowPreview(false)} />}
    </div>
  )
}
