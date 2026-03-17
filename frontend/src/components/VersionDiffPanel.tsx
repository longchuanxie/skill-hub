import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Flex } from '@/components/layout/Flex'
import { Text } from '@/components/typography/Text'
import { Heading } from '@/components/typography/Heading'
import { Icon } from '@/components/ui/Icon'
import { 
  CheckCircle, 
  XCircle, 
  FileText,
  Clock
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface VersionDiffPanelProps {
  version: {
    version: string
    content: string
    description: string
    variables: any[]
    createdAt: Date
  }
  isVersion1: boolean
  differences: {
    contentChanged: boolean
    descriptionChanged: boolean
    variablesChanged: boolean
  }
}

export const VersionDiffPanel: React.FC<VersionDiffPanelProps> = ({
  version,
  isVersion1,
  differences
}) => {
  const { t, i18n } = useTranslation()
  
  const formatDate = (date: Date) => {
    const locale = i18n.language === 'zh' ? 'zh-CN' : 'en-US'
    return new Date(date).toLocaleString(locale)
  }

  return (
    <Flex direction="column" className="h-full">
      <Flex justify="between" align="center" className="p-4 border-b">
        <Flex align="center" gap={2}>
          <Icon icon={FileText} size={18} />
          <Heading level={3} size="md">
            v{version.version}
          </Heading>
        </Flex>
        
        <Flex align="center" gap={2}>
          <Icon icon={Clock} size={14} className="text-muted-foreground" />
          <Text size="sm" color="muted">
            {formatDate(version.createdAt)}
          </Text>
        </Flex>
      </Flex>

      <Flex direction="column" gap={4} className="p-4 flex-1 overflow-auto">
        <Flex direction="column" gap={2}>
          <Flex align="center" gap={2}>
            <Text size="sm" weight="medium">
              {t('version.description')}
            </Text>
            {differences.descriptionChanged && (
              <Badge variant={isVersion1 ? "destructive" : "default"}>
                <Flex align="center" gap={1}>
                  <Icon icon={isVersion1 ? XCircle : CheckCircle} size={12} />
                  <Text size="xs">{isVersion1 ? t('version.removed') : t('version.added')}</Text>
                </Flex>
              </Badge>
            )}
          </Flex>
          <Text size="sm" color="secondary">
            {version.description}
          </Text>
        </Flex>

        <Separator />

        <Flex direction="column" gap={2}>
          <Flex align="center" gap={2}>
            <Text size="sm" weight="medium">
              {t('version.content')}
            </Text>
            {differences.contentChanged && (
              <Badge variant={isVersion1 ? "destructive" : "default"}>
                <Flex align="center" gap={1}>
                  <Icon icon={isVersion1 ? XCircle : CheckCircle} size={12} />
                  <Text size="xs">{isVersion1 ? t('version.removed') : t('version.added')}</Text>
                </Flex>
              </Badge>
            )}
          </Flex>
          <Card className="p-3 bg-muted/50">
            <Text size="sm" className="whitespace-pre-wrap font-mono">
              {version.content}
            </Text>
          </Card>
        </Flex>

        <Separator />

        <Flex direction="column" gap={2}>
          <Flex align="center" gap={2}>
            <Text size="sm" weight="medium">
              {t('version.variables')}
            </Text>
            {differences.variablesChanged && (
              <Badge variant={isVersion1 ? "destructive" : "default"}>
                <Flex align="center" gap={1}>
                  <Icon icon={isVersion1 ? XCircle : CheckCircle} size={12} />
                  <Text size="xs">{isVersion1 ? t('version.removed') : t('version.added')}</Text>
                </Flex>
              </Badge>
            )}
          </Flex>
          {version.variables.length > 0 ? (
            <Flex direction="column" gap={2}>
              {version.variables.map((variable, index) => (
                <Card key={index} className="p-3">
                  <Flex direction="column" gap={1}>
                    <Flex align="center" gap={2}>
                      <Badge variant="outline">
                        <Text size="xs">{variable.name}</Text>
                      </Badge>
                      <Text size="xs" color="muted">
                        ({variable.type})
                      </Text>
                      {variable.required && (
                        <Badge variant="destructive">
                          <Text size="xs">{t('version.required')}</Text>
                        </Badge>
                      )}
                    </Flex>
                    {variable.description && (
                      <Text size="xs" color="muted">
                        {variable.description}
                      </Text>
                    )}
                  </Flex>
                </Card>
              ))}
            </Flex>
          ) : (
            <Text size="sm" color="muted">
              {t('version.noVariables')}
            </Text>
          )}
        </Flex>
      </Flex>
    </Flex>
  )
}