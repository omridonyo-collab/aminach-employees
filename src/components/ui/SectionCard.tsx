import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionCardProps {
  title: string
  children: ReactNode
  className?: string
}

export function SectionCard({ title, children, className }: SectionCardProps) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white p-6 shadow-sm', className)}>
      <h3 className="mb-4 border-b border-aminach-light pb-2 text-lg font-semibold text-aminach-primary">
        {title}
      </h3>
      {children}
    </div>
  )
}
