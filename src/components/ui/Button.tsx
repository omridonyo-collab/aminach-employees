import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' &&
          'bg-aminach-accent text-white hover:bg-aminach-accent/90 focus:ring-aminach-accent',
        variant === 'outline' &&
          'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-400',
        variant === 'ghost' && 'text-slate-700 hover:bg-slate-100 focus:ring-slate-400',
        variant === 'danger' &&
          'bg-aminach-danger text-white hover:bg-red-700 focus:ring-aminach-danger',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
