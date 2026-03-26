import type { FormSchemaType } from '@/lib/validation'
import type { FormSubmission, ApprovalStep } from '@/types'
import { format } from 'date-fns'
import { INITIAL_APPROVAL_STEPS } from '@/data/mockData'

export function formValuesToSubmission(
  values: FormSchemaType,
  approvalSteps: ApprovalStep[],
  status: FormSubmission['status'] = 'draft'
): Omit<FormSubmission, 'id'> {
  return {
    status,
    employeeDetails: values.employeeDetails,
    performanceScores: values.performanceScores,
    writtenEvaluation: values.writtenEvaluation,
    salaryRecommendation: values.salaryRecommendation,
    approvalSteps: approvalSteps.length > 0 ? approvalSteps : INITIAL_APPROVAL_STEPS,
    createdAt: format(new Date(), 'yyyy-MM-dd'),
    updatedAt: format(new Date(), 'yyyy-MM-dd'),
  }
}
