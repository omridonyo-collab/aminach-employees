import { useFormContext } from 'react-hook-form'
import { SectionCard } from '@/components/ui/SectionCard'
import { RECOMMENDATION_LABELS, type ManagerRecommendation } from '@/types'
import type { FormSchemaType } from '@/lib/validation'

const RECOMMENDATIONS: ManagerRecommendation[] = [
  'promotion',
  'salary_raise',
  'retention',
  'no_change',
]

export function WrittenEvaluationSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<FormSchemaType>()

  return (
    <SectionCard title="3. הערכה מילולית">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">נקודות חוזקה *</label>
          <textarea
            {...register('writtenEvaluation.strengths')}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-right focus:border-aminach-accent focus:outline-none focus:ring-1 focus:ring-aminach-accent"
            placeholder="תאר את נקודות החוזקה של העובד"
          />
          {errors.writtenEvaluation?.strengths && (
            <p className="mt-1 text-sm text-red-600">
              {errors.writtenEvaluation.strengths.message}
            </p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">נקודות לשיפור *</label>
          <textarea
            {...register('writtenEvaluation.improvements')}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-right focus:border-aminach-accent focus:outline-none focus:ring-1 focus:ring-aminach-accent"
            placeholder="תאר נקודות לשיפור"
          />
          {errors.writtenEvaluation?.improvements && (
            <p className="mt-1 text-sm text-red-600">
              {errors.writtenEvaluation.improvements.message}
            </p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">הערות כלליות *</label>
          <textarea
            {...register('writtenEvaluation.generalComments')}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-right focus:border-aminach-accent focus:outline-none focus:ring-1 focus:ring-aminach-accent"
            placeholder="הערות נוספות"
          />
          {errors.writtenEvaluation?.generalComments && (
            <p className="mt-1 text-sm text-red-600">
              {errors.writtenEvaluation.generalComments.message}
            </p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">המלצת מנהל *</label>
          <div className="flex flex-wrap gap-3">
            {RECOMMENDATIONS.map((r) => (
              <label key={r} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  {...register('writtenEvaluation.managerRecommendation')}
                  value={r}
                  className="h-4 w-4 border-slate-300 text-aminach-accent focus:ring-aminach-accent"
                />
                <span>{RECOMMENDATION_LABELS[r]}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
