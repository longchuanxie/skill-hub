import { cn } from '@/lib/utils'

interface HeadingProps {
  children: React.ReactNode
  className?: string
  level?: 1 | 2 | 3 | 4 | 5 | 6
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const Heading: React.FC<HeadingProps> = ({ 
  children, 
  className,
  level = 2,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  }

  const Tag = `h${level}` as keyof JSX.IntrinsicElements

  return (
    <Tag className={cn(
      'font-bold',
      sizeClasses[size],
      className
    )}>
      {children}
    </Tag>
  )
}