import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: { value: number; label: string }
  variant?: 'default' | 'gold' | 'success' | 'warning'
}

const variantStyles = {
  default: {
    icon: 'bg-muted text-muted-foreground',
    border: 'border-border',
  },
  gold: {
    icon: 'bg-primary/10 text-primary',
    border: 'border-primary/20',
  },
  success: {
    icon: 'bg-emerald-500/10 text-emerald-400',
    border: 'border-emerald-500/20',
  },
  warning: {
    icon: 'bg-orange-500/10 text-orange-400',
    border: 'border-orange-500/20',
  },
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  variant = 'default',
}: StatsCardProps) {
  const styles = variantStyles[variant]

  return (
    <div
      className={cn(
        'bg-card border rounded-xl p-5 card-hover transition-all duration-200',
        styles.border
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {title}
          </p>
          <p className="text-3xl font-bold text-foreground tabular-nums">
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}
              >
                {trend.value >= 0 ? '+' : ''}{trend.value}
              </span>
              <span className="text-xs text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3',
            styles.icon
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}
