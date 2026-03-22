import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Container } from '@/components/layout/Container'
import { Flex } from '@/components/layout/Flex'
import { Text } from '@/components/typography/Text'
import { Heading } from '@/components/typography/Heading'
import { Icon } from '@/components/ui/Icon'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  History, 
  Search, 
  GitCompare,
  ArrowLeft,
  ChevronRight,
  ArrowRightLeft,
  Download,
  Tag,
  Clock
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { versionsApi, ResourceVersion } from '../api/versions'
import { toast } from 'sonner'

export const SkillVersionHistoryPage: React.FC = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  const [versions, setVersions] = useState<ResourceVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [rollbackDialog, setRollbackDialog] = useState<{
    open: boolean
    version: string
  }>({ open: false, version: '' })
  const [isRollingBack, setIsRollingBack] = useState(false)
  const [isDownloading, setIsDownloading] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchVersions()
    }
  }, [id])

  const fetchVersions = async () => {
    try {
      setLoading(true)
      const data = await versionsApi.getVersions(id!, 'skill')
      setVersions(data)
    } catch (error) {
      console.error('Failed to fetch versions:', error)
      toast.error(t('version.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  const filteredVersions = versions.filter(version =>
    version.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
    version.changelog.toLowerCase().includes(searchQuery.toLowerCase()) ||
    version.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const isOwner = user !== null

  const handleRollback = async (version: string) => {
    try {
      setIsRollingBack(true)
      await versionsApi.rollbackVersion(id!, 'skill', version)
      await fetchVersions()
      setRollbackDialog({ open: false, version: '' })
      toast.success(t('version.rollbackSuccess'))
    } catch (error) {
      console.error('Rollback failed:', error)
      toast.error(t('version.rollbackFailed'))
    } finally {
      setIsRollingBack(false)
    }
  }

  const handleDownload = async (version: string) => {
    try {
      setIsDownloading(version)
      const blob = await versionsApi.downloadVersion(id!, 'skill', version)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `skill-${id}-version-${version}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success(t('version.downloadSuccess'))
    } catch (error) {
      console.error('Download failed:', error)
      toast.error(t('version.downloadFailed'))
    } finally {
      setIsDownloading(null)
    }
  }

  const handleVersionSelect = (version: string) => {
    if (selectedVersions.includes(version)) {
      setSelectedVersions(prev => prev.filter(v => v !== version))
    } else if (selectedVersions.length < 2) {
      setSelectedVersions(prev => [...prev, version])
    }
  }

  const handleCompare = (v1?: string, v2?: string) => {
    const ver1 = v1 || selectedVersions[0]
    const ver2 = v2 || selectedVersions[1]
    if (ver1 && ver2) {
      navigate(`/skills/${id}/versions/compare?from=${ver1}&to=${ver2}`)
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

  return (
    <Container maxWidth="xl" className="py-6">
      <Flex direction="column" gap={5}>
        <Flex align="center" gap={2} className="text-muted-foreground">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-auto px-0 hover:bg-transparent hover:text-primary"
            onClick={() => navigate(`/skills/${id}`)}
          >
            <Flex align="center" gap={1}>
              <Icon icon={ArrowLeft} size={14} />
              <Text size="sm">{t('skills.detail')}</Text>
            </Flex>
          </Button>
          <Icon icon={ChevronRight} size={14} />
          <Text size="sm" color="secondary">{t('version.history')}</Text>
        </Flex>

        <Flex justify="between" align="center" wrap className="gap-4">
          <Flex align="center" gap={3}>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon icon={History} size={24} className="text-primary" />
            </div>
            <div>
              <Heading level={1} size="xl" className="font-bold">
                {t('version.history')}
              </Heading>
              <Text size="sm" color="muted">
                {t('version.totalCount', { count: versions.length })}
              </Text>
            </div>
          </Flex>
          
          <Flex gap={3} align="center">
            <div className="relative">
              <Icon icon={Search} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder={t('version.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-56 h-9"
              />
            </div>
            
            {selectedVersions.length > 0 && (
              <Badge variant="secondary" className="h-9 px-3">
                <Flex align="center" gap={2}>
                  <Text size="sm">{t('version.selectedCount', { count: selectedVersions.length })}</Text>
                  {selectedVersions.length === 2 && (
                    <Button 
                      size="sm" 
                      className="h-6 px-2 text-xs"
                      onClick={handleCompare}
                    >
                      <Flex align="center" gap={1}>
                        <Icon icon={GitCompare} size={12} />
                        {t('version.compare')}
                      </Flex>
                    </Button>
                  )}
                </Flex>
              </Badge>
            )}
          </Flex>
        </Flex>

        {selectedVersions.length > 0 && (
          <div className={cn(
            "rounded-lg p-4 border-2 transition-all duration-200",
            selectedVersions.length === 2 
              ? "bg-primary/10 border-primary shadow-md" 
              : "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
          )}>
            <Flex align="center" justify="between" wrap className="gap-3">
              <Flex align="center" gap={3}>
                <div className={cn(
                  "p-2 rounded-full",
                  selectedVersions.length === 2 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400"
                )}>
                  <Icon 
                    icon={selectedVersions.length === 2 ? GitCompare : ArrowRightLeft} 
                    size={20} 
                  />
                </div>
                <div>
                  <Text 
                    size="sm" 
                    className={cn(
                      "font-medium",
                      selectedVersions.length === 2 
                        ? "text-primary" 
                        : "text-amber-800 dark:text-amber-400"
                    )}
                  >
                    {selectedVersions.length === 2 
                      ? t('version.readyToCompare') 
                      : t('version.selectAnother')}
                  </Text>
                  <Text 
                    size="xs" 
                    color="secondary"
                    className={selectedVersions.length === 2 ? "text-primary/70" : ""}
                  >
                    {selectedVersions.length === 2 
                      ? t('version.selectedVersions', { v1: selectedVersions[0], v2: selectedVersions[1] })
                      : t('version.selectedOne', { version: selectedVersions[0] })}
                  </Text>
                </div>
              </Flex>
              
              {selectedVersions.length === 2 && (
                <Button 
                  onClick={() => handleCompare()}
                  className="shadow-sm"
                >
                  <Flex align="center" gap={2}>
                    <Icon icon={GitCompare} size={16} />
                    {t('version.compareSelected')}
                  </Flex>
                </Button>
              )}
              
              {selectedVersions.length === 1 && (
                <Button 
                  variant="outline"
                  onClick={() => setSelectedVersions([])}
                  className="border-amber-200 hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-900"
                >
                  {t('common.cancel')}
                </Button>
              )}
            </Flex>
          </div>
        )}

        {filteredVersions.length === 0 ? (
          <EmptyState
            icon="history"
            title={t('version.noVersions')}
            description={t('version.noVersionsDescription')}
          />
        ) : (
          <div className="space-y-4">
            {filteredVersions.map((version, index) => (
              <Card 
                key={version._id}
                className={cn(
                  "transition-all duration-200",
                  selectedVersions.includes(version.version) 
                    ? "border-primary bg-primary/5" 
                    : ""
                )}
              >
                <CardContent className="p-4">
                  <Flex justify="between" align="start" gap={4}>
                    <Flex direction="column" gap={2} className="flex-1">
                      <Flex align="center" gap={3}>
                        <Badge variant={version.isActive ? "default" : "secondary"}>
                          {version.version}
                          {version.isActive && ` (${t('version.current')})`}
                        </Badge>
                        {version.tags.length > 0 && (
                          <Flex gap={1}>
                            {version.tags.map((tag) => (
                              <Badge key={tag} variant="outline" size="sm">
                                <Icon icon={Tag} size={10} className="mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </Flex>
                        )}
                      </Flex>
                      <Text size="sm" className="text-muted-foreground">
                        {version.changelog}
                      </Text>
                      <Flex align="center" gap={4} className="text-xs text-muted-foreground">
                        <Flex align="center" gap={1}>
                          <Icon icon={Clock} size={12} />
                          {new Date(version.createdAt).toLocaleString()}
                        </Flex>
                        {version.files.length > 0 && (
                          <Text>{version.files.length} {t('version.files')}</Text>
                        )}
                      </Flex>
                    </Flex>
                    
                    <Flex gap={2} align="center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVersionSelect(version.version)}
                        disabled={!selectedVersions.includes(version.version) && selectedVersions.length >= 2}
                      >
                        {selectedVersions.includes(version.version) 
                          ? t('version.deselect') 
                          : t('version.select')}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(version.version)}
                        disabled={isDownloading === version.version}
                      >
                        <Flex align="center" gap={1}>
                          {isDownloading === version.version ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <Icon icon={Download} size={14} />
                          )}
                          {t('version.download')}
                        </Flex>
                      </Button>
                      
                      {isOwner && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRollbackDialog({ open: true, version: version.version })}
                          disabled={version.isActive || isRollingBack}
                        >
                          {t('version.rollback')}
                        </Button>
                      )}
                    </Flex>
                  </Flex>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Flex>

      <ConfirmDialog
        open={rollbackDialog.open}
        onOpenChange={(open) => setRollbackDialog({ ...rollbackDialog, open })}
        title={t('version.rollbackConfirmTitle')}
        description={t('version.rollbackConfirmDescription', { version: rollbackDialog.version })}
        confirmText={t('version.confirmRollback')}
        cancelText={t('common.cancel')}
        onConfirm={() => handleRollback(rollbackDialog.version)}
        isLoading={isRollingBack}
        variant="destructive"
      />
    </Container>
  )
}

export default SkillVersionHistoryPage
