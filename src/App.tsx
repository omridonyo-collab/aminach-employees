import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { formSchema, type FormSchemaType } from '@/lib/validation'
import { formValuesToSubmission } from '@/lib/formToSubmission'
import { exportToPdf, printForm } from '@/lib/exportPdf'
import { useFormSubmission } from '@/hooks/useFormSubmission'
import { MOCK_FORM } from '@/data/mockData'
import { decodeFormFromUrl } from '@/lib/formUrlEncoder'
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
import { FileText, Eye, Printer, CheckCircle2, AlertTriangle } from 'lucide-react'
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

export default function App() {
  const [showPreview, setShowPreview] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [successInfo, setSuccessInfo] = useState<{ employeeName: string } | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { form, updateForm, handleSignatureSave, handleSignatureClear, resetToDraft } = useFormSubmission(urlForm ?? undefined)
  const methods = useForm<FormSchemaType>({ resolver: zodResolver(formSchema), defaultValues })

  const currentStepIndex = form.approvalSteps.findIndex((s) => s.status === 'pending')
  const formSectionsReadOnly = form.status === 'approved' || (form.status === 'pending_approval' && currentStepIndex === 2)

  const getFullSubmission = useCallback(() => {
    return formValuesToSubmission(methods.getValues(), form.approvalSteps, form.status)
  }, [methods, form.approvalSteps, form.status])

  const handleApprovalWithEmail = useCallback(async (stepId: string, status: 'approved' | 'rejected', comment?: string, targetNextEmail?: string) => {
    setIsSending(true);
    setErrorMessage(null);
    try {
      const steps = form.approvalSteps.map((s, idx) => {
        if (s.id === stepId) return { ...s, status, comment: comment ?? s.comment, signedAt: format(new Date(), 'yyyy-MM-dd HH:mm') }
        if (idx === currentStepIndex + 1 && targetNextEmail) return { ...s, managerEmail: targetNextEmail }
        return s
      });
      const allApproved = steps.every(s => s.status === 'approved');
      const newStatus: FormStatus = steps.some(s => s.status === 'rejected') ? 'rejected' : (allApproved ? 'approved' : 'pending_approval');
      const updatedForm = { ...form, ...getFullSubmission(), approvalSteps: steps, status: newStatus };
      
      if (newStatus === 'approved') {
        await sendHrFinalEmail(updatedForm);
      } else if (newStatus === 'pending_approval') {
        await sendApprovalRequestEmail(updatedForm, steps[currentStepIndex + 1]);
      }
      updateForm(updatedForm);
      setSuccessInfo({ employeeName: updatedForm.employeeDetails.employeeName });
    } catch (error) {
      setErrorMessage("שגיאה בשליחת המייל. נסה שוב.");
    } finally { setIsSending(false); }
  }, [form, currentStepIndex, updateForm, getFullSubmission]);

  const handleSendFromManager = (sig: string, name: string, email: string) => {
    methods.handleSubmit(async (values) => {
      setIsSending(true);
      setErrorMessage(null);
      try {
        const freshSteps: ApprovalStep[] = [
          { id: 'a1', title: 'מנהל ישיר', role: 'מנהל ישיר', status: 'approved', managerName: values.employeeDetails.directManagerName, managerEmail: '', comment: '', signedAt: format(new Date(), 'yyyy-MM-dd HH:mm'), signatureData: sig },
          { id: 'a2', title: 'מנהל בכיר', role: 'מנהל בכיר', status: 'pending', managerName: name, managerEmail: email, comment: '', signedAt: null, signatureData: null },
          { id: 'a3', title: 'מנכ"ל', role: 'מנכ"ל', status: 'pending', managerName: 'רונן בר שלום', managerEmail: 'ronen@aminach.co.il', comment: '', signedAt: null, signatureData: null },
        ];
        const updated = { ...form, ...formValuesToSubmission(values, freshSteps, 'pending_approval'), approvalSteps: freshSteps, status: 'pending_approval' as FormStatus };
        await sendApprovalRequestEmail(updated, freshSteps[1]);
        updateForm(updated);
        setSuccessInfo({ employeeName: values.employeeDetails.employeeName });
      } catch (error) {
        setErrorMessage("נכשלה שליחת המייל הראשוני למנהל.");
      } finally { setIsSending(false); }
    })();
  };

  if (successInfo) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-8 text-center border-t-8 border-green-500">
        <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-2 text-slate-800">נחתם ונשלח!</h2>
        <p className="text-slate-600 mb-8 text-lg">הטופס של <strong>{successInfo.employeeName}</strong> הועבר בהצלחה.</p>
        <Button onClick={() => { setSuccessInfo(null); methods.reset(); resetToDraft(); }} variant="primary" className="w-full text-lg h-12">סגור וחזור</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 pb-20 font-sans" dir="rtl">
      <Header form={form} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        {errorMessage && (
          <div className="mb-6 bg-red-50 border-r-4 border-red-500 p-4 flex items-center gap-3 text-red-800 rounded">
            <AlertTriangle className="h-5 w-5" /> {errorMessage}
          </div>
        )}
        <FormProvider {...methods}>
          <form className="space-y-6">
            <fieldset disabled={formSectionsReadOnly || isSending} className={formSectionsReadOnly ? 'opacity-75 pointer-events-none' : ''}>
              <EmployeeDetailsSection /><PerformanceScoresSection /><WrittenEvaluationSection /><SalarySection />
            </fieldset>
            {form.status === 'draft' || form.status === 'rejected' ? (
              <ManagerDraftSection managerName={methods.watch('employeeDetails.directManagerName') || ''} onSubmit={handleSendFromManager} isSubmitting={isSending} />
            ) : (
              <ApprovalsSection formSubmission={{...form, ...getFullSubmission()}} onApprovalAction={handleApprovalWithEmail} onSignatureSave={handleSignatureSave} onSignatureClear={handleSignatureClear} isReadOnly={form.status === 'approved'} />
            )}
            <div className="flex gap-4 border-t pt-8">
              <Button type="button" variant="ghost" onClick={() => setShowPreview(true)}><Eye className="ml-2 h-4 w-4" />תצוגה מקדימה</Button>
              <Button type="button" variant="outline" onClick={() => exportToPdf({...form, ...getFullSubmission()})}><FileText className="ml-2 h-4 w-4" />PDF</Button>
              <Button type="button" variant="outline" onClick={() => printForm({...form, ...getFullSubmission()})}><Printer className="ml-2 h-4 w-4" />הדפס</Button>
            </div>
          </form>
        </FormProvider>
      </main>
      {showPreview && <PreviewModal form={{...form, ...getFullSubmission()}} onClose={() => setShowPreview(false)} />}
      {isSending && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aminach-primary mb-4"></div>
          <p className="font-bold text-aminach-primary text-xl">מעבד את הבקשה, נא להמתין...</p>
        </div>
      )}
    </div>
  );
}
