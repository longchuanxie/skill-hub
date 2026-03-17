import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface IconProps {
  icon: LucideIcon
  className?: string
  size?: number
}

export const Icon: React.FC<IconProps> = ({ 
  icon: Icon, 
  className,
  size = 20
}) => {
  return (
    <Icon 
      className={cn('shrink-0', className)}
      size={size}
    />
  )
}