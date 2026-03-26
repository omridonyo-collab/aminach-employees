import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function calculateRaise(current: number, proposed: number) {
  const amount = proposed - current
  const percentage = current > 0 ? (amount / current) * 100 : 0
  return { amount, percentage }
}
