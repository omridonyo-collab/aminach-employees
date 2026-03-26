import { useFormContext, useWatch } from 'react-hook-form'
import { useEffect } from 'react'
import { SectionCard } from '@/components/ui/SectionCard'
import type { FormSchemaType } from '@/lib/validation'
import { AlertCircle, AlertTriangle } from 'lucide-react'

export function SalarySection() {
  const { register, setValue, formState: { errors } } = useFormContext<FormSchemaType>()

  const currentSalary = useWatch({ name: 'salaryRecommendation.currentSalary', defaultValue: 0 }) as number
  const proposedSalary = useWatch({ name: 'salaryRecommendation.proposedSalary', defaultValue: 0 }) as number

  const amount = (Number(proposedSalary) || 0) - (Number(currentSalary) || 0)
  const percentage = (Number(currentSalary) || 0) > 0
    ? (amount / (Number(currentSalary) || 1)) * 100
    : 0

  useEffect(() => {
    setValue('salaryRecommendation.raiseAmount', amount)
    setValue('salaryRecommendation.raisePercentage', percentage)
  }, [amount, percentage, setValue])

  const isLower = proposedSalary > 0 && currentSalary > 0 && proposedSalary < currentSalary
  const isHighRaise = percentage > 15 && currentSalary > 0

  return (
    <SectionCard title="4. שכר והמלצה">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">שכר נוכחי (₪) *</label>
          <input
            type="number"
            {...register('salaryRecommendation.currentSalary', { valueAsNumber: true })}
            min={0}
            step={100}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-right focus:border-aminach-accent focus:outline-none focus:ring-1 focus:ring-aminach-accent"
            placeholder="12000"
          />
          {errors.salaryRecommendation?.currentSalary && (
            <p className="mt-1 text-sm text-red-600">
              {errors.salaryRecommendation.currentSalary.message}
            </p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">שכר מוצע (₪) *</label>
          <input
            type="number"
            {...register('salaryRecommendation.proposedSalary', { valueAsNumber: true })}
            min={0}
            step={100}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-right focus:border-aminach-accent focus:outline-none focus:ring-1 focus:ring-aminach-accent"
            placeholder="13200"
          />
          {errors.salaryRecommendation?.proposedSalary && (
            <p className="mt-1 text-sm text-red-600">
              {errors.salaryRecommendation.proposedSalary.message}
            </p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">גובה העלאה (מחושב)</label>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-right font-medium text-slate-700">
            {amount.toLocaleString('he-IL')} ₪
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">אחוז העלאה (מחושב)</label>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-right font-medium text-slate-700">
            {percentage.toFixed(1)}%
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            תאריך תחילת השכר החדש *
          </label>
          <input
            type="date"
            {...register('salaryRecommendation.newSalaryStartDate')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-right focus:border-aminach-accent focus:outline-none focus:ring-1 focus:ring-aminach-accent"
          />
          {errors.salaryRecommendation?.newSalaryStartDate && (
            <p className="mt-1 text-sm text-red-600">
              {errors.salaryRecommendation.newSalaryStartDate.message}
            </p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">נימוק להעלאה *</label>
          <textarea
            {...register('salaryRecommendation.raiseJustification')}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-right focus:border-aminach-accent focus:outline-none focus:ring-1 focus:ring-aminach-accent"
            placeholder="נמק את הסיבה להעלאת השכר"
          />
          {errors.salaryRecommendation?.raiseJustification && (
            <p className="mt-1 text-sm text-red-600">
              {errors.salaryRecommendation.raiseJustification.message}
            </p>
          )}
        </div>
      </div>
      {isLower && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-aminach-danger/30 bg-red-50 px-4 py-3 text-aminach-danger">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>אזהרה: השכר המוצע נמוך מהשכר הנוכחי.</span>
        </div>
      )}
      {isHighRaise && !isLower && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-aminach-warning/30 bg-amber-50 px-4 py-3 text-aminach-warning">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>התראה: אחוז העלאה גבוה משמעותית ({percentage.toFixed(1)}%).</span>
        </div>
      )}
    </SectionCard>
  )
}
