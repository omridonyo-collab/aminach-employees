import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { formSchema, type FormSchemaType } from '@/lib/validation'
import { formValuesToSubmission } from '@/lib/formToSubmission'
import { exportToPdf, printForm } from '@/lib/exportPdf'
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
  FileText, Eye, Mail, Printer, Send, CheckCircle2, RotateCcw
} from 'lucide-react'
import { useState, useCallback } from 'react'
import type { ApprovalStep, FormSubmission, FormStatus } from '@/types'
import { format } from 'date-fns'

// ─── init ─────────────────
const urlForm = decodeFormFromUrl()
const initialForm: FormSubmission = urlForm ?? { ...MOCK_FORM, id: `form-${Date.now()}` }

const defaultValues: FormSchemaType = {
  employeeDetails: initialForm.employeeDetails,
  performanceScores: initialForm.performanceScores,
  writtenEvaluation: initialForm.writtenEvaluation,
  salaryRecommendation: initialForm.salaryRecommendation,
}

// ─── Success Screen ───────────────────────────────────────────────────────────
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
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null)

  const {
    form,
    updateForm,
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

  const getFullSubmission = useCallback(() => {
    return formValuesToSubmission(methods.getValues(), form.approvalSteps, form.status)
  }, [methods, form.approvalSteps, form.status])

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
        const currentFieldSubmission = getFullSubmission()

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
    [form, currentStepIndex, updateForm, getFullSubmission]
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
          const updatedForm: FormSubmission = { ...form, ...submission, approvalSteps: freshSteps, status: 'pending_approval' as FormStatus, updatedAt: format(new Date(), 'yyyy-MM-dd') }
          updateForm(updatedForm)
          await sendApprovalRequestEmail(updatedForm, freshSteps[1])
          setSuccessInfo({ employeeName: values.employeeDetails.employee
