import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HrHeader } from '@/components/layout/HrHeader'
import { Button } from '@/components/ui/Button'
import { MOCK_FORM } from '@/data/mockData'
import type { FormStatus } from '@/types'
import { fetchForms, formToListItem, type FormListItem } from '@/lib/formsApi'
import { Plus, Eye, Check, X, Clock, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_LABELS: Record<FormStatus, string> = {
  draft: 'טיוטה',
  pending_approval: 'ממתין לאישור',
  rejected: 'נדחה',
  approved: 'אושר',
}

export function HrDashboard() {
  const [forms, setForms] = useState<FormListItem[]>([])
  const [loading, setLoading] = useState(true)
  const useBackend = !!(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )

  useEffect(() => {
    if (useBackend) {
      fetchForms().then(setForms).finally(() => setLoading(false))
    } else {
      const mock = formToListItem(MOCK_FORM)
      setForms([mock])
      setLoading(false)
    }
  }, [useBackend])

  return (
    <div className="min-h-screen bg-slate-100" dir="rtl">
      <HrHeader />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-aminach-primary">לוח בקרה - משאבי אנוש</h1>
          <p className="mt-1 text-sm text-slate-500">יצירת טפסי הערכה, עריכה ושליחה לאישור מנהלים</p>
        </div>

        {!useBackend && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <strong>מצב דמו:</strong> לא מוגדר חיבור ל-Supabase. הטפסים המוצגים הם נתוני דוגמה.
            להפעלת הפלטפורמה המלאה – הוסף <code className="rounded bg-amber-100 px-1">VITE_SUPABASE_URL</code> ו-
            <code className="rounded bg-amber-100 px-1">VITE_SUPABASE_ANON_KEY</code> ל-.env
          </div>
        )}

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">יצירת טופס הערכה חדש</h2>
          <p className="mb-4 text-sm text-slate-600">
            כמנהלת משאבי אנוש, את יוצרת ועורכת את הטופס, ולאחר מכן בוחרת למי לשלוח לאישור.
            הטופס יישלח לרשימת המאשרים שתגדירי לפי הסדר שתבחרי – ולאחר כל האישורים יגיע אוטומטית למשאבי אנוש ולחשבות שכר.
          </p>
          <Link to="/">
            <Button variant="primary">
              <Plus className="ml-2 h-4 w-4" />
              צרי טופס הערכה חדש
            </Button>
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-lg font-semibold text-slate-800">מעקב השלמת טפסים</h2>
            <p className="text-sm text-slate-500">סטטוס כל הטופסים בארגון</p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">טוען...</div>
          ) : forms.length === 0 ? (
            <div className="p-8 text-center text-slate-500">אין עדיין טפסים</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {forms.map((form) => (
                <FormRow key={form.id} form={form} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function FormRow({ form }: { form: FormListItem }) {
  const StatusIcon =
    form.status === 'approved' ? Check : form.status === 'rejected' ? X : Clock
  return (
    <div className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50">
      <div>
        <p className="font-medium text-slate-800">{form.employeeName}</p>
        <p className="text-sm text-slate-500">
          {form.employeeId} • {form.department}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
              form.status === 'approved' && 'bg-green-100 text-green-800',
              form.status === 'rejected' && 'bg-red-100 text-red-800',
              form.status === 'pending_approval' && 'bg-amber-100 text-amber-800',
              form.status === 'draft' && 'bg-slate-100 text-slate-700'
            )}
          >
            <StatusIcon className="h-3 w-3" />
            {STATUS_LABELS[form.status]}
          </span>
          <span className="text-xs text-slate-400">
            {form.approvedCount}/{form.totalApprovals} אישורים
          </span>
        </div>
        {form.currentApprover && (
          <span className="text-xs text-slate-500">
            <Send className="ml-1 inline h-3 w-3" />
            ממתין ל: {form.currentApprover}
          </span>
        )}
        <Link to="/">
          <Button variant="ghost" size="sm">
            <Eye className="ml-1 h-4 w-4" />
            צפה בטופס
          </Button>
        </Link>
      </div>
    </div>
  )
}
