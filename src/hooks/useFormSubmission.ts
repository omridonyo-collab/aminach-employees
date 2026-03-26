import { useState, useCallback } from 'react'
import type { FormSubmission, FormStatus } from '@/types'
import { format } from 'date-fns'
import { MOCK_FORM } from '@/data/mockData'

export function useFormSubmission(initialForm?: FormSubmission) {
  const [form, setForm] = useState<FormSubmission>(
    initialForm ?? { ...MOCK_FORM, id: `form-${Date.now()}` }
  )

  const updateForm = useCallback((updates: Partial<FormSubmission>) => {
    setForm((prev) => ({
      ...prev,
      ...updates,
      updatedAt: format(new Date(), 'yyyy-MM-dd'),
    }))
  }, [])

  const submitForApproval = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      status: 'pending_approval',
      updatedAt: format(new Date(), 'yyyy-MM-dd'),
    }))
  }, [])

  const handleApproval = useCallback(
    (stepId: string, status: 'approved' | 'rejected', comment?: string) => {
      setForm((prev) => {
        const steps = prev.approvalSteps.map((s) =>
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
        return {
          ...prev,
          approvalSteps: steps,
          status: newStatus,
          updatedAt: format(new Date(), 'yyyy-MM-dd'),
        }
      })
    },
    []
  )

  const handleSignatureSave = useCallback((stepId: string, signatureData: string) => {
    setForm((prev) => ({
      ...prev,
      approvalSteps: prev.approvalSteps.map((s) =>
        s.id === stepId ? { ...s, signatureData } : s
      ),
      updatedAt: format(new Date(), 'yyyy-MM-dd'),
    }))
  }, [])

  const handleSignatureClear = useCallback((stepId: string) => {
    setForm((prev) => ({
      ...prev,
      approvalSteps: prev.approvalSteps.map((s) =>
        s.id === stepId ? { ...s, signatureData: null } : s
      ),
      updatedAt: format(new Date(), 'yyyy-MM-dd'),
    }))
  }, [])

  const resetToDraft = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      status: 'draft',
      approvalSteps: prev.approvalSteps.map((s) => ({
        ...s,
        status: 'pending' as const,
        comment: '',
        signedAt: null,
        signatureData: null,
      })),
      updatedAt: format(new Date(), 'yyyy-MM-dd'),
    }))
  }, [])

  return {
    form,
    updateForm,
    submitForApproval,
    handleApproval,
    handleSignatureSave,
    handleSignatureClear,
    resetToDraft,
  }
}
