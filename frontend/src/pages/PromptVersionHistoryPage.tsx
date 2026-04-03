import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Container } from '@/components/layout/Container'
import { Flex } from '@/components/layout/Flex'
import { Text } from '@/components/typography/Text'
import { Heading } from '@/components/typography/Heading'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/button'
import { History, ArrowLeft, ChevronRight } from 'lucide-react'
import { versionsApi } from '@/api/versions'
import VersionManagement from '@/components/VersionManagement'

export const PromptVersionHistoryPage: React.FC = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const handleRollback = async (version: string) => {
    await versionsApi.rollbackVersion(id!, 'prompt', version)
    navigate(0)
  }

  return (
    <Container maxWidth="xl" className="py-6">
      <Flex direction="column" gap={5}>
        <Flex align="center" gap={2} className="text-muted-foreground">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-auto px-0 hover:bg-transparent hover:text-primary"
            onClick={() => navigate(`/prompts/${id}`)}
          >
            <Flex align="center" gap={1}>
              <Icon icon={ArrowLeft} size={14} />
              <Text size="sm">{t('prompts.detail')}</Text>
            </Flex>
          </Button>
          <Icon icon={ChevronRight} size={14} />
          <Text size="sm" color="secondary">{t('version.history')}</Text>
        </Flex>

        <Flex align="center" gap={3}>
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon icon={History} size={24} className="text-primary" />
          </div>
          <div>
            <Heading level={1} size="xl" className="font-bold">
              {t('version.history')}
            </Heading>
          </div>
        </Flex>

        {id && (
          <VersionManagement
            resourceId={id}
            resourceType="prompt"
            currentVersion=""
            onRollback={handleRollback}
          />
        )}
      </Flex>
    </Container>
  )
}

export default PromptVersionHistoryPage
