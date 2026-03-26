import { Link } from 'react-router-dom'
import type { FormSubmission } from '@/types'
import { cn } from '@/lib/utils'
import { LayoutDashboard } from 'lucide-react'

const STATUS_LABELS = {
  draft: 'טיוטה',
  pending_approval: 'ממתין לאישור',
  rejected: 'נדחה',
  approved: 'אושר סופית',
}

interface HeaderProps {
  form: FormSubmission
}

export function Header({ form }: HeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 px-4 py-3 sm:flex-row">
        {/* לוגו + כותרת */}
        <div className="flex items-center gap-4">
          <img
            src="/aminach-logo.svg"
            alt="עמינח"
            className="h-12 w-auto"
          />
          <div>
            <h1 className="text-lg font-bold leading-tight text-aminach-primary">
              המלצה לעדכון שכר / תנאים
            </h1>
            <p className="text-xs text-slate-500">עמינח</p>
          </div>
        </div>

        {/* סטטוס + ניווט */}
        <div className="flex items-center gap-3">
          <Link
            to="/hr"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-aminach-primary"
          >
            <LayoutDashboard className="h-4 w-4" />
            לוח בקרה
          </Link>
          <span
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium',
              form.status === 'approved' && 'bg-green-100 text-green-800',
              form.status === 'rejected' && 'bg-red-100 text-red-800',
              form.status === 'pending_approval' && 'bg-amber-100 text-amber-800',
              form.status === 'draft' && 'bg-slate-100 text-slate-700'
            )}
          >
            {STATUS_LABELS[form.status]}
          </span>
          <span className="text-sm text-slate-500">
            עודכן: {form.updatedAt}
          </span>
        </div>
      </div>
    </header>
  )
}
