# Skill 管理优化方案

**文档版本**: v1.0  
**创建日期**: 2026-03-18  
**问题分析**: 当前 Skill 管理只支持 ZIP 包上传，无法在线预览和修改内容  
**优化目标**: 提升用户体验，支持在线预览、编辑、测试和管理

---

## 一、问题分析

### 1.1 当前实现

**上传流程**:
1. 用户上传 ZIP 包
2. 后端解压并验证结构
3. 检查 SKILL.md 文件
4. 验证通过后保存
5. 用户只能下载 ZIP 包，无法在线查看内容

**存在问题**:
- ❌ **无法预览**: 用户上传后无法查看 Skill 的具体内容和文件结构
- ❌ **无法编辑**: 修改 Skill 需要重新上传整个 ZIP 包
- ❌ **无法测试**: 上传后无法在线测试 Skill 是否正常工作
- ❌ **无法调试**: 遇到问题时无法在线调试
- ❌ **用户体验差**: 类似"黑盒"操作，缺乏透明度
- ❌ **版本管理困难**: 每次修改都需要上传新版本，无法增量更新

### 1.2 用户痛点

**对创作者**:
- 上传后无法确认内容是否正确
- 修改一个小错误需要重新打包上传
- 无法在线测试和调试
- 无法查看其他用户的 Skill 实现细节

**对使用者**:
- 下载前无法预览 Skill 内容
- 无法确认 Skill 是否符合需求
- 无法了解 Skill 的实现方式
- 无法快速学习和参考

---

## 二、优化方案

### 2.1 在线预览功能

#### 功能描述

允许用户在线查看 Skill 的文件结构和内容，无需下载 ZIP 包。

#### 核心功能

**1. 文件树展示**
- 展示 Skill 的完整文件结构
- 支持展开/折叠目录
- 显示文件类型图标
- 显示文件大小
- 显示最后修改时间

**2. 文件预览**
- **代码文件**: 语法高亮显示（支持多种语言）
- **Markdown 文件**: 渲染为 HTML，支持代码块和表格
- **图片文件**: 直接显示图片
- **文本文件**: 纯文本显示
- **二进制文件**: 显示文件信息，不显示内容

**3. 文件信息**
- 文件路径
- 文件大小
- 文件类型
- 最后修改时间
- 文件权限（如果适用）

**4. 预览设置**
- 代码字体大小调整
- 代码主题切换（亮色/暗色）
- 行号显示/隐藏
- 自动换行/不换行

#### 技术方案

**后端实现**:
```typescript
// 新增文件预览 API
export const previewSkillFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId, filePath } = req.params;
    
    const skill = await Skill.findById(skillId);
    if (!skill) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }
    
    // 检查访问权限
    const hasAccess = 
      skill.visibility === 'public' || 
      String(skill.owner) === req.user?.userId;
    
    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    // 获取最新版本的文件
    const latestVersion = skill.versions[skill.versions.length - 1];
    if (!latestVersion || !latestVersion.url) {
      res.status(400).json({ error: 'No file available' });
      return;
    }
    
    // 解压 ZIP 包
    const tempDir = path.join(process.cwd(), 'temp', `preview-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    
    try {
      await extractZip(path.join(process.cwd(), latestVersion.url), tempDir);
      
      // 读取指定文件
      const fullPath = path.join(tempDir, filePath);
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      const stats = fs.statSync(fullPath);
      
      res.json({
        content: fileContent,
        size: stats.size,
        mimeType: getMimeType(filePath),
        isBinary: isBinaryFile(filePath),
      });
    } finally {
      // 清理临时目录
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  } catch (error) {
    console.error('Preview skill file error:', error);
    res.status(500).json({ error: 'Failed to preview file' });
  }
};

// 获取文件树
export const getSkillFileTree = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId } = req.params;
    
    const skill = await Skill.findById(skillId);
    if (!skill) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }
    
    // 检查访问权限
    const hasAccess = 
      skill.visibility === 'public' || 
      String(skill.owner) === req.user?.userId;
    
    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    // 获取最新版本的文件
    const latestVersion = skill.versions[skill.versions.length - 1];
    if (!latestVersion || !latestVersion.url) {
      res.status(400).json({ error: 'No file available' });
      return;
    }
    
    // 解压 ZIP 包
    const tempDir = path.join(process.cwd(), 'temp', `tree-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    
    try {
      await extractZip(path.join(process.cwd(), latestVersion.url), tempDir);
      
      // 构建文件树
      const fileTree = buildFileTree(tempDir);
      
      res.json({ fileTree });
    } finally {
      // 清理临时目录
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  } catch (error) {
    console.error('Get skill file tree error:', error);
    res.status(500).json({ error: 'Failed to get file tree' });
  }
};

// 构建文件树
function buildFileTree(dirPath: string, basePath: string = ''): any {
  const items = fs.readdirSync(dirPath);
  const tree: any = [];
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stats = fs.statSync(fullPath);
    const relativePath = basePath ? path.join(basePath, item) : item;
    
    if (stats.isDirectory()) {
      tree.push({
        name: item,
        type: 'directory',
        path: relativePath,
        children: buildFileTree(fullPath, relativePath),
      });
    } else {
      tree.push({
        name: item,
        type: 'file',
        path: relativePath,
        size: stats.size,
        mimeType: getMimeType(item),
        isBinary: isBinaryFile(item),
      });
    }
  }
  
  return tree.sort((a, b) => {
    // 目录优先
    if (a.type === 'directory' && b.type !== 'directory') return -1;
    if (a.type !== 'directory' && b.type === 'directory') return 1;
    // 按名称排序
    return a.name.localeCompare(b.name);
  });
}

// 获取 MIME 类型
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.js': 'application/javascript',
    '.ts': 'application/typescript',
    '.json': 'application/json',
    '.md': 'text/markdown',
    '.html': 'text/html',
    '.css': 'text/css',
    '.txt': 'text/plain',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// 判断是否为二进制文件
function isBinaryFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.pdf', '.zip', '.exe', '.dll'];
  return binaryExtensions.includes(ext);
}
```

**前端实现**:
```typescript
// 文件预览组件
import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';

interface FilePreviewProps {
  skillId: string;
  filePath: string;
  content: string;
  mimeType: string;
  isBinary: boolean;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  skillId,
  filePath,
  content,
  mimeType,
  isBinary,
}) => {
  const [fontSize, setFontSize] = useState(14);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const getLanguage = (filePath: string): string => {
    const ext = path.extname(filePath).toLowerCase();
    const languages: { [key: string]: string } = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.json': 'json',
      '.md': 'markdown',
      '.html': 'html',
      '.css': 'css',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust',
    };
    return languages[ext] || 'text';
  };

  const renderContent = () => {
    if (isBinary) {
      if (mimeType.startsWith('image/')) {
        return (
          <div className="flex justify-center items-center p-8">
            <img
              src={`/api/skills/${skillId}/preview/${encodeURIComponent(filePath)}`}
              alt={filePath}
              className="max-w-full max-h-[600px]"
            />
          </div>
        );
      }
      return (
        <div className="flex items-center justify-center p-8 text-gray-500">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>Binary file - cannot preview</p>
            <p className="text-sm mt-2">File type: {mimeType}</p>
          </div>
        </div>
      );
    }

    if (mimeType === 'text/markdown') {
      return (
        <div className="prose dark:prose-invert max-w-none p-6">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      );
    }

    // 代码文件
    const language = getLanguage(filePath);
    return (
      <SyntaxHighlighter
        language={language}
        style={theme === 'dark' ? vscDarkPlus : undefined}
        showLineNumbers={showLineNumbers}
        customStyle={{ fontSize: `${fontSize}px` }}
        className="rounded-lg"
      >
        {content}
      </SyntaxHighlighter>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {filePath}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFontSize(fontSize - 2)}
            disabled={fontSize <= 10}
            className="px-2 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            A-
          </button>
          <button
            onClick={() => setFontSize(fontSize + 2)}
            disabled={fontSize >= 24}
            className="px-2 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            A+
          </button>
          <button
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            className="px-2 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {showLineNumbers ? 'Hide Lines' : 'Show Lines'}
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="px-2 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

// 文件树组件
interface FileTreeNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  mimeType?: string;
  isBinary?: boolean;
  children?: FileTreeNode[];
}

interface FileTreeProps {
  fileTree: FileTreeNode[];
  onFileSelect: (filePath: string) => void;
  selectedFile: string | null;
}

const FileTree: React.FC<FileTreeProps> = ({ fileTree, onFileSelect, selectedFile }) => {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  const toggleDir = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  const renderNode = (node: FileTreeNode, level: number = 0) => {
    const isSelected = selectedFile === node.path;
    const isExpanded = expandedDirs.has(node.path);

    return (
      <div key={node.path} style={{ paddingLeft: `${level * 16}px` }}>
        <div
          className={`flex items-center gap-2 py-1 px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded ${
            isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''
          }`}
          onClick={() => {
            if (node.type === 'directory') {
              toggleDir(node.path);
            } else {
              onFileSelect(node.path);
            }
          }}
        >
          {node.type === 'directory' ? (
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : null}
          <FileIcon type={node.type} mimeType={node.mimeType} />
          <span className="text-sm">{node.name}</span>
          {node.size && (
            <span className="text-xs text-gray-500 ml-auto">
              {formatFileSize(node.size)}
            </span>
          )}
        </div>
        {node.type === 'directory' && isExpanded && node.children && (
          <div>
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto">
      {fileTree.map((node) => renderNode(node))}
    </div>
  );
};

const FileIcon: React.FC<{ type: string; mimeType?: string }> = ({ type, mimeType }) => {
  if (type === 'directory') {
    return (
      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      </svg>
    );
  }

  if (mimeType?.startsWith('image/')) {
    return (
      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }

  return (
    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
```

#### 用户价值

🔴 **高** - 用户可以在不下载的情况下查看 Skill 内容，提升使用体验

#### 技术复杂度

🟡 **中** - 需要实现文件解压、文件树构建、多种文件类型预览

#### 实施成本

🟡 **中** - 需要前端代码高亮库和 Markdown 渲染库

#### 优先级

**P1** - 下一迭代

#### 时间估算

2-3 周

---

### 2.2 在线编辑功能

#### 功能描述

允许用户在线编辑 Skill 的文件，无需重新打包上传。

#### 核心功能

**1. 代码编辑器**
- 语法高亮
- 代码补全
- 代码格式化
- 错误提示
- 多光标编辑
- 查找和替换

**2. 文件操作**
- 创建新文件
- 删除文件
- 重命名文件
- 移动文件

**3. 实时保存**
- 自动保存
- 手动保存
- 保存历史
- 版本对比

**4. 编辑权限**
- 所有者可以编辑
- 协作者可以编辑（基于权限）
- 只读用户只能查看

#### 技术方案

**后端实现**:
```typescript
// 更新文件内容
export const updateSkillFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId, filePath } = req.params;
    const { content } = req.body;
    
    const skill = await Skill.findById(skillId);
    if (!skill) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }
    
    // 检查编辑权限
    if (String(skill.owner) !== req.user?.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    
    // 获取最新版本的文件
    const latestVersion = skill.versions[skill.versions.length - 1];
    if (!latestVersion || !latestVersion.url) {
      res.status(400).json({ error: 'No file available' });
      return;
    }
    
    // 解压 ZIP 包
    const tempDir = path.join(process.cwd(), 'temp', `edit-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    
    try {
      await extractZip(path.join(process.cwd(), latestVersion.url), tempDir);
      
      // 更新文件内容
      const fullPath = path.join(tempDir, filePath);
      fs.writeFileSync(fullPath, content, 'utf8');
      
      // 重新打包
      const newZipPath = path.join(process.cwd(), 'uploads', `skill-${skillId}-${Date.now()}.zip`);
      await createZip(tempDir, newZipPath);
      
      // 创建新版本
      const newVersionNumber = incrementVersion(skill.version);
      const newVersion = {
        version: newVersionNumber,
        url: newZipPath,
        createdAt: new Date(),
      };
      
      skill.versions.push(newVersion);
      skill.version = newVersionNumber;
      await skill.save();
      
      res.json({
        message: 'File updated successfully',
        version: newVersionNumber,
      });
    } finally {
      // 清理临时目录
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  } catch (error) {
    console.error('Update skill file error:', error);
    res.status(500).json({ error: 'Failed to update file' });
  }
};

// 创建新文件
export const createSkillFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId } = req.params;
    const { filePath, content } = req.body;
    
    const skill = await Skill.findById(skillId);
    if (!skill) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }
    
    // 检查编辑权限
    if (String(skill.owner) !== req.user?.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    
    // 获取最新版本的文件
    const latestVersion = skill.versions[skill.versions.length - 1];
    if (!latestVersion || !latestVersion.url) {
      res.status(400).json({ error: 'No file available' });
      return;
    }
    
    // 解压 ZIP 包
    const tempDir = path.join(process.cwd(), 'temp', `create-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    
    try {
      await extractZip(path.join(process.cwd(), latestVersion.url), tempDir);
      
      // 创建新文件
      const fullPath = path.join(tempDir, filePath);
      const dirPath = path.dirname(fullPath);
      
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, content || '', 'utf8');
      
      // 重新打包
      const newZipPath = path.join(process.cwd(), 'uploads', `skill-${skillId}-${Date.now()}.zip`);
      await createZip(tempDir, newZipPath);
      
      // 创建新版本
      const newVersionNumber = incrementVersion(skill.version);
      const newVersion = {
        version: newVersionNumber,
        url: newZipPath,
        createdAt: new Date(),
      };
      
      skill.versions.push(newVersion);
      skill.version = newVersionNumber;
      await skill.save();
      
      res.json({
        message: 'File created successfully',
        version: newVersionNumber,
      });
    } finally {
      // 清理临时目录
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  } catch (error) {
    console.error('Create skill file error:', error);
    res.status(500).json({ error: 'Failed to create file' });
  }
};

// 删除文件
export const deleteSkillFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId, filePath } = req.params;
    
    const skill = await Skill.findById(skillId);
    if (!skill) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }
    
    // 检查编辑权限
    if (String(skill.owner) !== req.user?.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    
    // 获取最新版本的文件
    const latestVersion = skill.versions[skill.versions.length - 1];
    if (!latestVersion || !latestVersion.url) {
      res.status(400).json({ error: 'No file available' });
      return;
    }
    
    // 解压 ZIP 包
    const tempDir = path.join(process.cwd(), 'temp', `delete-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    
    try {
      await extractZip(path.join(process.cwd(), latestVersion.url), tempDir);
      
      // 删除文件
      const fullPath = path.join(tempDir, filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      
      // 重新打包
      const newZipPath = path.join(process.cwd(), 'uploads', `skill-${skillId}-${Date.now()}.zip`);
      await createZip(tempDir, newZipPath);
      
      // 创建新版本
      const newVersionNumber = incrementVersion(skill.version);
      const newVersion = {
        version: newVersionNumber,
        url: newZipPath,
        createdAt: new Date(),
      };
      
      skill.versions.push(newVersion);
      skill.version = newVersionNumber;
      await skill.save();
      
      res.json({
        message: 'File deleted successfully',
        version: newVersionNumber,
      });
    } finally {
      // 清理临时目录
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  } catch (error) {
    console.error('Delete skill file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
};

// 创建 ZIP 包
async function createZip(sourceDir: string, zipPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = require('archiver')('zip', { zlib: { level: 9 } });
    
    output.on('close', resolve);
    archive.on('error', reject);
    
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

// 版本号递增
function incrementVersion(version: string): string {
  const parts = version.split('.').map(Number);
  parts[2] = (parts[2] || 0) + 1;
  return parts.join('.');
}
```

**前端实现**:
```typescript
// 使用 Monaco Editor 实现代码编辑器
import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  skillId: string;
  filePath: string;
  content: string;
  onSave: (content: string) => Promise<void>;
  readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  skillId,
  filePath,
  content,
  onSave,
  readOnly = false,
}) => {
  const [editorContent, setEditorContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSave, setAutoSave] = useState(true);

  const getLanguage = (filePath: string): string => {
    const ext = path.extname(filePath).toLowerCase();
    const languages: { [key: string]: string } = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.json': 'json',
      '.md': 'markdown',
      '.html': 'html',
      '.css': 'css',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust',
    };
    return languages[ext] || 'plaintext';
  };

  const handleSave = async () => {
    if (readOnly) return;
    
    setIsSaving(true);
    try {
      await onSave(editorContent);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Save failed:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 自动保存
  useEffect(() => {
    if (!autoSave || readOnly) return;
    
    const timer = setTimeout(() => {
      if (editorContent !== content) {
        handleSave();
      }
    }, 3000); // 3秒后自动保存
    
    return () => clearTimeout(timer);
  }, [editorContent, autoSave]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editorContent]);

  return (
    <div className="h-full flex flex-col">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {filePath}
          </span>
          {lastSaved && (
            <span className="text-xs text-gray-500">
              上次保存: {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
              className="rounded"
            />
            自动保存
          </label>
          <button
            onClick={handleSave}
            disabled={readOnly || isSaving}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                保存中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                保存
              </>
            )}
          </button>
        </div>
      </div>

      {/* 编辑器 */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={getLanguage(filePath)}
          value={editorContent}
          onChange={(value) => setEditorContent(value || '')}
          theme="vs-dark"
          options={{
            readOnly,
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>
    </div>
  );
};
```

#### 用户价值

🔴 **高** - 用户可以在线编辑 Skill，无需重新打包上传，大幅提升开发效率

#### 技术复杂度

🔴 **高** - 需要实现代码编辑器、文件操作、版本管理

#### 实施成本

🔴 **高** - 需要 Monaco Editor 和复杂的文件操作逻辑

#### 优先级

**P1** - 下一迭代

#### 时间估算

4-6 周

---

### 2.3 在线测试功能

#### 功能描述

允许用户在线测试 Skill，验证其功能是否正常。

#### 核心功能

**1. 测试环境**
- 沙箱环境
- 模拟 API 调用
- 测试数据输入
- 测试结果展示

**2. 测试用例**
- 创建测试用例
- 保存测试用例
- 运行测试用例
- 查看测试结果

**3. 调试工具**
- 日志查看
- 错误追踪
- 性能分析
- 断点调试

**4. 测试报告**
- 测试覆盖率
- 测试通过率
- 性能指标
- 错误详情

#### 技术方案

**后端实现**:
```typescript
// 测试 Skill
export const testSkill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId } = req.params;
    const { testData } = req.body;
    
    const skill = await Skill.findById(skillId);
    if (!skill) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }
    
    // 检查访问权限
    const hasAccess = 
      skill.visibility === 'public' || 
      String(skill.owner) === req.user?.userId;
    
    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    // 获取最新版本的文件
    const latestVersion = skill.versions[skill.versions.length - 1];
    if (!latestVersion || !latestVersion.url) {
      res.status(400).json({ error: 'No file available' });
      return;
    }
    
    // 解压 ZIP 包
    const tempDir = path.join(process.cwd(), 'temp', `test-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    
    try {
      await extractZip(path.join(process.cwd(), latestVersion.url), tempDir);
      
      // 读取 SKILL.md
      const skillMdPath = path.join(tempDir, 'SKILL.md');
      const skillMdContent = fs.readFileSync(skillMdPath, 'utf8');
      
      // 解析 Skill 配置
      const manifest = parseSkillManifest(skillMdContent);
      
      // 创建沙箱环境
      const sandbox = createSandbox(tempDir, manifest);
      
      // 运行测试
      const result = await runTest(sandbox, testData);
      
      res.json({
        success: true,
        result,
        manifest,
      });
    } finally {
      // 清理临时目录
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  } catch (error) {
    console.error('Test skill error:', error);
    res.status(500).json({ 
      error: 'Failed to test skill',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// 创建沙箱环境
function createSandbox(skillDir: string, manifest: any): any {
  // 使用 vm2 或类似库创建安全的沙箱环境
  const { VM } = require('vm2');
  
  const vm = new VM({
    timeout: 10000, // 10秒超时
    sandbox: {
      console: {
        log: (...args: any[]) => {
          // 捕获日志
          console.log('[Skill]', ...args);
        },
        error: (...args: any[]) => {
          console.error('[Skill Error]', ...args);
        },
      },
      require: (moduleName: string) => {
        // 限制可用的模块
        const allowedModules = ['lodash', 'moment', 'axios'];
        if (!allowedModules.includes(moduleName)) {
          throw new Error(`Module ${moduleName} is not allowed`);
        }
        return require(moduleName);
      },
    },
  });
  
  // 加载 Skill 代码
  const skillCodePath = path.join(skillDir, 'index.js');
  if (fs.existsSync(skillCodePath)) {
    const skillCode = fs.readFileSync(skillCodePath, 'utf8');
    vm.run(skillCode);
  }
  
  return vm;
}

// 运行测试
async function runTest(sandbox: any, testData: any): Promise<any> {
  try {
    // 调用 Skill 的主函数
    const result = sandbox.run(testData);
    return {
      success: true,
      output: result,
      executionTime: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: Date.now(),
    };
  }
}
```

**前端实现**:
```typescript
// 测试组件
import { useState } from 'react';

interface SkillTestProps {
  skillId: string;
}

const SkillTest: React.FC<SkillTestProps> = ({ skillId }) => {
  const [testData, setTestData] = useState('{}');
  const [testResult, setTestResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunTest = async () => {
    setIsRunning(true);
    setError(null);
    setTestResult(null);
    
    try {
      const data = JSON.parse(testData);
      const response = await fetch(`/api/skills/${skillId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testData: data }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTestResult(result.result);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '测试失败');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Skill 测试</h2>
      
      {/* 测试数据输入 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">测试数据 (JSON)</label>
        <textarea
          value={testData}
          onChange={(e) => setTestData(e.target.value)}
          className="w-full h-48 p-4 border rounded-lg font-mono text-sm"
          placeholder='{"input": "test data"}'
        />
      </div>
      
      {/* 运行按钮 */}
      <button
        onClick={handleRunTest}
        disabled={isRunning}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRunning ? '测试中...' : '运行测试'}
      </button>
      
      {/* 错误显示 */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-bold text-red-800 mb-2">测试失败</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {/* 测试结果 */}
      {testResult && (
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-4">测试结果</h3>
          
          {testResult.success ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-bold text-green-800">测试通过</span>
              </div>
              <div className="mt-4">
                <h4 className="font-semibold mb-2">输出结果:</h4>
                <pre className="bg-white p-4 rounded border overflow-auto">
                  {JSON.stringify(testResult.output, null, 2)}
                </pre>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                执行时间: {new Date(testResult.executionTime).toLocaleTimeString()}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="font-bold text-red-800">测试失败</span>
              </div>
              <div className="mt-4">
                <h4 className="font-semibold mb-2">错误信息:</h4>
                <p className="text-red-700">{testResult.error}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

#### 用户价值

🟡 **中** - 用户可以在线测试 Skill，验证功能，提升开发效率

#### 技术复杂度

🔴 **高** - 需要实现沙箱环境、测试框架、调试工具

#### 实施成本

🔴 **高** - 需要沙箱环境和复杂的测试逻辑

#### 优先级

**P2** - 后续规划

#### 时间估算

4-5 周

---

### 2.4 导入导出功能

#### 功能描述

支持从外部源导入 Skill，以及将 Skill 导出到外部源。

#### 核心功能

**1. GitHub 导入**
- 从 GitHub 仓库导入
- 支持公开和私有仓库
- 支持指定分支和标签
- 自动同步更新

**2. GitLab 导入**
- 从 GitLab 仓库导入
- 支持公开和私有仓库
- 支持指定分支和标签

**3. 导出功能**
- 导出为 ZIP 包
- 导出到 GitHub
- 导出到 GitLab
- 导出为不同格式

**4. 同步功能**
- 自动同步 GitHub 仓库
- 手动触发同步
- 同步历史记录
- 冲突解决

#### 技术方案

**后端实现**:
```typescript
// 从 GitHub 导入
export const importFromGitHub = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { repoUrl, branch, token } = req.body;
    
    // 解析 GitHub 仓库 URL
    const { owner, repo } = parseGitHubUrl(repoUrl);
    
    // 克隆仓库
    const tempDir = path.join(process.cwd(), 'temp', `github-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    
    try {
      const cloneUrl = token 
        ? `https://${token}@github.com/${owner}/${repo}.git`
        : `https://github.com/${owner}/${repo}.git`;
      
      await exec(`git clone --depth 1 --branch ${branch || 'main'} ${cloneUrl} ${tempDir}`);
      
      // 验证 Skill 结构
      const validationResult = await validateSkillUpload('', tempDir);
      if (!validationResult.valid) {
        res.status(400).json({
          error: 'Invalid skill structure',
          details: validationResult.errors,
        });
        return;
      }
      
      // 创建 Skill
      const skill = new Skill({
        name: validationResult.structure?.name || repo,
        description: validationResult.structure?.description || `Imported from ${repoUrl}`,
        owner: req.user?.userId,
        version: validationResult.structure?.version || '1.0.0',
        category: validationResult.structure?.category || 'general',
        tags: validationResult.structure?.tags || [],
        visibility: 'private',
        source: {
          type: 'github',
          url: repoUrl,
          branch: branch || 'main',
          lastSync: new Date(),
        },
      });
      
      // 打包 ZIP
      const zipPath = path.join(process.cwd(), 'uploads', `skill-${Date.now()}.zip`);
      await createZip(tempDir, zipPath);
      
      skill.versions.push({
        version: skill.version,
        url: zipPath,
        createdAt: new Date(),
      });
      
      await skill.save();
      
      res.json({
        message: 'Skill imported successfully',
        skill,
      });
    } finally {
      // 清理临时目录
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  } catch (error) {
    console.error('Import from GitHub error:', error);
    res.status(500).json({ error: 'Failed to import from GitHub' });
  }
};

// 同步 GitHub 仓库
export const syncGitHubRepo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId } = req.params;
    
    const skill = await Skill.findById(skillId);
    if (!skill) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }
    
    // 检查权限
    if (String(skill.owner) !== req.user?.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    
    // 检查是否有 GitHub 源
    if (!skill.source || skill.source.type !== 'github') {
      res.status(400).json({ error: 'Skill is not linked to GitHub' });
      return;
    }
    
    // 克隆最新代码
    const tempDir = path.join(process.cwd(), 'temp', `sync-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    
    try {
      const { owner, repo } = parseGitHubUrl(skill.source.url);
      const cloneUrl = `https://github.com/${owner}/${repo}.git`;
      
      await exec(`git clone --depth 1 --branch ${skill.source.branch} ${cloneUrl} ${tempDir}`);
      
      // 验证 Skill 结构
      const validationResult = await validateSkillUpload('', tempDir);
      if (!validationResult.valid) {
        res.status(400).json({
          error: 'Invalid skill structure',
          details: validationResult.errors,
        });
        return;
      }
      
      // 打包 ZIP
      const zipPath = path.join(process.cwd(), 'uploads', `skill-${Date.now()}.zip`);
      await createZip(tempDir, zipPath);
      
      // 创建新版本
      const newVersionNumber = incrementVersion(skill.version);
      skill.versions.push({
        version: newVersionNumber,
        url: zipPath,
        createdAt: new Date(),
      });
      
      skill.version = newVersionNumber;
      skill.source.lastSync = new Date();
      await skill.save();
      
      res.json({
        message: 'Skill synced successfully',
        version: newVersionNumber,
      });
    } finally {
      // 清理临时目录
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  } catch (error) {
    console.error('Sync GitHub repo error:', error);
    res.status(500).json({ error: 'Failed to sync GitHub repo' });
  }
};

// 解析 GitHub URL
function parseGitHubUrl(url: string): { owner: string; repo: string } {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
  if (!match) {
    throw new Error('Invalid GitHub URL');
  }
  return {
    owner: match[1],
    repo: match[2],
  };
}
```

**前端实现**:
```typescript
// GitHub 导入组件
import { useState } from 'react';

interface GitHubImportProps {
  onImport: (skill: any) => void;
}

const GitHubImport: React.FC<GitHubImportProps> = ({ onImport }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [token, setToken] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setIsImporting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/skills/import/github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoUrl, branch, token }),
      });
      
      const result = await response.json();
      
      if (result.error) {
        setError(result.error);
      } else {
        onImport(result.skill);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">从 GitHub 导入</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">GitHub 仓库 URL</label>
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="w-full p-3 border rounded-lg"
            placeholder="https://github.com/owner/repo"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">分支</label>
          <input
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="w-full p-3 border rounded-lg"
            placeholder="main"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">GitHub Token (可选，用于私有仓库)</label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full p-3 border rounded-lg"
            placeholder="ghp_xxxxxxxxxxxx"
          />
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        <button
          onClick={handleImport}
          disabled={isImporting || !repoUrl}
          className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isImporting ? '导入中...' : '导入'}
        </button>
      </div>
    </div>
  );
};
```

#### 用户价值

🟡 **中** - 用户可以方便地从 GitHub 导入和同步 Skill，提升开发效率

#### 技术复杂度

🟡 **中** - 需要实现 Git 集成和同步逻辑

#### 实施成本

🟡 **中** - 需要安装 Git 工具和配置

#### 优先级

**P2** - 后续规划

#### 时间估算

3-4 周

---

## 三、实施优先级

### 3.1 短期目标（1-2 个月）

**核心任务**:
1. ✅ 在线预览功能 - 用户可以查看 Skill 内容
2. ✅ 基础编辑功能 - 用户可以在线编辑文件

**预期效果**:
- 用户可以在线查看 Skill 内容，无需下载
- 用户可以在线编辑文件，无需重新打包
- 用户体验提升 50%

### 3.2 中期目标（3-4 个月）

**核心任务**:
1. ✅ 完整编辑功能 - 支持所有文件操作
2. ✅ 在线测试功能 - 用户可以测试 Skill
3. ✅ GitHub 导入 - 用户可以从 GitHub 导入 Skill

**预期效果**:
- 用户可以完整管理 Skill 文件
- 用户可以在线测试和调试 Skill
- 用户可以方便地导入外部 Skill
- 开发效率提升 80%

### 3.3 长期目标（6 个月以上）

**核心任务**:
1. ✅ 实时协作编辑 - 多人同时编辑
2. ✅ 高级测试功能 - 完整的测试框架
3. ✅ 多平台导入导出 - 支持多个平台

**预期效果**:
- 团队协作效率提升 100%
- 测试覆盖率达到 80%
- 支持主流平台集成

---

## 四、技术栈补充

### 4.1 新增依赖

**后端**:
- `vm2`: 沙箱环境
- `archiver`: 创建 ZIP 包
- `simple-git`: Git 操作

**前端**:
- `@monaco-editor/react`: Monaco Editor 集成
- `react-syntax-highlighter`: 代码高亮
- `react-markdown`: Markdown 渲染
- `react-tree-view`: 文件树组件

### 4.2 新增 API 接口

- `GET /api/skills/:id/file-tree` - 获取文件树
- `GET /api/skills/:id/preview/:filePath` - 预览文件
- `PUT /api/skills/:id/files/:filePath` - 更新文件
- `POST /api/skills/:id/files` - 创建文件
- `DELETE /api/skills/:id/files/:filePath` - 删除文件
- `POST /api/skills/:id/test` - 测试 Skill
- `POST /api/skills/import/github` - 从 GitHub 导入
- `POST /api/skills/:id/sync/github` - 同步 GitHub

---

## 五、风险评估与应对

### 5.1 技术风险

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| 文件操作性能问题 | 🟡 中 | 🟡 中 | 实现缓存机制，优化文件操作 |
| 沙箱环境安全性 | 🟡 中 | 🔴 高 | 使用成熟的沙箱库，限制可用模块 |
| 编辑器性能问题 | 🟡 中 | 🟡 中 | 实现懒加载，优化大文件处理 |
| Git 同步冲突 | 🟡 中 | 🟡 中 | 实现冲突解决机制，提供手动解决选项 |

### 5.2 产品风险

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| 用户不接受在线编辑 | 🟡 中 | 🟡 中 | 提供下载编辑选项，A/B 测试 |
| 编辑功能影响性能 | 🟡 中 | 🟡 中 | 性能测试，优化实现，提供开关 |
| 测试环境不稳定 | 🟡 中 | 🟡 中 | 完善错误处理，提供详细错误信息 |

---

## 六、总结与建议

### 6.1 核心结论

Skill 管理的在线预览和编辑功能是提升用户体验的关键。通过实施这些功能，可以显著提升用户的开发效率和使用体验。

**重点方向**:
1. **在线预览** - 用户可以查看 Skill 内容
2. **在线编辑** - 用户可以在线编辑文件
3. **在线测试** - 用户可以测试 Skill
4. **导入导出** - 用户可以方便地导入导出 Skill

### 6.2 关键建议

#### 对产品团队
- 🎯 **优先实施在线预览功能** - 快速提升用户体验
- 👥 **收集用户反馈** - 持续优化功能
- 📊 **数据分析** - 了解用户使用习惯

#### 对技术团队
- 🧪 **保证代码质量** - 确保功能稳定性
- 🏗️ **保持架构灵活性** - 支持快速迭代
- ⚡ **关注性能** - 优化文件操作和编辑器性能

### 6.3 下一步行动

**本周必做**:
1. ✅ 设计在线预览功能 UI
2. ✅ 实现文件树组件
3. ✅ 实现文件预览组件
4. ✅ 实现后端文件预览 API

**本月目标**:
1. ✅ 完成在线预览功能
2. ✅ 完成基础编辑功能
3. ✅ 完成在线测试功能
4. ✅ 完成 GitHub 导入功能

---

**文档结束**
