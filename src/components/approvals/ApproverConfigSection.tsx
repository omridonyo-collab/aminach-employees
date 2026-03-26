import { SectionCard } from '@/components/ui/SectionCard'
import { Button } from '@/components/ui/Button'
import type { ApprovalStep } from '@/types'
import { UserPlus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'

interface ApproverConfigSectionProps {
  steps: ApprovalStep[]
  onChange: (steps: ApprovalStep[]) => void
  disabled?: boolean
}

const ROLE_SUGGESTIONS = [
  'מנהל ישיר',
  'מנהל בכיר',
  'מנכ"ל',
  'מנהל מחלקה',
  'סמנכ"ל',
]

export function ApproverConfigSection({ steps, onChange, disabled }: ApproverConfigSectionProps) {
  const updateStep = (id: string, field: 'managerName' | 'managerEmail' | 'title' | 'role', value: string) => {
    onChange(steps.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const addStep = () => {
    const newStep: ApprovalStep = {
      id: `a-${Date.now()}`,
      title: '',
      role: '',
      status: 'pending',
      managerName: '',
      managerEmail: '',
      comment: '',
      signedAt: null,
      signatureData: null,
    }
    onChange([...steps, newStep])
  }

  const removeStep = (id: string) => {
    onChange(steps.filter((s) => s.id !== id))
  }

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps]
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= newSteps.length) return
    ;[newSteps[index], newSteps[target]] = [newSteps[target], newSteps[index]]
    onChange(newSteps)
  }

  return (
    <SectionCard title="5. הגדרת מאשרים – בחרי למי לשלוח לאישור">
      <p className="mb-4 text-sm text-slate-500">
        הגדירי את רשימת המאשרים לפי הסדר הרצוי. הטופס יעבור מאיש לאיש לפי הסדר שתגדירי.
      </p>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-aminach-primary">
                שלב {index + 1}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => moveStep(index, 'up')}
                  disabled={disabled || index === 0}
                  className="rounded p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                  title="הזז למעלה"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveStep(index, 'down')}
                  disabled={disabled || index === steps.length - 1}
                  className="rounded p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                  title="הזז למטה"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeStep(step.id)}
                  disabled={disabled || steps.length <= 1}
                  className="rounded p-1 text-red-400 hover:text-red-600 disabled:opacity-30"
                  title="הסר מאשר"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">תפקיד / תיאור</label>
                <input
                  type="text"
                  value={step.title}
                  onChange={(e) => {
                    updateStep(step.id, 'title', e.target.value)
                    updateStep(step.id, 'role', e.target.value)
                  }}
                  disabled={disabled}
                  list={`role-suggestions-${step.id}`}
                  placeholder='למשל: מנהל ישיר'
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-aminach-primary focus:outline-none focus:ring-1 focus:ring-aminach-primary disabled:bg-slate-100"
                />
                <datalist id={`role-suggestions-${step.id}`}>
                  {ROLE_SUGGESTIONS.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">שם המאשר</label>
                <input
                  type="text"
                  value={step.managerName}
                  onChange={(e) => updateStep(step.id, 'managerName', e.target.value)}
                  disabled={disabled}
                  placeholder="שם מלא"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-aminach-primary focus:outline-none focus:ring-1 focus:ring-aminach-primary disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">כתובת מייל</label>
                <input
                  type="email"
                  value={step.managerEmail ?? ''}
                  onChange={(e) => updateStep(step.id, 'managerEmail', e.target.value)}
                  disabled={disabled}
                  placeholder="email@aminach.co.il"
                  dir="ltr"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-aminach-primary focus:outline-none focus:ring-1 focus:ring-aminach-primary disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {!disabled && (
        <Button type="button" variant="outline" size="sm" onClick={addStep} className="mt-4">
          <UserPlus className="ml-2 h-4 w-4" />
          הוסף מאשר
        </Button>
      )}

      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
        לאחר כל האישורים – הטופס יישלח אוטומטית למשאבי אנוש ולחשבות שכר.
      </div>
    </SectionCard>
  )
}
