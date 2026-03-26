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
import { FileText, Eye, Mail, Printer, Send, CheckCircle2, RotateCcw } from 'lucide-react'
import { useState, useCallback } from 'react'
import type { ApprovalStep, FormSubmission, FormStatus } from '@/types'
import { format } from 'date-fns'

const urlForm = decodeFormFromUrl()
const initialForm: FormSubmission = urlForm ?? { ...MOCK_FORM, id: `form-${Date.now()}` }
const defaultValues: FormSchemaType = {
  employeeDetails: initialForm.employeeDetails,
  performanceScores: initialForm.performanceScores,
  writtenEvaluation: initialForm.writtenEvaluation,
  salaryRecommendation: initialForm.salaryRecommendation,
}

function SuccessScreen({ info, onReset }: { info: any, onReset: () => void }) {
  const [copied, setCopied] = useState(false)
  const copyLink = () => {
    navigator.clipboard?.writeText(info.formLink).then(() => { setCopied(true); setTimeout(() => setCopied(false), 3000); })
  }
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col" dir="rtl">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3">
        <h1 className="text-xl font-bold text-aminach-primary">המלצה לעדכון שכר – עמינח</h1>
      </div>
      <main className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">הפעולה בוצעה!</h2>
          <p className="text-slate-500 mb-6">הטופס עבור {info.employeeName} עודכן.</p>
          <div className="space-y-3">
            <Button onClick={copyLink} variant={copied ? "primary" : "outline"} className="w-full">
              {copied ? "הקישור הועתק!" : "העתק קישור למאשר"}
            </Button>
            <Button onClick={() => window.open(`mailto:${info.nextApproverEmail}`)} className="w-full">שלח מייל ל-{info.nextApproverName}</Button>
            <Button onClick={onReset} variant="ghost" className="w-full">חזרה לתפריט</Button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  const [showPreview, setShowPreview] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [successInfo, setSuccessInfo] = useState<any>(null)

  const { form, updateForm, handleSignatureSave, handleSignatureClear, resetToDraft } = useFormSubmission(urlForm ?? undefined)
  const methods = useForm<FormSchemaType>({ resolver: zodResolver(formSchema), defaultValues })

  const currentStepIndex = form.approvalSteps.findIndex((s) => s.status === 'pending')
  const formSectionsReadOnly = form.status === 'approved' || (form.status === 'pending_approval' && currentStepIndex === 2)

  const getFullSubmission = useCallback(() => {
    return formValuesToSubmission(methods.getValues(), form.approvalSteps, form.status)
  }, [methods, form.approvalSteps, form.status])

  const handleApprovalWithEmail = useCallback(async (stepId: string, status: 'approved' | 'rejected', comment?: string, targetNextEmail?: string) => {
    setIsSending(true)
    try {
      const steps = form.approvalSteps.map((s, idx) => {
        if (s.id === stepId) return { ...s, status, comment: comment ?? s.comment, signedAt: format(new Date(), 'yyyy-MM-dd HH:mm') }
        if (idx === currentStepIndex + 1 && targetNextEmail) return { ...s, managerEmail: targetNextEmail }
        return s
      })
      const allApproved = steps.every(s => s.status === 'approved')
      const newStatus: FormStatus = steps.some(s => s.status === 'rejected') ? 'rejected' : (allApproved ? 'approved' : 'pending_approval')
      const updatedForm = { ...form, ...getFullSubmission(), approvalSteps: steps, status: newStatus }
      updateForm(updatedForm)

      if (newStatus === 'approved') {
        await sendHrFinalEmail(updatedForm, targetNextEmail || '')
        setSuccessInfo({ employeeName: updatedForm.employeeDetails.employeeName, nextApproverName: 'HR', nextApproverEmail: targetNextEmail, formLink: encodeFormToUrl(updatedForm) })
      } else if (newStatus === 'pending_approval') {
        const next = steps[currentStepIndex + 1]
        await sendApprovalRequestEmail(updatedForm, next)
        setSuccessInfo({ employeeName: updatedForm.employeeDetails.employeeName, nextApproverName: next.managerName, nextApproverEmail: targetNextEmail || next.managerEmail, formLink: encodeFormToUrl(updatedForm) })
      }
    } finally { setIsSending(false) }
  }, [form, currentStepIndex, updateForm, getFullSubmission])

  const handleSendFromManager = (sig: string, name: string, email: string) => {
    methods.handleSubmit(async (values) => {
      setIsSending(true)
      const freshSteps: ApprovalStep[] = [
        { id: 'a1', title: 'מנהל ישיר', role: 'מנהל ישיר', status: 'approved', managerName: values.employeeDetails.directManagerName, managerEmail: '', comment: '', signedAt: format(new Date(), 'yyyy-MM-dd HH:mm'), signatureData: sig },
        { id: 'a2', title: 'מנהל בכיר', role: 'מנהל בכיר', status: 'pending', managerName: name, managerEmail: email, comment: '', signedAt: null, signatureData: null },
        { id: 'a3', title: 'מנכ"ל', role: 'מנכ"ל', status: 'pending', managerName: 'רונן בר שלום', managerEmail: '', comment: '', signedAt: null, signatureData: null },
      ]
      const updated = { ...form, ...formValuesToSubmission(values, freshSteps, 'pending_approval'), approvalSteps: freshSteps, status: 'pending_approval' as FormStatus }
      updateForm(updated)
      await sendApprovalRequestEmail(updated, freshSteps[1])
      setSuccessInfo({ employeeName: values.employeeDetails.employeeName, nextApproverName: name, nextApproverEmail: email, formLink: encodeFormToUrl(updated) })
      setIsSending(false)
    })()
  }

  if (successInfo) return <SuccessScreen info={successInfo} onReset={() => { setSuccessInfo(null); methods.reset(); resetToDraft(); }} />

  return (
    <div className="min-h-screen bg-slate-100" dir="rtl">
      <Header form={form} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        {statusMsg && <div className="mb-4 bg-green-50 p-3 rounded-lg text-green-800">{statusMsg}</div>}
        <FormProvider {...methods}>
          <form className="space-y-6">
            <fieldset disabled={formSectionsReadOnly} className={formSectionsReadOnly ? 'opacity-75 pointer-events-none' : ''}>
              <EmployeeDetailsSection /><PerformanceScoresSection /><WrittenEvaluationSection /><SalarySection />
            </fieldset>
            {form.status === 'draft' || form.status === 'rejected' ? (
              <ManagerDraftSection managerName={methods.watch('employeeDetails.directManagerName') || ''} onSubmit={handleSendFromManager} isSubmitting={isSending} />
            ) : (
              <ApprovalsSection formSubmission={{...form, ...getFullSubmission()}} onApprovalAction={handleApprovalWithEmail} onSignatureSave={handleSignatureSave} onSignatureClear={handleSignatureClear} isReadOnly={form.status === 'approved'} />
            )}
            <div className="flex gap-3 border-t pt-6">
              <Button type="button" variant="ghost" onClick={() => setShowPreview(true)}><Eye className="ml-2 h-4 w-4" />תצוגה מקדימה</Button>
              <Button type="button" variant="outline" onClick={() => exportToPdf({...form, ...getFullSubmission()})}><FileText className="ml-2 h-4 w-4" />PDF</Button>
              <Button type="button" variant="outline" onClick={() => printForm({...form, ...getFullSubmission()})}><Printer className="ml-2 h-4 w-4" />הדפס</Button>
            </div>
          </form>
        </FormProvider>
      </main>
      {showPreview && <PreviewModal form={{...form, ...getFullSubmission()}} onClose={() => setShowPreview(false)} />}
    </div>
  )
}
