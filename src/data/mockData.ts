import type { FormSubmission, ApprovalStep } from '@/types'
import { format } from 'date-fns'

/** יחידות (לשעבר: מחלקות מפעל) */
export const UNITS = ['תפעול', 'מטה', 'חנויות'] as const

/** שמור לתאימות לאחור */
export const PLANT_DEPARTMENTS = UNITS

/** מחלקות */
export const DEPARTMENTS = [
  'מזרנים',
  'ספוג',
  'מתכת',
  'עץ',
  'הרכבה',
  'הפצה',
  'אחזקה',
  'חומרי גלם',
  'טכני',
  'תפ"י',
  'שיווק',
  'מדיקלי',
  'מש"א',
  'חנויות',
  'רכש',
  'מערכות מידע',
  'אחר',
] as const

/** תפקידים – ברירת מחדל (השדה הפך לחופשי, רשימה זו כבר לא בשימוש) */
export const POSITIONS: string[] = []

/** שרשרת האישורים */
export const APPROVAL_CHAIN_LABELS = [
  'מנהל ישיר',
  'מנהל בכיר',
  'מנכ"ל',
  'משאבי אנוש + חשבות שכר',
] as const

/** ברירת מחדל לשלבי אישור – השמות ייעדכנו ע"י HR */
const today = format(new Date(), 'yyyy-MM-dd')

export const INITIAL_APPROVAL_STEPS: ApprovalStep[] = [
  {
    id: 'a1',
    title: 'מנהל ישיר',
    role: 'מנהל ישיר',
    status: 'pending',
    managerName: '', // יתמלא אוטומטית מהשדה "שם מנהל ישיר" בטופס
    managerEmail: '',
    comment: '',
    signedAt: null,
    signatureData: null,
  },
  {
    id: 'a2',
    title: 'מנהל בכיר',
    role: 'מנהל בכיר',
    status: 'pending',
    managerName: '',
    managerEmail: '',
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
    managerEmail: '',
    comment: '',
    signedAt: null,
    signatureData: null,
  },
]

export const MOCK_FORM: FormSubmission = {
  id: 'form-001',
  status: 'draft',
  createdAt: today,
  updatedAt: today,
  employeeDetails: {
    employeeName: '',
    employeeId: '',
    plantDepartment: '',
    department: '',
    position: '',
    directManagerName: '',
    tenureInCompany: '',
    formFillDate: today,
  },
  performanceScores: {
    workQuality: 3,
    timeliness: 3,
    dedication: 3,
    generalExpectations: 3,
    professionalism: 3,
    teamwork: 3,
    personalResponsibility: 3,
    disciplineAndConduct: 3,
  },
  writtenEvaluation: {
    strengths: '',
    improvements: '',
    generalComments: '',
    managerRecommendation: 'retention',
  },
  salaryRecommendation: {
    currentSalary: 0,
    proposedSalary: 0,
    raiseAmount: 0,
    raisePercentage: 0,
    newSalaryStartDate: today,
    raiseJustification: '',
  },
  approvalSteps: [...INITIAL_APPROVAL_STEPS],
}
