import { cn } from '@/lib/utils'

interface FlexProps {
  children: React.ReactNode
  className?: string
  direction?: 'row' | 'column'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  gap?: number
  wrap?: boolean
}

export const Flex: React.FC<FlexProps> = ({ 
  children, 
  className,
  direction = 'row',
  align = 'center',
  justify = 'start',
  gap = 0,
  wrap = false
}) => {
  return (
    <div className={cn(
      'flex',
      direction === 'column' ? 'flex-col' : 'flex-row',
      `items-${align}`,
      `justify-${justify}`,
      `gap-${gap}`,
      wrap && 'flex-wrap',
      className
    )}>
      {children}
    </div>
  )
}