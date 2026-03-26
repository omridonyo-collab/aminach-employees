import { z } from 'zod'

export const employeeDetailsSchema = z.object({
  employeeName: z.string().min(2, 'שם העובד חובה'),
  employeeId: z.string().min(1, 'מספר עובד חובה'),
  plantDepartment: z.string().min(1, 'מחלקת מפעל חובה'),
  department: z.string().min(1, 'מחלקה חובה'),
  position: z.string().min(1, 'תפקיד חובה'),
  directManagerName: z.string().min(2, 'שם המנהל הישיר חובה'),
  tenureInCompany: z.string().min(1, 'ותק בחברה חובה'),
  formFillDate: z.string().min(1, 'תאריך מילוי חובה'),
})

export const performanceScoresSchema = z.object({
  workQuality: z.coerce.number().min(1).max(5),
  timeliness: z.coerce.number().min(1).max(5),
  dedication: z.coerce.number().min(1).max(5),
  generalExpectations: z.coerce.number().min(1).max(5),
  professionalism: z.coerce.number().min(1).max(5),
  teamwork: z.coerce.number().min(1).max(5),
  personalResponsibility: z.coerce.number().min(1).max(5),
  disciplineAndConduct: z.coerce.number().min(1).max(5),
})

export const writtenEvaluationSchema = z.object({
  strengths: z.string().min(1, 'נקודות חוזקה חובה'),
  improvements: z.string().min(1, 'נקודות לשיפור חובה'),
  generalComments: z.string().min(1, 'הערות כלליות חובה'),
  managerRecommendation: z.enum(['promotion', 'salary_raise', 'retention', 'no_change']),
})

export const salaryRecommendationSchema = z.object({
  currentSalary: z.coerce.number().min(0, 'שכר נוכחי חובה'),
  proposedSalary: z.coerce.number().min(0, 'שכר מוצע חובה'),
  raiseAmount: z.coerce.number(),
  raisePercentage: z.coerce.number(),
  newSalaryStartDate: z.string().min(1, 'תאריך תחילת שכר חובה'),
  raiseJustification: z.string().min(1, 'נימוק להעלאה חובה'),
})

export const formSchema = z.object({
  employeeDetails: employeeDetailsSchema,
  performanceScores: performanceScoresSchema,
  writtenEvaluation: writtenEvaluationSchema,
  salaryRecommendation: salaryRecommendationSchema,
})

export type FormSchemaType = z.infer<typeof formSchema>
