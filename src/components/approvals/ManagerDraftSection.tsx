import { useState } from 'react'
import { SectionCard } from '@/components/ui/SectionCard'
import { SignaturePad } from '@/components/approvals/SignaturePad'
import { Button } from '@/components/ui/Button'
import { Send, User, Info } from 'lucide-react'

interface ManagerDraftSectionProps {
  managerName: string
  onSubmit: (signature: string, deptManagerName: string, deptManagerEmail: string) => void
  isSubmitting: boolean
}

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-right focus:border-aminach-accent focus:outline-none focus:ring-1 focus:ring-aminach-accent'

export function ManagerDraftSection({
  managerName,
  onSubmit,
  isSubmitting,
}: ManagerDraftSectionProps) {
  const [signature, setSignature] = useState<string | null>(null)
  const [deptManagerName, setDeptManagerName] = useState('')
  const [deptManagerEmail, setDeptManagerEmail] = useState('')

  const canSubmit =
    !!signature && deptManagerName.trim().length > 0 && deptManagerEmail.trim().length > 0

  return (
    <SectionCard title="5. חתימה ושליחה לאישור">
      {/* חתימת מנהל ישיר */}
      <div className="mb-6">
        <h4 className="mb-3 font-semibold text-aminach-primary">
          חתימת מנהל ישיר – {managerName || 'מנהל ישיר'}
        </h4>
        <SignaturePad
          savedSignature={signature}
          onSave={setSignature}
          onClear={() => setSignature(null)}
        />
        {!signature && (
          <p className="mt-2 text-sm text-amber-600">* חתימה נדרשת לפני שליחה</p>
        )}
      </div>

      {/* הגדרת מנהל המחלקה */}
      <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h4 className="mb-3 flex items-center gap-2 font-semibold text-aminach-primary">
          <User className="h-4 w-4" />
          הגדר את המאשר הבא – מנהל המחלקה
        </h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              שם מנהל המחלקה *
            </label>
            <input
              type="text"
              value={deptManagerName}
              onChange={(e) => setDeptManagerName(e.target.value)}
              placeholder="שם מלא"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              מייל מנהל המחלקה *
            </label>
            <input
              type="email"
              value={deptManagerEmail}
              onChange={(e) => setDeptManagerEmail(e.target.value)}
              placeholder="email@aminach.co.il"
              dir="ltr"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* הסבר תהליך */}
      <div className="mb-5 flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          לאחר אישור מנהל המחלקה, הטופס יועבר אוטומטית למנכ"ל – <strong>רונן בר שלום</strong>.
          לאחר חתימת המנכ"ל, הטופס יישלח למחלקת משאבי האנוש.
        </span>
      </div>

      <Button
        type="button"
        variant="primary"
        disabled={!canSubmit || isSubmitting}
        onClick={() => {
          if (canSubmit) {
            onSubmit(signature!, deptManagerName.trim(), deptManagerEmail.trim())
          }
        }}
      >
        <Send className="ml-2 h-4 w-4" />
        {isSubmitting ? 'שולח...' : 'חתום ושלח לאישור מנהל מחלקה'}
      </Button>
    </SectionCard>
  )
}
