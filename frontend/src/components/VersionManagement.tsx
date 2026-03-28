import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock, GitCompare, User, ChevronLeft, ChevronRight, FileText, FilePlus, FileMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { versionsApi, ResourceVersion, UserInfo, DiffResult } from '@/api/versions'
import { Flex } from '@/components/layout/Flex'
import { Text } from '@/components/typography/Text'
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'

interface VersionManagementProps {
  resourceId: string
  resourceType: 'skill' | 'prompt'
}

const VersionManagement: React.FC<VersionManagementProps> = ({
  resourceId,
  resourceType,
}) => {
  const { t, i18n } = useTranslation()
  const [versions, setVersions] = useState<ResourceVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVersions, setSelectedVersions] = useState<ResourceVersion[]>([])
  const [diffMode, setDiffMode] = useState<'side-by-side' | 'inline'>('side-by-side')
  const [activeTab, setActiveTab] = useState<string>('content')
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null)
  const [loadingDiff, setLoadingDiff] = useState(false)
  const [progress, setProgress] = useState({ stage: '', percent: 0, message: '' })
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [fileContents, setFileContents] = useState<Map<string, { old?: string; new?: string }>>(new Map())

  useEffect(() => {
    // 当有文件选中时，自动切换到文件 Tab
    if (selectedFiles.length > 0 && diffResult) {
      setActiveTab('files')
    } else if (diffResult) {
      setActiveTab('content')
    }
  }, [selectedFiles.length, diffResult])

  useEffect(() => {
    fetchVersions()
  }, [resourceId, resourceType])

  const fetchVersions = async () => {
    try {
      setLoading(true)
      const data = await versionsApi.getVersions(resourceId, resourceType, {
        sortBy: 'versionNumber',
        sortOrder: 'desc'
      })
      // 确保只有第一个（最新）版本被标记为当前版本
      const versionsWithCurrentFlag = data.versions.map((version, index) => ({
        ...version,
        isActive: index === 0
      }))
      setVersions(versionsWithCurrentFlag)
    } catch (error) {
      console.error('Failed to fetch versions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCompare = async () => {
    if (selectedVersions.length < 2) return

    setLoadingDiff(true)
    setProgress({ stage: 'starting', percent: 0, message: 'Starting comparison...' })

    try {
      const [oldVersion, newVersion] = selectedVersions
      console.log('Starting compare, has diffResult:', !!diffResult, 'selectedFiles:', selectedFiles)
      
      // 如果已经有 diffResult（自动加载的），只加载选中文件的内容
      if (diffResult) {
        setProgress({ stage: 'loading', percent: 50, message: t('version.loadingFileContents') })
        
        const filesToLoad = selectedFiles.length > 0 ? selectedFiles : diffResult.modified.map(f => f.path)
        console.log('Files to load:', filesToLoad)
        
        if (filesToLoad.length > 0) {
          const [oldContents, newContents] = await Promise.all([
            Promise.all(filesToLoad.map(f => 
              versionsApi.getVersionFileContent(resourceId, resourceType, oldVersion.version, f)
                .then(r => {
                  console.log('Loaded old content for:', f, 'size:', r?.content?.length)
                  return r.content
                })
                .catch((e) => {
                  console.error('Failed to load old content for:', f, e)
                  return null
                })
            )),
            Promise.all(filesToLoad.map(f => 
              versionsApi.getVersionFileContent(resourceId, resourceType, newVersion.version, f)
                .then(r => {
                  console.log('Loaded new content for:', f, 'size:', r?.content?.length)
                  return r.content
                })
                .catch((e) => {
                  console.error('Failed to load new content for:', f, e)
                  return null
                })
            )),
          ])
          
          const contents = new Map<string, { old?: string; new?: string }>()
          filesToLoad.forEach((f, i) => {
            contents.set(f, { old: oldContents[i] || undefined, new: newContents[i] || undefined })
          })
          
          console.log('Setting file contents, size:', contents.size)
          setFileContents(contents)
        }
      } else {
        // 如果没有 diffResult，进行完整对比
        const response = await versionsApi.compareVersionsDetailed(
          resourceId,
          resourceType,
          oldVersion.version,
          newVersion.version,
          selectedFiles.length > 0 ? selectedFiles.join(',') : undefined
        )

        console.log('Full compare response:', response)
        setDiffResult(response.diff)
        if (response.fileContents) {
          setFileContents(new Map(Object.entries(response.fileContents)))
        }
      }
    } catch (error) {
      console.error('Comparison failed:', error)
    } finally {
      setLoadingDiff(false)
    }
  }

  const toggleFileSelection = async (filePath: string) => {
    const isSelected = selectedFiles.includes(filePath)

    // 单选模式：如果已选中则取消，否则只选中这一个
    const newSelectedFiles = isSelected ? [] : [filePath]

    setSelectedFiles(newSelectedFiles)

    // 如果选中文件且内容未加载，加载文件内容
    if (!isSelected && selectedVersions.length === 2) {
      try {
        const [oldVersion, newVersion] = selectedVersions

        // 检查内容是否已加载
        if (!fileContents.has(filePath)) {
          const [oldContent, newContent] = await Promise.all([
            versionsApi.getVersionFileContent(resourceId, resourceType, oldVersion.version, filePath).catch(() => null),
            versionsApi.getVersionFileContent(resourceId, resourceType, newVersion.version, filePath).catch(() => null),
          ])

          setFileContents(prev => {
            const next = new Map(prev)
            next.set(filePath, {
              old: oldContent?.content,
              new: newContent?.content,
            })
            return next
          })
        }
      } catch (error) {
        console.error('Failed to load file content:', error)
      }
    }
  }

  const formatDate = (date: string) => {
    const locale = i18n.language === 'zh' ? 'zh-CN' : 'en-US'
    return new Date(date).toLocaleString(locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getUsername = (createdBy: string | UserInfo): string => {
    if (typeof createdBy === 'string') return createdBy
    return createdBy.username || t('version.unknownUser')
  }

  const handleVersionSelect = async (version: ResourceVersion) => {
    const index = selectedVersions.findIndex(v => v._id === version._id)
    
    if (index > -1) {
      // 取消选中
      const newSelected = selectedVersions.filter(v => v._id !== version._id)
      setSelectedVersions(newSelected)
      // 如果取消后不足 2 个版本，清空 diff
      if (newSelected.length < 2) {
        setDiffResult(null)
        setFileContents(new Map())
        setSelectedFiles([])
      }
    } else {
      // 选中（最多 3 个）
      if (selectedVersions.length >= 3) {
        return
      }
      const newSelected = [...selectedVersions, version]
      setSelectedVersions(newSelected)
      
      // 如果选中了 2 个版本，自动加载文件对比列表
      if (newSelected.length === 2) {
        await loadVersionDiff(newSelected[0], newSelected[1])
      }
    }
  }

  const loadVersionDiff = async (oldVersion: ResourceVersion, newVersion: ResourceVersion) => {
    try {
      setLoadingDiff(true)
      setProgress({ stage: 'loading', percent: 50, message: t('version.loadingDiff') })
      
      const diff = await versionsApi.getVersionDiff(
        resourceId,
        resourceType,
        oldVersion.version,
        newVersion.version
      )
      
      setDiffResult(diff)
      setSelectedFiles([])
      setFileContents(new Map())
    } catch (error) {
      console.error('Failed to load version diff:', error)
    } finally {
      setLoadingDiff(false)
    }
  }

  const clearSelection = () => {
    setSelectedVersions([])
  }

  const isSelected = (version: ResourceVersion) => {
    return selectedVersions.some(v => v._id === version._id)
  }

  const checkScroll = () => {
    const container = scrollContainerRef.current
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container
      setShowLeftArrow(scrollLeft > 10)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScroll()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScroll)
      return () => container.removeEventListener('scroll', checkScroll)
    }
  }, [versions])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const showComparison = selectedVersions.length >= 2

  return (
    <div className="space-y-6">
      {/* 时间线视图 - 水平卡片布局 */}
      <div>
        <Flex justify="between" align="center" className="mb-2">
          <Text className="font-medium text-lg">{t('version.timeline')}</Text>
          
          {/* 选中版本后显示对比按钮 */}
          {selectedVersions.length > 0 && (
            <Flex gap={2} align="center">
              <Badge variant={selectedVersions.length >= 2 ? "default" : "secondary"}>
                {selectedVersions.length} / 3
              </Badge>
              {selectedVersions.length >= 2 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleCompare}
                  disabled={selectedVersions.length < 2 || loadingDiff}
                >
                  <GitCompare size={16} className="mr-2" />
                  {t('version.compare')}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={clearSelection}>
                {t('common.cancel')}
              </Button>
            </Flex>
          )}
        </Flex>

        <div className="relative">
          {/* 滚动按钮 - 根据内容自动显示/隐藏 */}
          {showLeftArrow && (
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 shadow-md"
              onClick={() => scroll('left')}
            >
              <ChevronLeft size={16} />
            </Button>
          )}
          {showRightArrow && (
            <Button
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 shadow-md"
              onClick={() => scroll('right')}
            >
              <ChevronRight size={16} />
            </Button>
          )}

          {/* 版本卡片容器 */}
          <div 
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto pb-4 px-8 scroll-smooth"
            style={{ scrollbarWidth: 'thin' }}
          >
            {versions.map((version) => {
              const versionIsSelected = isSelected(version)

              return (
                <Card
                  key={version._id}
                  className={`min-w-[280px] cursor-pointer transition-all hover:shadow-lg relative ${
                    versionIsSelected
                      ? 'border-primary bg-primary/5 ring-2 ring-primary'
                      : 'border-border'
                  }`}
                  onClick={() => handleVersionSelect(version)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* 版本号和标签 */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            variant={version.isActive ? "default" : "outline"}
                            className={version.isActive ? 'bg-primary' : ''}
                          >
                            v{version.version}
                          </Badge>
                          {version.isActive && (
                            <Badge variant="secondary" className="text-xs">
                              {t('version.current')}
                            </Badge>
                          )}
                        </div>
                        {/* 原型组件（Checkbox） */}
                        <div
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={versionIsSelected}
                            onCheckedChange={() => {
                              handleVersionSelect(version)
                            }}
                          />
                        </div>
                      </div>

                      {/* 变更日志 */}
                      <div className="min-h-[40px]">
                        <Text size="sm" className="line-clamp-2 text-muted-foreground">
                          {version.changelog || t('version.noChangelog')}
                        </Text>
                      </div>

                      {/* 时间和作者 */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{formatDate(version.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User size={12} />
                          <span>{getUsername(version.createdBy)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      {/* 进度显示 */}
      {loadingDiff && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <Flex align="center" gap={2}>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <Text size="sm">{progress.message}</Text>
            </Flex>
          </CardContent>
        </Card>
      )}

      {/* 文件选择器（仅在有 diffResult 时显示） */}
      {diffResult && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <Text className="font-medium mb-2">
              {t('version.selectFilesToCompare')} {selectedFiles.length > 0 && `(${selectedFiles.length} ${t('version.selected')})`}
            </Text>

            <div className="max-h-48 overflow-y-auto border rounded p-2 space-y-1">
              {diffResult.modified.map(file => (
                <div
                  key={file.path}
                  onClick={() => toggleFileSelection(file.path)}
                >
                  <Flex
                    align="center"
                    gap={2}
                    className="p-1 hover:bg-muted rounded cursor-pointer"
                  >
                    <Checkbox checked={selectedFiles.includes(file.path)} />
                    <FileText className="w-4 h-4" />
                    <Text size="sm" className="flex-1 truncate">{file.path}</Text>
                    <Badge variant="outline" className="text-xs">{t('version.modified')}</Badge>
                  </Flex>
                </div>
              ))}
              {diffResult.added.map(file => (
                <div
                  key={file.path}
                  onClick={() => toggleFileSelection(file.path)}
                >
                  <Flex
                    align="center"
                    gap={2}
                    className="p-1 hover:bg-muted rounded cursor-pointer"
                  >
                    <Checkbox checked={selectedFiles.includes(file.path)} />
                    <FilePlus className="w-4 h-4 text-green-500" />
                    <Text size="sm" className="flex-1 truncate">{file.path}</Text>
                    <Badge variant="outline" className="text-xs text-green-500">{t('version.added')}</Badge>
                  </Flex>
                </div>
              ))}
              {diffResult.deleted.map(file => (
                <div
                  key={file.path}
                  onClick={() => toggleFileSelection(file.path)}
                >
                  <Flex
                    align="center"
                    gap={2}
                    className="p-1 hover:bg-muted rounded cursor-pointer"
                  >
                    <Checkbox checked={selectedFiles.includes(file.path)} />
                    <FileMinus className="w-4 h-4 text-red-500" />
                    <Text size="sm" className="flex-1 truncate">{file.path}</Text>
                    <Badge variant="outline" className="text-xs text-red-500">{t('version.deleted')}</Badge>
                  </Flex>
                </div>
              ))}
            </div>

            {diffResult.unchanged.length > 0 && (
              <Text size="sm" className="text-muted-foreground mt-2">
                {diffResult.unchanged.length} {t('version.unchangedFiles')}
              </Text>
            )}
          </CardContent>
        </Card>
      )}

      {/* 对比视图 */}
      {showComparison && (
        <div className="space-y-4">
          <Flex justify="between" align="center">
            <Text className="font-medium text-lg">{t('version.comparison')}</Text>
            <Flex gap={2}>
              <Button
                variant={diffMode === 'side-by-side' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDiffMode('side-by-side')}
              >
                {t('version.sideBySide')}
              </Button>
              <Button
                variant={diffMode === 'inline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDiffMode('inline')}
              >
                {t('version.inline')}
              </Button>
            </Flex>
          </Flex>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="content">{t('version.content')}</TabsTrigger>
              {diffResult && (
                <TabsTrigger value="files">
                  {t('version.files')} ({selectedFiles.length || diffResult.modified.length})
                </TabsTrigger>
              )}
              <TabsTrigger value="description">{t('version.description')}</TabsTrigger>
              <TabsTrigger value="changelog">{t('version.changelog')}</TabsTrigger>
            </TabsList>

            <TabsContent value="files" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  {selectedFiles.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <Text>{t('version.noFilesSelected')}</Text>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedFiles.map(filePath => {
                        const content = fileContents.get(filePath)
                        if (!content) return null
                        
                        return (
                          <div key={filePath} className="border-b last:border-b-0">
                            <div className="bg-muted px-4 py-2">
                              <Text className="font-medium text-sm">{filePath}</Text>
                            </div>
                            <ReactDiffViewer
                              oldValue={content.old || ''}
                              newValue={content.new || ''}
                              splitView={diffMode === 'side-by-side'}
                              compareMethod={DiffMethod.WORDS}
                              useDarkTheme={false}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  {selectedVersions.length === 2 ? (
                    <ReactDiffViewer
                      oldValue={selectedVersions[0].content || ''}
                      newValue={selectedVersions[1].content || ''}
                      splitView={diffMode === 'side-by-side'}
                      compareMethod={DiffMethod.WORDS}
                      useDarkTheme={false}
                      leftTitle={`v${selectedVersions[0].version}`}
                      rightTitle={`v${selectedVersions[1].version}`}
                    />
                  ) : (
                    <div className="p-4 space-y-4">
                      {selectedVersions.map((version) => (
                        <div key={version._id}>
                          <Text className="font-medium mb-2">v{version.version}</Text>
                          <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                            <code>{version.content}</code>
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="description" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  {selectedVersions.length === 2 ? (
                    <ReactDiffViewer
                      oldValue={selectedVersions[0].content || ''}
                      newValue={selectedVersions[1].content || ''}
                      splitView={diffMode === 'side-by-side'}
                      compareMethod={DiffMethod.WORDS}
                      useDarkTheme={false}
                      leftTitle={`v${selectedVersions[0].version}`}
                      rightTitle={`v${selectedVersions[1].version}`}
                    />
                  ) : (
                    <div className="p-4 space-y-4">
                      {selectedVersions.map((version) => (
                        <div key={version._id}>
                          <Text className="font-medium mb-2">v{version.version}</Text>
                          <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                            <code>{version.content}</code>
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="changelog" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  {selectedVersions.length === 2 ? (
                    <ReactDiffViewer
                      oldValue={selectedVersions[0].changelog || ''}
                      newValue={selectedVersions[1].changelog || ''}
                      splitView={diffMode === 'side-by-side'}
                      compareMethod={DiffMethod.WORDS}
                      useDarkTheme={false}
                      leftTitle={`v${selectedVersions[0].version}`}
                      rightTitle={`v${selectedVersions[1].version}`}
                    />
                  ) : (
                    <div className="p-4 space-y-4">
                      {selectedVersions.map((version) => (
                        <div key={version._id}>
                          <Text className="font-medium mb-2">v{version.version}</Text>
                          <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                            <code>{version.changelog}</code>
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}

export default VersionManagement
