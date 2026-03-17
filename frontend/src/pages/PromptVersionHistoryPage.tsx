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
import VersionCard from '@/components/VersionCard'
import { Badge } from '@/components/ui/badge'
import { 
  History, 
  Search, 
  GitCompare,
  ArrowLeft,
  ChevronRight,
  ArrowRightLeft
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

interface PromptVersion {
  version: string
  content: string
  description: string
  variables: Array<{
    name: string
    type: string
    required: boolean
    defaultValue?: string
    description?: string
  }>
  createdAt: Date
}

export const PromptVersionHistoryPage: React.FC = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [currentVersion, setCurrentVersion] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [rollbackDialog, setRollbackDialog] = useState<{
    open: boolean
    version: string
  }>({ open: false, version: '' })

  useEffect(() => {
    fetchVersions()
  }, [id])

  const fetchVersions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/prompts/${id}/versions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setVersions(data.versions)
      setCurrentVersion(data.currentVersion)
    } catch (error) {
      console.error('Failed to fetch versions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredVersions = versions.filter(version =>
    version.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
    version.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isOwner = user && versions.length > 0

  const handleRollback = async (version: string) => {
    try {
      await fetch(`/api/prompts/${id}/rollback/${version}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      await fetchVersions()
      setRollbackDialog({ open: false, version: '' })
    } catch (error) {
      console.error('Rollback failed:', error)
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
      window.location.href = `/prompts/${id}/compare?version1=${ver1}&version2=${ver2}`
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
        {/* 面包屑导航 */}
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

        {/* 页面标题栏 */}
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
            {/* 搜索框 */}
            <div className="relative">
              <Icon icon={Search} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder={t('version.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-56 h-9"
              />
            </div>
            
            {/* 对比按钮 */}
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

        {/* 选中版本提示 - 改进视觉表现 */}
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

        {/* 版本列表 */}
        {filteredVersions.length === 0 ? (
          <EmptyState
            icon="history"
            title={t('version.noVersions')}
            description={t('version.noVersionsDescription')}
          />
        ) : (
          <div className="space-y-3">
            {filteredVersions.map((version, index) => (
              <VersionCard
                key={version.version}
                version={version}
                isCurrent={version.version === currentVersion}
                isOwner={isOwner}
                isSelected={selectedVersions.includes(version.version)}
                onSelect={() => handleVersionSelect(version.version)}
                onRollback={() => setRollbackDialog({ open: true, version: version.version })}
                onCompare={() => {
                  handleCompare(currentVersion, version.version)
                }}
                showConnector={index < filteredVersions.length - 1}
              />
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
        variant="destructive"
      />
    </Container>
  )
}

export default PromptVersionHistoryPage
