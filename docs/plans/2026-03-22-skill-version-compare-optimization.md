# Skill 版本对比功能优化 - 压缩包支持

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 skill 版本对比功能添加对上传文件夹压缩包的智能对比支持，实现基于文件结构和内容的增量对比算法，提升大型压缩包的处理性能。

**Architecture:**
- 后端：新增压缩包解析和文件内容提取服务，扩展 `compareVersions` API 支持文件级对比
- 前端：扩展 `VersionManagement` 组件，增加文件树选择器和进度显示
- 存储：利用现有 `ResourceVersion.files` 字段存储文件清单（manifest），支持增量更新

**Tech Stack:**
- Backend: `adm-zip`/`unzipper` 压缩包解析, 流式处理, 缓存层
- Frontend: React, `react-diff-viewer`, 文件树组件
- Database: 利用现有 `ResourceVersion` 模型扩展

---

## 一、问题分析

### 1.1 当前实现
- `ResourceVersion.files` 仅存储文件名、路径、大小，不包含压缩包内文件结构
- `compareVersions` API 仅对比文件级别的元数据变化，无法对比实际文件内容
- 前端仅对比 `content`（描述文本）、`changelog` 字段

### 1.2 目标
实现真正的压缩包内文件内容对比，支持：
- 增量提取（只提取变更的文件）
- 智能对比（优先对比变更文件）
- 选择性对比（用户可选文件/目录）
- 进度反馈和错误处理

---

## 二、后端实现

### Task 1: 创建压缩包解析服务

**Files:**
- Create: `backend/src/services/ZipAnalyzerService.ts`

**Step 1: 创建基础服务结构**

```typescript
// backend/src/services/ZipAnalyzerService.ts
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createLogger } from '../utils/logger';

const logger = createLogger('ZipAnalyzerService');

export interface FileEntry {
  path: string;
  name: string;
  size: number;
  isDirectory: boolean;
  checksum?: string;
  content?: string;
}

export interface ZipManifest {
  version: string;
  totalFiles: number;
  totalSize: number;
  files: FileEntry[];
  checksum: string;
  createdAt: Date;
}

export interface DiffResult {
  added: FileEntry[];
  deleted: FileEntry[];
  modified: FileEntry[];
  unchanged: FileEntry[];
  summary: {
    addedCount: number;
    deletedCount: number;
    modifiedCount: number;
    unchangedCount: number;
  };
}

export class ZipAnalyzerService {
  private cache: Map<string, { manifest: ZipManifest; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  async extractManifest(zipPath: string, forceRefresh = false): Promise<ZipManifest> {
    const cached = this.cache.get(zipPath);
    if (cached && !forceRefresh && Date.now() - cached.timestamp < this.CACHE_TTL) {
      logger.debug('Using cached manifest', { zipPath });
      return cached.manifest;
    }

    logger.debug('Extracting zip manifest', { zipPath });
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();
    
    const files: FileEntry[] = [];
    let totalSize = 0;

    for (const entry of entries) {
      if (entry.isDirectory) continue;
      
      const content = zip.readAsText(entry);
      const checksum = crypto.createHash('md5').update(content).digest('hex');
      
      files.push({
        path: entry.entryName,
        name: path.basename(entry.entryName),
        size: entry.header.size,
        isDirectory: entry.isDirectory,
        checksum,
      });
      totalSize += entry.header.size;
    }

    const manifest: ZipManifest = {
      version: '1.0',
      totalFiles: files.length,
      totalSize,
      files,
      checksum: crypto.createHash('md5').update(JSON.stringify(files)).digest('hex'),
      createdAt: new Date(),
    };

    this.cache.set(zipPath, { manifest, timestamp: Date.now() });
    return manifest;
  }

  async compareZips(oldZipPath: string, newZipPath: string): Promise<DiffResult> {
    const [oldManifest, newManifest] = await Promise.all([
      this.extractManifest(oldZipPath),
      this.extractManifest(newZipPath),
    ]);

    return this.compareManifests(oldManifest, newManifest);
  }

  compareManifests(oldManifest: ZipManifest, newManifest: ZipManifest): DiffResult {
    const oldFiles = new Map(oldManifest.files.map(f => [f.path, f]));
    const newFiles = new Map(newManifest.files.map(f => [f.path, f]));

    const result: DiffResult = {
      added: [],
      deleted: [],
      modified: [],
      unchanged: [],
      summary: { addedCount: 0, deletedCount: 0, modifiedCount: 0, unchangedCount: 0 },
    };

    for (const [path, oldFile] of oldFiles) {
      if (!newFiles.has(path)) {
        result.deleted.push(oldFile);
        result.summary.deletedCount++;
      } else {
        const newFile = newFiles.get(path)!;
        if (oldFile.checksum !== newFile.checksum) {
          result.modified.push({ ...newFile, checksum: newFile.checksum });
          result.summary.modifiedCount++;
        } else {
          result.unchanged.push(newFile);
          result.summary.unchangedCount++;
        }
      }
    }

    for (const [path, newFile] of newFiles) {
      if (!oldFiles.has(path)) {
        result.added.push(newFile);
        result.summary.addedCount++;
      }
    }

    return result;
  }

  async extractFileContent(zipPath: string, filePath: string): Promise<string | null> {
    try {
      const zip = new AdmZip(zipPath);
      const entry = zip.getEntry(filePath);
      if (!entry) return null;
      return zip.readAsText(entry);
    } catch (error) {
      logger.error('Failed to extract file content', { zipPath, filePath, error });
      return null;
    }
  }

  async extractFiles(zipPath: string, filePaths: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    await Promise.all(
      filePaths.map(async (fp) => {
        const content = await this.extractFileContent(zipPath, fp);
        if (content !== null) {
          results.set(fp, content);
        }
      })
    );
    return results;
  }

  clearCache(zipPath?: string): void {
    if (zipPath) {
      this.cache.delete(zipPath);
    } else {
      this.cache.clear();
    }
  }
}

export const zipAnalyzerService = new ZipAnalyzerService();
```

**Step 2: 运行测试验证服务**

创建测试文件 `backend/src/__tests__/zipAnalyzer.test.ts` 并运行 `npm test -- --testPathPattern="zipAnalyzer"` 验证基础功能。

---

### Task 2: 扩展 ResourceVersion 模型存储文件清单

**Files:**
- Modify: `backend/src/models/ResourceVersion.ts`

**Step 1: 添加 manifest 字段**

```typescript
// 在 IResourceVersion 接口中添加
export interface IResourceVersion extends Document {
  // ... existing fields
  
  // 新增：文件清单（压缩包内文件结构）
  fileManifest?: {
    totalFiles: number;
    totalSize: number;
    files: Array<{
      path: string;
      name: string;
      size: number;
      checksum: string;
    }>;
    checksum: string;
  };
  
  // 新增：对比状态
  comparisonStatus?: 'pending' | 'completed' | 'failed';
}
```

**Step 2: 更新 schema**

```typescript
// 在 resourceVersionSchema 中添加
resourceVersionSchema.add({
  fileManifest: {
    totalFiles: Number,
    totalSize: Number,
    files: [{
      path: String,
      name: String,
      size: Number,
      checksum: String,
    }],
    checksum: String,
  },
  comparisonStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
});
```

---

### Task 3: 扩展版本对比 API

**Files:**
- Modify: `backend/src/controllers/versionController.ts`

**Step 1: 添加增强版对比函数**

在 `compareVersions` 函数后添加新函数：

```typescript
export const compareVersionsDetailed = async (req: Request, res: Response) => {
  try {
    const { resourceId } = req.params;
    const { from, to, files } = req.query;

    const [fromVersion, toVersion] = await Promise.all([
      ResourceVersion.findOne({ resourceId, version: from }),
      ResourceVersion.findOne({ resourceId, version: to })
    ]);

    if (!fromVersion || !toVersion) {
      return res.status(404).json({
        success: false,
        error: 'One or both versions not found'
      });
    }

    // 获取文件路径
    const fromZipPath = fromVersion.files[0]?.path;
    const toZipPath = toVersion.files[0]?.path;

    if (!fromZipPath || !toZipPath) {
      return res.status(400).json({
        success: false,
        error: 'No zip files available for comparison'
      });
    }

    const fullFromPath = path.join(process.cwd(), fromZipPath);
    const fullToPath = path.join(process.cwd(), toZipPath);

    // 检查文件是否存在
    if (!fs.existsSync(fullFromPath) || !fs.existsSync(fullToPath)) {
      return res.status(400).json({
        success: false,
        error: 'Zip file not found'
      });
    }

    // 执行对比
    const diffResult = await zipAnalyzerService.compareZips(fullFromPath, fullToPath);

    // 如果指定了特定文件，获取内容
    let fileContents: Map<string, { old?: string; new?: string }> | undefined;
    if (files && typeof files === 'string') {
      const fileList = files.split(',');
      const [oldContents, newContents] = await Promise.all([
        zipAnalyzerService.extractFiles(fullFromPath, fileList),
        zipAnalyzerService.extractFiles(fullToPath, fileList),
      ]);
      
      fileContents = new Map();
      for (const fp of fileList) {
        fileContents.set(fp, {
          old: oldContents.get(fp),
          new: newContents.get(fp),
        });
      }
    }

    res.json({
      success: true,
      data: {
        fromVersion: fromVersion.version,
        toVersion: toVersion.version,
        diff: diffResult,
        fileContents,
      }
    });
  } catch (error) {
    console.error('详细对比版本时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare versions in detail'
    });
  }
};
```

**Step 2: 添加文件内容获取 API**

```typescript
export const getVersionFileContent = async (req: Request, res: Response) => {
  try {
    const { resourceId, version, filePath } = req.params;
    const { encoding = 'utf8' } = req.query;

    const versionData = await ResourceVersion.findOne({ resourceId, version });
    if (!versionData) {
      return res.status(404).json({
        success: false,
        error: 'Version not found'
      });
    }

    const zipPath = versionData.files[0]?.path;
    if (!zipPath) {
      return res.status(400).json({
        success: false,
        error: 'No zip file in this version'
      });
    }

    const fullPath = path.join(process.cwd(), zipPath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        error: 'Zip file not found'
      });
    }

    const content = await zipAnalyzerService.extractFileContent(fullPath, filePath);
    if (content === null) {
      return res.status(404).json({
        success: false,
        error: 'File not found in zip'
      });
    }

    res.json({
      success: true,
      data: {
        path: filePath,
        content,
        encoding,
      }
    });
  } catch (error) {
    console.error('获取版本文件内容时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file content'
    });
  }
};
```

---

### Task 4: 在版本创建时生成文件清单

**Files:**
- Modify: `backend/src/utils/resourceHelpers.ts`

**Step 1: 在 createResourceVersion 中添加 manifest 生成**

```typescript
import { zipAnalyzerService } from '../services/ZipAnalyzerService';

export async function createResourceVersion(params: {
  resourceId: Types.ObjectId;
  resourceType: 'skill' | 'prompt';
  version: string;
  content: string;
  files: any[];
  changelog: string;
  tags: string[];
  createdBy: Types.ObjectId;
}): Promise<IResourceVersion> {
  let fileManifest;
  
  // 如果有文件，提取 manifest
  if (params.files && params.files.length > 0) {
    const filePath = path.join(process.cwd(), params.files[0].path);
    if (fs.existsSync(filePath)) {
      try {
        fileManifest = await zipAnalyzerService.extractManifest(filePath);
      } catch (error) {
        console.error('Failed to extract file manifest:', error);
      }
    }
  }

  const resourceVersion = new ResourceVersion({
    resourceId: params.resourceId,
    resourceType: params.resourceType,
    version: params.version,
    versionNumber: parseInt(params.version.split('.').join('')),
    content: params.content,
    files: params.files,
    changelog: params.changelog,
    tags: params.tags,
    isActive: true,
    createdBy: params.createdBy,
    fileManifest,
    comparisonStatus: 'completed',
  });

  await resourceVersion.save();
  return resourceVersion;
}
```

---

### Task 5: 添加错误处理和进度追踪

**Files:**
- Modify: `backend/src/services/ZipAnalyzerService.ts`

**Step 1: 添加错误类型和处理**

```typescript
export class ZipAnalyzerError extends Error {
  constructor(
    message: string,
    public code: 'ZIP_NOT_FOUND' | 'INVALID_ZIP' | 'CORRUPTED_ZIP' | 'FILE_NOT_FOUND' | 'EXTRACTION_FAILED',
    public details?: any
  ) {
    super(message);
    this.name = 'ZipAnalyzerError';
  }
}

export interface ProgressCallback {
  (stage: 'reading' | 'extracting' | 'comparing' | 'complete', progress: number, message?: string): void;
}

export async function safeExtractManifest(
  zipPath: string,
  onProgress?: ProgressCallback
): Promise<ZipManifest> {
  if (!fs.existsSync(zipPath)) {
    throw new ZipAnalyzerError('Zip file not found', 'ZIP_NOT_FOUND', { zipPath });
  }

  onProgress?.('reading', 10, 'Reading zip file...');

  try {
    const zip = new AdmZip(zipPath);
    onProgress?.('reading', 30, 'Parsing entries...');
    
    const entries = zip.getEntries();
    const totalEntries = entries.length;
    const files: FileEntry[] = [];
    let processed = 0;

    for (const entry of entries) {
      if (entry.isDirectory) continue;
      
      const content = zip.readAsText(entry);
      const checksum = crypto.createHash('md5').update(content).digest('hex');
      
      files.push({
        path: entry.entryName,
        name: path.basename(entry.entryName),
        size: entry.header.size,
        isDirectory: entry.isDirectory,
        checksum,
      });

      processed++;
      if (processed % 50 === 0) {
        onProgress?.('extracting', 30 + (processed / totalEntries) * 40, `Processing ${processed}/${totalEntries}...`);
      }
    }

    onProgress?.('extracting', 70, 'Computing checksums...');

    const manifest: ZipManifest = {
      version: '1.0',
      totalFiles: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
      files,
      checksum: crypto.createHash('md5').update(JSON.stringify(files)).digest('hex'),
      createdAt: new Date(),
    };

    onProgress?.('complete', 100, 'Done');
    return manifest;
  } catch (error: any) {
    if (error instanceof ZipAnalyzerError) throw error;
    throw new ZipAnalyzerError(
      'Failed to extract zip manifest',
      'EXTRACTION_FAILED',
      { zipPath, error: error.message }
    );
  }
}
```

---

## 三、前端实现

### Task 6: 扩展 VersionManagement 组件

**Files:**
- Modify: `frontend/src/components/VersionManagement.tsx`

**Step 1: 添加文件树状态和进度显示**

```typescript
// 添加新状态
const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
const [loadingDiff, setLoadingDiff] = useState(false);
const [progress, setProgress] = useState({ stage: '', percent: 0, message: '' });
const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
const [fileContents, setFileContents] = useState<Map<string, { old?: string; new?: string }>>(new Map());
```

**Step 2: 添加对比处理函数**

```typescript
const handleCompare = async () => {
  if (selectedVersions.length < 2) return;
  
  setLoadingDiff(true);
  setProgress({ stage: 'starting', percent: 0, message: 'Starting comparison...' });
  
  try {
    const [oldVersion, newVersion] = selectedVersions;
    const response = await versionsApi.compareVersionsDetailed(
      resourceId,
      resourceType,
      oldVersion.version,
      newVersion.version,
      selectedFiles.length > 0 ? selectedFiles.join(',') : undefined
    );
    
    setDiffResult(response.data.diff);
    if (response.data.fileContents) {
      setFileContents(new Map(Object.entries(response.data.fileContents)));
    }
  } catch (error) {
    console.error('Comparison failed:', error);
  } finally {
    setLoadingDiff(false);
  }
};

const toggleFileSelection = (filePath: string) => {
  setSelectedFiles(prev => 
    prev.includes(filePath) 
      ? prev.filter(f => f !== filePath)
      : [...prev, filePath]
  );
};
```

**Step 3: 添加文件树和进度 UI**

在对比视图前添加：

```tsx
{/* 文件选择器（仅在有 diffResult 时显示） */}
{diffResult && (
  <Card className="mb-4">
    <CardContent className="p-4">
      <Flex justify="between" align="center" className="mb-2">
        <Text className="font-medium">Select files to compare ({selectedFiles.length} selected)</Text>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setSelectedFiles(diffResult.modified.map(f => f.path))}
        >
          Select Modified Only
        </Button>
      </Flex>
      
      <div className="max-h-48 overflow-y-auto border rounded p-2">
        {diffResult.modified.map(file => (
          <Flex 
            key={file.path} 
            align="center" 
            gap={2}
            className="p-1 hover:bg-muted rounded cursor-pointer"
            onClick={() => toggleFileSelection(file.path)}
          >
            <Checkbox checked={selectedFiles.includes(file.path)} />
            <FileIcon className="w-4 h-4" />
            <Text size="sm" className="flex-1">{file.path}</Text>
            <Badge variant="outline" className="text-xs">modified</Badge>
          </Flex>
        ))}
        {diffResult.added.map(file => (
          <Flex 
            key={file.path} 
            align="center" 
            gap={2}
            className="p-1 hover:bg-muted rounded cursor-pointer"
            onClick={() => toggleFileSelection(file.path)}
          >
            <Checkbox checked={selectedFiles.includes(file.path)} />
            <FilePlusIcon className="w-4 h-4 text-green-500" />
            <Text size="sm" className="flex-1">{file.path}</Text>
            <Badge variant="outline" className="text-xs text-green-500">added</Badge>
          </Flex>
        ))}
        {diffResult.deleted.map(file => (
          <Flex 
            key={file.path} 
            align="center" 
            gap={2}
            className="p-1 hover:bg-muted rounded cursor-pointer"
            onClick={() => toggleFileSelection(file.path)}
          >
            <Checkbox checked={selectedFiles.includes(file.path)} />
            <FileMinusIcon className="w-4 h-4 text-red-500" />
            <Text size="sm" className="flex-1">{file.path}</Text>
            <Badge variant="outline" className="text-xs text-red-500">deleted</Badge>
          </Flex>
        ))}
      </div>
    </CardContent>
  </Card>
)}

{/* 进度显示 */}
{loadingDiff && (
  <Card className="mb-4">
    <CardContent className="p-4">
      <Flex align="center" gap={2}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <Text size="sm">{progress.message}</Text>
      </Flex>
      <Progress value={progress.percent} className="mt-2" />
    </CardContent>
  </Card>
)}
```

**Step 4: 更新对比按钮调用**

```tsx
<Button 
  variant="default" 
  size="sm" 
  onClick={handleCompare}
  disabled={selectedVersions.length < 2 || loadingDiff}
>
  <GitCompare size={16} className="mr-2" />
  {t('version.compare')}
</Button>
```

---

### Task 7: 添加前端 API 调用

**Files:**
- Modify: `frontend/src/api/versions.ts`

**Step 1: 添加新 API 方法**

```typescript
export const versionsApi = {
  // ... existing methods
  
  compareVersionsDetailed: async (
    resourceId: string,
    resourceType: 'skill' | 'prompt',
    fromVersion: string,
    toVersion: string,
    files?: string
  ): Promise<{ data: { diff: DiffResult; fileContents?: Record<string, { old?: string; new?: string }> } }> => {
    const response = await apiClient.get(`/versions/${resourceType}/${resourceId}/compare/detailed`, {
      params: { from: fromVersion, to: toVersion, files },
    });
    return response.data;
  },

  getVersionFileContent: async (
    resourceId: string,
    resourceType: 'skill' | 'prompt',
    version: string,
    filePath: string
  ): Promise<{ data: { path: string; content: string } }> => {
    const response = await apiClient.get(
      `/versions/${resourceType}/${resourceId}/${version}/files/${encodeURIComponent(filePath)}`
    );
    return response.data;
  },
};
```

---

## 四、路由注册

### Task 8: 注册新路由

**Files:**
- Modify: `backend/src/routes/*.ts` (version routes)

**Step 1: 添加路由**

```typescript
// GET /api/versions/:resourceType/:resourceId/compare/detailed
router.get('/:resourceType/:resourceId/compare/detailed', compareVersionsDetailed);

// GET /api/versions/:resourceType/:resourceId/:version/files/*filePath
router.get('/:resourceType/:resourceId/:version/files/:filePath(*)', getVersionFileContent);
```

---

## 五、测试

### Task 9: 编写单元测试和集成测试

**Files:**
- Create: `backend/src/__tests__/zipAnalyzer.test.ts`
- Create: `backend/src/__tests__/versionCompareIntegration.test.ts`

**测试覆盖：**
1. ZipAnalyzerService: manifest 提取、对比、缓存
2. API: 版本对比、文件内容获取
3. 错误处理: 损坏 zip、无效路径
4. 性能: 大文件处理

---

## 六、验收标准

- [ ] 用户可以选择两个版本进行对比
- [ ] 系统显示文件差异概览（新增/修改/删除）
- [ ] 用户可以选择特定文件进行内容对比
- [ ] 大文件处理有进度反馈
- [ ] 损坏 zip 包有明确错误提示
- [ ] 相同文件不重复提取（缓存）
- [ ] 单元测试覆盖率 > 80%

---

## 七、文件清单

| 文件 | 操作 |
|------|------|
| `backend/src/services/ZipAnalyzerService.ts` | Create |
| `backend/src/models/ResourceVersion.ts` | Modify |
| `backend/src/controllers/versionController.ts` | Modify |
| `backend/src/utils/resourceHelpers.ts` | Modify |
| `backend/src/__tests__/zipAnalyzer.test.ts` | Create |
| `backend/src/__tests__/versionCompareIntegration.test.ts` | Create |
| `frontend/src/components/VersionManagement.tsx` | Modify |
| `frontend/src/api/versions.ts` | Modify |
| `backend/src/routes/*.ts` | Modify |

---

## 执行选项

**Plan complete and saved to `docs/plans/2026-03-22-skill-version-compare-optimization.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
