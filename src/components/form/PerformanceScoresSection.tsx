import { useFormContext } from 'react-hook-form'
import { SectionCard } from '@/components/ui/SectionCard'
import { PERFORMANCE_LABELS, SCORE_LABELS, type PerformanceScores } from '@/types'
import type { FormSchemaType } from '@/lib/validation'
import { cn } from '@/lib/utils'

const SCORE_KEYS = Object.keys(PERFORMANCE_LABELS) as (keyof PerformanceScores)[]

export function PerformanceScoresSection() {
  const { register, watch } = useFormContext<FormSchemaType>()

  const scores = watch('performanceScores') || {}
  const avg =
    SCORE_KEYS.reduce((sum, k) => sum + (Number(scores[k]) || 0), 0) / SCORE_KEYS.length

  return (
    <SectionCard title="2. דירוג ביצועים">
      <p className="mb-4 text-sm text-slate-600">
        דירוג 1–5: 1 = נמוך מאוד | 2 = טעון שיפור | 3 = סביר | 4 = טוב | 5 = מצוין
      </p>
      <div className="space-y-3">
        {SCORE_KEYS.map((key) => (
          <div key={key} className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 p-3">
            <span className="min-w-[180px] font-medium text-slate-700">
              {PERFORMANCE_LABELS[key]}
            </span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <label
                  key={n}
                  className={cn(
                    'flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition-colors',
                    Number(scores[key]) === n
                      ? 'border-aminach-accent bg-aminach-accent text-white'
                      : 'border-slate-300 hover:border-aminach-accent/50'
                  )}
                >
                  <input
                    type="radio"
                    {...register(`performanceScores.${key}`, { valueAsNumber: true })}
                    value={n}
                    className="sr-only"
                  />
                  {n}
                </label>
              ))}
            </div>
            {scores[key] && (
              <span className="text-sm text-slate-500">
                {SCORE_LABELS[scores[key] as number]}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg bg-aminach-light px-4 py-3">
        <span className="font-semibold text-aminach-primary">ממוצע ציונים: </span>
        <span className="text-lg">{avg.toFixed(1)}</span>
      </div>
    </SectionCard>
  )
}
