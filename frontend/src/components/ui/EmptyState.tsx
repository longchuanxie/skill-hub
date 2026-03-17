import { cn } from '@/lib/utils'
import { FileX, History } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Heading } from '@/components/typography/Heading'
import { Text } from '@/components/typography/Text'
import { Icon } from '@/components/ui/Icon'

interface EmptyStateProps {
  icon?: 'history' | 'file'
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon = 'file',
  title,
  description,
  action,
  className
}) => {
  const icons = {
    history: History,
    file: FileX
  }

  const IconComponent = icons[icon]

  return (
    <Card className={cn('flex flex-col items-center justify-center p-8', className)}>
      <CardContent className="flex flex-col items-center text-center">
        <Icon icon={IconComponent} className="w-16 h-16 text-muted-foreground mb-4" />
        <Heading level={3} size="lg" className="mb-2">
          {title}
        </Heading>
        <Text size="sm" color="muted" className="mb-4">
          {description}
        </Text>
        {action}
      </CardContent>
    </Card>
  )
}