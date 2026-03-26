import { supabase } from './supabase'
import type { FormSubmission } from '@/types'

const hasSupabase = !!(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export interface FormListItem {
  id: string
  status: FormSubmission['status']
  employeeName: string
  employeeId: string
  department: string
  createdAt: string
  currentApprover?: string
  approvedCount: number
  totalApprovals: number
}

export function formToListItem(form: FormSubmission): FormListItem {
  const approvedCount = form.approvalSteps.filter((s) => s.status === 'approved').length
  const pendingStep = form.approvalSteps.find((s) => s.status === 'pending')
  return {
    id: form.id,
    status: form.status,
    employeeName: form.employeeDetails.employeeName,
    employeeId: form.employeeDetails.employeeId,
    department: form.employeeDetails.department,
    createdAt: form.createdAt,
    currentApprover: pendingStep?.managerName,
    approvedCount,
    totalApprovals: form.approvalSteps.length,
  }
}

export async function fetchForms(): Promise<FormListItem[]> {
  if (!hasSupabase) return []
  const { data: formsData, error: formsError } = await supabase
    .from('evaluation_forms')
    .select('id, status, employee_details, created_at')
    .order('created_at', { ascending: false })

  if (formsError || !formsData) return []

  const results: FormListItem[] = []
  for (const row of formsData) {
    const { data: approvals } = await supabase
      .from('form_approvals')
      .select('status, approver_name')
      .eq('form_id', row.id)
      .order('step_order')

    const ed = row.employee_details as Record<string, string>
    const approvedCount = (approvals ?? []).filter((a: { status: string }) => a.status === 'approved').length
    const pending = (approvals ?? []).find((a: { status: string }) => a.status === 'pending') as { approver_name: string } | undefined

    results.push({
      id: row.id,
      status: row.status as FormSubmission['status'],
      employeeName: ed?.employeeName ?? '',
      employeeId: ed?.employeeId ?? '',
      department: ed?.department ?? '',
      createdAt: row.created_at?.split('T')[0] ?? '',
      currentApprover: pending?.approver_name,
      approvedCount,
      totalApprovals: 3,
    })
  }
  return results
}

export async function saveForm(form: FormSubmission): Promise<string | null> {
  if (!hasSupabase) return null
  const payload = {
    status: form.status,
    employee_details: form.employeeDetails,
    performance_scores: form.performanceScores,
    written_evaluation: form.writtenEvaluation,
    salary_recommendation: form.salaryRecommendation,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase
    .from('evaluation_forms')
    .upsert({ id: form.id, ...payload }, { onConflict: 'id' })
    .select('id')
    .single()

  if (error) {
    console.error('saveForm error:', error)
    return null
  }
  return data?.id ?? null
}

export async function createForm(form: Omit<FormSubmission, 'id'>): Promise<string | null> {
  if (!hasSupabase) return null
  const { data: formData, error: formError } = await supabase
    .from('evaluation_forms')
    .insert({
      status: form.status,
      employee_details: form.employeeDetails,
      performance_scores: form.performanceScores,
      written_evaluation: form.writtenEvaluation,
      salary_recommendation: form.salaryRecommendation,
    })
    .select('id')
    .single()

  if (formError || !formData) return null

  for (let i = 0; i < form.approvalSteps.length; i++) {
    const step = form.approvalSteps[i]
    await supabase.from('form_approvals').insert({
      form_id: formData.id,
      step_order: i,
      approver_email: step.managerEmail ?? '',
      approver_name: step.managerName,
      role_label: step.title,
      status: step.status,
    })
  }
  return formData.id
}
