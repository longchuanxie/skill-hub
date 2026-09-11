import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { Icon } from '@/components/ui/Icon'
import { Flex } from '@/components/layout/Flex'
import { Text } from '@/components/typography/Text'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description?: string
  /** Alias for description, accepted for call-site compatibility */
  message?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  /** Called when the dialog is dismissed via cancel */
  onCancel?: () => void
  variant?: 'default' | 'destructive'
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  message,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
  variant = 'default'
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const body = description ?? message ?? ''

  const close = () => {
    onOpenChange?.(false)
  }

  const handleCancel = () => {
    onCancel?.()
    close()
  }

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
      close()
    } finally {
      setIsLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        <Flex direction="column" gap={4}>
          <Flex align="center" gap={3}>
            {variant === 'destructive' && (
              <div className="p-2 bg-destructive/10 rounded-full">
                <Icon icon={AlertTriangle} className="text-destructive" />
              </div>
            )}
            <Text size="lg" weight="semibold">
              {title}
            </Text>
          </Flex>

          <Text size="sm" color="secondary" className="pl-11">
            {body}
          </Text>

          <Flex justify="end" gap={3}>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              variant={variant}
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? '处理中...' : confirmText}
            </Button>
          </Flex>
        </Flex>
      </div>
    </div>
  )
}
