import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPoints(points: number) {
  return points % 1 === 0 ? points.toString() : points.toFixed(1)
}

export function getRankLabel(rank: number) {
  if (rank === 1) return '1st'
  if (rank === 2) return '2nd'
  if (rank === 3) return '3rd'
  return `${rank}th`
}

export function getCategoryColor(category: string) {
  switch (category) {
    case 'Sub Junior': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    case 'Junior': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    case 'Senior': return 'bg-primary/10 text-primary border-primary/20'
    default: return 'bg-muted text-muted-foreground border-border'
  }
}

export function getStatusBadge(status: string) {
  if (status === 'open') {
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  }
  return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
}
