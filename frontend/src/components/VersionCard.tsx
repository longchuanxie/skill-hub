import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Flex } from '@/components/layout/Flex'
import { Text } from '@/components/typography/Text'
import { Heading } from '@/components/typography/Heading'
import { Icon } from '@/components/ui/Icon'
import { 
  GitCompare, 
  RotateCcw,
  Clock,
  CheckCircle2,
  Circle,
  ArrowRightLeft
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface VersionCardProps {
  version: {
    version: string
    content: string
    description: string
    variables: any[]
    createdAt: Date
  }
  isCurrent: boolean
  isOwner: boolean
  isSelected: boolean
  onSelect: () => void
  onRollback: () => void
  onCompare: () => void
  showConnector: boolean
}

export const VersionCard: React.FC<VersionCardProps> = ({
  version,
  isCurrent,
  isOwner,
  isSelected,
  onSelect,
  onRollback,
  onCompare,
  showConnector
}) => {
  const { t, i18n } = useTranslation()
  
  const formatDate = (date: Date) => {
    const locale = i18n.language === 'zh' ? 'zh-CN' : 'en-US'
    return new Date(date).toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="relative">
      {/* 连接线 */}
      {showConnector && (
        <div className="absolute -bottom-3 left-8 top-full z-0">
          <div className="w-0.5 h-6 bg-gradient-to-b from-border to-transparent" />
        </div>
      )}
      
      <Card 
        className={cn(
          'relative transition-all duration-200 hover:shadow-md',
          isCurrent && 'border-primary border-2 shadow-primary/20',
          isSelected && 'ring-2 ring-primary shadow-primary/20 bg-primary/5'
        )}
      >
        {/* 选择按钮 - 固定在左上角 */}
        <div className="absolute -top-3 -left-3 z-10">
          <Button
            variant={isSelected ? "default" : "outline"}
            size="icon"
            className={cn(
              "h-10 w-10 rounded-full transition-all duration-200 shadow-md",
              isSelected 
                ? "bg-primary text-primary-foreground scale-110" 
                : "bg-background hover:border-primary hover:text-primary hover:scale-105"
            )}
            onClick={onSelect}
            title={isSelected ? t('version.deselect') : t('version.selectForCompare')}
          >
            <Icon 
              icon={isSelected ? CheckCircle2 : Circle} 
              size={isSelected ? 22 : 20} 
              className={cn(
                "transition-all duration-200",
                isSelected && "text-primary-foreground"
              )}
            />
          </Button>
        </div>
        
        {/* 选中状态指示器 */}
        {isSelected && (
          <div className="absolute -top-3 left-10 z-10">
            <Badge variant="default" className="h-6 px-3 text-xs font-bold shadow-md">
              <Flex align="center" gap={1}>
                <Icon icon={ArrowRightLeft} size={12} />
                <span>{t('version.selected')}</span>
              </Flex>
            </Badge>
          </div>
        )}
        
        <CardContent className="p-4 pt-6">
          <Flex direction="column" gap={3}>
            {/* 头部：版本号和时间 */}
            <Flex justify="between" align="center">
              <Flex direction="column" gap={0.5}>
                <Flex align="center" gap={2}>
                  <Heading level={3} size="sm" className="font-semibold">
                    v{version.version}
                  </Heading>
                  {isCurrent && (
                    <Badge variant="default" className="text-xs px-2 py-0.5">
                      {t('version.current')}
                    </Badge>
                  )}
                </Flex>
                
                <Flex align="center" gap={1} className="text-muted-foreground">
                  <Icon icon={Clock} size={12} />
                  <Text size="xs">
                    {formatDate(version.createdAt)}
                  </Text>
                </Flex>
              </Flex>

              {/* 操作按钮 */}
              {isOwner && !isCurrent && (
                <Flex gap={1.5}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onCompare}
                    className="h-8 px-2 text-xs hover:bg-primary/10 hover:text-primary"
                  >
                    <Flex align="center" gap={1}>
                      <Icon icon={GitCompare} size={14} />
                      <span>{t('version.compare')}</span>
                    </Flex>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onRollback}
                    className="h-8 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Flex align="center" gap={1}>
                      <Icon icon={RotateCcw} size={14} />
                      <span>{t('version.rollback')}</span>
                    </Flex>
                  </Button>
                </Flex>
              )}
            </Flex>

            {/* 描述 */}
            {version.description && (
              <Text size="sm" color="secondary" className="line-clamp-2">
                {version.description}
              </Text>
            )}

            {/* 底部统计信息 */}
            <Flex align="center" gap={3} className="text-muted-foreground">
              <Flex align="center" gap={1}>
                <span className="text-xs font-medium">{version.variables.length}</span>
                <Text size="xs">{t('version.variables')}</Text>
              </Flex>
              <span className="text-xs">•</span>
              <Flex align="center" gap={1}>
                <span className="text-xs font-medium">{version.content.length}</span>
                <Text size="xs">{t('version.characters')}</Text>
              </Flex>
            </Flex>
          </Flex>
        </CardContent>
      </Card>
    </div>
  )
}

export default VersionCard
