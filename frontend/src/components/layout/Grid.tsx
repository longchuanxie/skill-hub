import { cn } from '@/lib/utils'

interface GridProps {
  children: React.ReactNode
  className?: string
  cols?: 1 | 2 | 3 | 4 | 6 | 12
  gap?: number
}

export const Grid: React.FC<GridProps> = ({ 
  children, 
  className,
  cols = 1,
  gap = 4
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    6: 'grid-cols-6',
    12: 'grid-cols-12'
  }

  return (
    <div className={cn(
      'grid',
      gridClasses[cols],
      `gap-${gap}`,
      className
    )}>
      {children}
    </div>
  )
}