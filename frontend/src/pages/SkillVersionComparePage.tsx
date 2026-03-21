import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Container } from '@/components/layout/Container'
import { Flex } from '@/components/layout/Flex'
import { Grid } from '@/components/layout/Grid'
import { Text } from '@/components/typography/Text'
import { Heading } from '@/components/typography/Heading'
import { Icon } from '@/components/ui/Icon'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { 
  GitCompare, 
  ArrowLeft,
  FileText,
  AlertCircle,
  Plus,
  Minus,
  Edit
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { versionsApi, VersionComparison, ResourceVersion } from '../api/versions'
import { toast } from 'sonner'

export const SkillVersionComparePage: React.FC = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const [comparison, setComparison] = useState<VersionComparison | null>(null)
  const [fromVersion, setFromVersion] = useState<ResourceVersion | null>(null)
  const [toVersion, setToVersion] = useState<ResourceVersion | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const from = urlParams.get('from')
    const to = urlParams.get('to')
    
    if (id && from && to) {
      fetchComparison(from, to)
      fetchVersionDetails(from, to)
    }
  }, [id])

  const fetchComparison = async (from: string, to: string) => {
    try {
      setLoading(true)
      const data = await versionsApi.compareVersions(id!, 'skill', from, to)
      setComparison(data)
    } catch (error) {
      console.error('Failed to fetch comparison:', error)
      toast.error(t('version.compareFailed'))
      setComparison(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchVersionDetails = async (from: string, to: string) => {
    try {
      const [fromData, toData] = await Promise.all([
        versionsApi.getVersion(id!, 'skill', from),
        versionsApi.getVersion(id!, 'skill', to)
      ])
      setFromVersion(fromData)
      setToVersion(toData)
    } catch (error) {
      console.error('Failed to fetch version details:', error)
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

  if (!comparison) {
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
          <Button variant="outline" onClick={() => navigate(`/skills/${id}/versions`)}>
            <Flex align="center" gap={2}>
              <Icon icon={ArrowLeft} size={18} />
              <Text>{t('version.backToHistory')}</Text>
            </Flex>
          </Button>
        </Flex>
      </Container>
    )
  }

  return (
    <Container maxWidth="full">
      <Flex direction="column" gap={6}>
        <Flex justify="between" align="center" wrap>
          <Flex align="center" gap={3}>
            <Button variant="outline" onClick={() => navigate(`/skills/${id}/versions`)}>
              <Flex align="center" gap={2}>
                <Icon icon={ArrowLeft} size={18} />
                <Text>{t('version.backToHistory')}</Text>
              </Flex>
            </Button>
            
            <Flex align="center" gap={2}>
              <Icon icon={GitCompare} size={28} />
              <Heading level={1} size="xl">
                {t('version.compareTitle')}
              </Heading>
            </Flex>
          </Flex>

          <Flex gap={2}>
            {comparison.summary.added > 0 && (
              <Badge className="bg-green-500">
                <Flex align="center" gap={1}>
                  <Icon icon={Plus} size={14} />
                  <Text size="sm">{comparison.summary.added} {t('version.added')}</Text>
                </Flex>
              </Badge>
            )}
            {comparison.summary.modified > 0 && (
              <Badge className="bg-yellow-500">
                <Flex align="center" gap={1}>
                  <Icon icon={Edit} size={14} />
                  <Text size="sm">{comparison.summary.modified} {t('version.modified')}</Text>
                </Flex>
              </Badge>
            )}
            {comparison.summary.deleted > 0 && (
              <Badge className="bg-red-500">
                <Flex align="center" gap={1}>
                  <Icon icon={Minus} size={14} />
                  <Text size="sm">{comparison.summary.deleted} {t('version.deleted')}</Text>
                </Flex>
              </Badge>
            )}
          </Flex>
        </Flex>

        <Card>
          <CardHeader>
            <Flex justify="between" align="center">
              <Flex align="center" gap={4}>
                <Badge variant="outline">
                  <Flex align="center" gap={1}>
                    <Icon icon={FileText} size={14} />
                    <Text size="sm">{fromVersion?.version || comparison.fromVersion}</Text>
                  </Flex>
                </Badge>
                <Icon icon={GitCompare} size={20} className="text-muted-foreground" />
                <Badge variant="outline">
                  <Flex align="center" gap={1}>
                    <Icon icon={FileText} size={14} />
                    <Text size="sm">{toVersion?.version || comparison.toVersion}</Text>
                  </Flex>
                </Badge>
              </Flex>
            </Flex>
          </CardHeader>

          <CardContent>
            <Grid cols={2} gap={4}>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>{t('version.fromVersion')}: {fromVersion?.version || comparison.fromVersion}</CardTitle>
                    {fromVersion && (
                      <Text size="sm" color="muted">
                        {new Date(fromVersion.createdAt).toLocaleString()}
                      </Text>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {comparison.changes.map((change, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <Flex justify="between" align="center">
                            <Text className="font-medium">{change.path}</Text>
                            <Badge 
                              variant={
                                change.type === 'added' ? 'default' :
                                change.type === 'modified' ? 'secondary' :
                                'destructive'
                              }
                            >
                              {change.type}
                            </Badge>
                          </Flex>
                          {change.oldContent && (
                            <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded">
                              <Text size="sm" className="text-red-700 dark:text-red-300">
                                {change.oldContent}
                              </Text>
                            </div>
                          )}
                          {change.newContent && (
                            <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 rounded">
                              <Text size="sm" className="text-green-700 dark:text-green-300">
                                {change.newContent}
                              </Text>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {comparison.changes.length === 0 && (
                        <Text className="text-muted-foreground text-center py-8">
                          {t('version.noChanges')}
                        </Text>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>{t('version.toVersion')}: {toVersion?.version || comparison.toVersion}</CardTitle>
                    {toVersion && (
                      <Text size="sm" color="muted">
                        {new Date(toVersion.createdAt).toLocaleString()}
                      </Text>
                    )}
                    {toVersion && (
                      <Text size="sm" className="mt-2">
                        {toVersion.changelog}
                      </Text>
                    )}
                  </CardHeader>
                  <CardContent>
                    {toVersion && toVersion.files.length > 0 && (
                      <div>
                        <Text className="font-medium mb-2">{t('version.filesInVersion')}:</Text>
                        <div className="space-y-2">
                          {toVersion.files.map((file, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                              <Icon icon={FileText} size={16} />
                              <Text size="sm">{file.filename}</Text>
                              <Text size="xs" color="muted">
                                ({(file.size / 1024).toFixed(1)} KB)
                              </Text>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {toVersion && toVersion.tags.length > 0 && (
                      <div className="mt-4">
                        <Text className="font-medium mb-2">{t('version.tags')}:</Text>
                        <Flex gap={2} wrap>
                          {toVersion.tags.map((tag, index) => (
                            <Badge key={index} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </Flex>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </Grid>
          </CardContent>
        </Card>
      </Flex>
    </Container>
  )
}

export default SkillVersionComparePage
