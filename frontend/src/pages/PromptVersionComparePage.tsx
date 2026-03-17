import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Container } from '@/components/layout/Container'
import { Flex } from '@/components/layout/Flex'
import { Grid } from '@/components/layout/Grid'
import { Text } from '@/components/typography/Text'
import { Heading } from '@/components/typography/Heading'
import { Icon } from '@/components/ui/Icon'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { VersionDiffPanel } from '@/components/VersionDiffPanel'
import { 
  GitCompare, 
  ArrowLeft,
  FileText,
  AlertCircle
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface VersionDiff {
  version1: {
    version: string
    content: string
    description: string
    variables: any[]
    createdAt: Date
  }
  version2: {
    version: string
    content: string
    description: string
    variables: any[]
    createdAt: Date
  }
  differences: {
    contentChanged: boolean
    descriptionChanged: boolean
    variablesChanged: boolean
  }
}

export const PromptVersionComparePage: React.FC = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const [diff, setDiff] = useState<VersionDiff | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const version1 = urlParams.get('version1')
    const version2 = urlParams.get('version2')
    
    if (version1 && version2) {
      fetchDiff(version1, version2)
    }
  }, [id])

  const fetchDiff = async (version1: string, version2: string) => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/prompts/${id}/compare?version1=${version1}&version2=${version2}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        setDiff(null)
        return
      }
      
      const data = await response.json()
      setDiff(data)
    } catch (error) {
      console.error('Failed to fetch diff:', error)
      setDiff(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Container>
        <Flex align="center" justify="center" className="min-h-[400px]">
          <LoadingSpinner size="lg" />
        </Flex>
      </Container>
    )
  }

  if (!diff) {
    return (
      <Container>
        <Flex direction="column" align="center" justify="center" gap={4} className="min-h-[400px]">
          <Icon icon={AlertCircle} size={48} className="text-destructive" />
          <Heading level={2} size="lg">
            {t('version.compareError')}
          </Heading>
          <Text className="text-muted-foreground">
            {t('version.compareErrorDescription')}
          </Text>
          <Button variant="outline" onClick={() => navigate(`/prompts/${id}/versions`)}>
            <Flex align="center" gap={2}>
              <Icon icon={ArrowLeft} size={18} />
              <Text>{t('version.backToHistory')}</Text>
            </Flex>
          </Button>
        </Flex>
      </Container>
    )
  }

  const changeCount = [
    diff.differences.contentChanged,
    diff.differences.descriptionChanged,
    diff.differences.variablesChanged
  ].filter(Boolean).length

  return (
    <Container maxWidth="full">
      <Flex direction="column" gap={6}>
        <Flex justify="between" align="center" wrap>
          <Flex align="center" gap={3}>
            <Button variant="outline" onClick={() => navigate(`/prompts/${id}`)}>
              <Flex align="center" gap={2}>
                <Icon icon={ArrowLeft} size={18} />
                <Text>{t('common.back')}</Text>
              </Flex>
            </Button>
            
            <Flex align="center" gap={2}>
              <Icon icon={GitCompare} size={28} />
              <Heading level={1} size="xl">
                {t('version.compareTitle')}
              </Heading>
            </Flex>
          </Flex>

          <Badge className="bg-primary">
            <Flex align="center" gap={1}>
              <Icon icon={AlertCircle} size={14} />
              <Text size="sm">{changeCount} {t('version.changes')}</Text>
            </Flex>
          </Badge>
        </Flex>

        <Card>
          <CardHeader>
            <Flex justify="between" align="center">
              <Flex align="center" gap={4}>
                <Badge variant="outline">
                  <Flex align="center" gap={1}>
                    <Icon icon={FileText} size={14} />
                    <Text size="sm">v{diff.version1.version}</Text>
                  </Flex>
                </Badge>
                <Icon icon={GitCompare} size={20} className="text-muted-foreground" />
                <Badge variant="outline">
                  <Flex align="center" gap={1}>
                    <Icon icon={FileText} size={14} />
                    <Text size="sm">v{diff.version2.version}</Text>
                  </Flex>
                </Badge>
              </Flex>
            </Flex>
          </CardHeader>

          <CardContent>
            <Grid cols={2} gap={0}>
              <VersionDiffPanel
                version={diff.version1}
                isVersion1={true}
                differences={diff.differences}
              />
              <VersionDiffPanel
                version={diff.version2}
                isVersion1={false}
                differences={diff.differences}
              />
            </Grid>
          </CardContent>
        </Card>
      </Flex>
    </Container>
  )
}

export default PromptVersionComparePage