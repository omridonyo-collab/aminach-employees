import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export function HrHeader() {
  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm text-slate-600 transition hover:text-aminach-primary"
        >
          <ChevronRight className="h-4 w-4" />
          חזרה לטופס
        </Link>
        <div className="flex items-center gap-3">
          <div className="text-left">
            <p className="text-lg font-bold text-aminach-primary leading-tight">המלצה לעדכון שכר / תנאים</p>
            <p className="text-xs text-slate-500 text-left">לוח בקרה – משאבי אנוש</p>
          </div>
          <img src="/aminach-logo.svg" alt="עמינח" className="h-10 w-auto" />
        </div>
      </div>
    </header>
  )
}
