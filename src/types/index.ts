export type FormStatus = 'draft' | 'pending_approval' | 'rejected' | 'approved'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type ManagerRecommendation = 'promotion' | 'salary_raise' | 'retention' | 'no_change'

export interface EmployeeDetails {
  employeeName: string
  employeeId: string
  plantDepartment: string
  department: string
  position: string
  directManagerName: string
  tenureInCompany: string
  formFillDate: string
}

export interface PerformanceScores {
  workQuality: number
  timeliness: number
  dedication: number
  generalExpectations: number
  professionalism: number
  teamwork: number
  personalResponsibility: number
  disciplineAndConduct: number
}

export const PERFORMANCE_LABELS: Record<keyof PerformanceScores, string> = {
  workQuality: 'איכות העבודה',
  timeliness: 'עמידה בזמנים',
  dedication: 'מסירות העובד',
  generalExpectations: 'עמידה בציפיות כלליות',
  professionalism: 'מקצועיות',
  teamwork: 'יחסי אנוש / עבודה בצוות',
  personalResponsibility: 'אחריות אישית',
  disciplineAndConduct: 'משמעת והתנהלות',
}

export const SCORE_LABELS: Record<number, string> = {
  1: 'נמוך מאוד',
  2: 'טעון שיפור',
  3: 'סביר',
  4: 'טוב',
  5: 'מצוין',
}

export interface WrittenEvaluation {
  strengths: string
  improvements: string
  generalComments: string
  managerRecommendation: ManagerRecommendation
}

export const RECOMMENDATION_LABELS: Record<ManagerRecommendation, string> = {
  promotion: 'קידום',
  salary_raise: 'העלאת שכר',
  retention: 'שימור',
  no_change: 'ללא שינוי',
}

export interface SalaryRecommendation {
  currentSalary: number
  proposedSalary: number
  raiseAmount: number
  raisePercentage: number
  newSalaryStartDate: string
  raiseJustification: string
}

export interface ApprovalStep {
  id: string
  title: string
  role: string
  status: ApprovalStatus
  managerName: string
  managerEmail?: string
  comment: string
  signedAt: string | null
  signatureData: string | null
}

export interface FormSubmission {
  id: string
  status: FormStatus
  employeeDetails: EmployeeDetails
  performanceScores: PerformanceScores
  writtenEvaluation: WrittenEvaluation
  salaryRecommendation: SalaryRecommendation
  approvalSteps: ApprovalStep[]
  createdAt: string
  updatedAt: string
}

export type FormData = Omit<FormSubmission, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'approvalSteps'> & {
  approvalSteps: Omit<ApprovalStep, 'status' | 'comment' | 'signedAt' | 'signatureData'>[]
}
