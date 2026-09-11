# 在线预览功能模块设计文档

**模块名称**: 在线预览功能  
**文档版本**: v1.0  
**创建日期**: 2026-03-18  
**优先级**: P1  
**预估时间**: 2-3 周

---

## 一、功能概述

### 1.1 功能描述

允许用户在线查看 Skill 的文件结构和内容，无需下载 ZIP 包。支持多种文件类型的预览，包括代码文件、Markdown 文件、图片文件等。

### 1.2 用户价值

- **创作者**: 上传后可以确认内容是否正确，无需下载即可查看
- **使用者**: 下载前可以预览 Skill 内容，确认是否符合需求
- **学习者**: 可以查看其他用户的 Skill 实现细节，快速学习和参考

### 1.3 核心功能

1. **文件树展示**: 展示 Skill 的完整文件结构，支持展开/折叠
2. **文件预览**: 支持多种文件类型的预览（代码、Markdown、图片、文本）
3. **文件信息**: 显示文件路径、大小、类型、修改时间等
4. **预览设置**: 代码字体大小调整、主题切换、行号显示等

---

## 二、技术方案

### 2.1 后端实现

#### 2.1.1 API 接口设计

**获取文件树**
```
GET /api/skills/:skillId/file-tree
```

**预览文件**
```
GET /api/skills/:skillId/preview/:filePath
```

#### 2.1.2 核心函数

```typescript
// 获取文件树
export const getSkillFileTree = async (req: AuthRequest, res: Response): Promise<void>

// 预览文件
export const previewSkillFile = async (req: AuthRequest, res: Response): Promise<void>

// 构建文件树
function buildFileTree(dirPath: string, basePath: string = ''): any

// 获取 MIME 类型
function getMimeType(filePath: string): string

// 判断是否为二进制文件
function isBinaryFile(filePath: string): boolean
```

#### 2.1.3 数据模型

**文件树节点**
```typescript
interface FileTreeNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  mimeType?: string;
  isBinary?: boolean;
  children?: FileTreeNode[];
}
```

**文件预览响应**
```typescript
interface FilePreviewResponse {
  content: string;
  size: number;
  mimeType: string;
  isBinary: boolean;
}
```

### 2.2 前端实现

#### 2.2.1 组件设计

**FileTree 组件**
- 显示文件树结构
- 支持展开/折叠目录
- 文件选择功能
- 显示文件图标和大小

**FilePreview 组件**
- 显示文件内容
- 支持多种文件类型渲染
- 工具栏（字体大小、主题、行号）
- 代码语法高亮

**SkillPreviewPage 组件**
- 整合文件树和预览组件
- 布局管理（左右分栏）
- 加载状态处理

#### 2.2.2 依赖库

```json
{
  "react-syntax-highlighter": "^15.5.0",
  "react-markdown": "^9.0.0",
  "lucide-react": "^0.300.0"
}
```

---

## 三、测试方案

### 3.1 单元测试

#### 3.1.1 后端测试

**文件树构建测试**
```typescript
describe('buildFileTree', () => {
  it('should build correct file tree structure', () => {
    // 测试文件树构建逻辑
  });

  it('should sort directories before files', () => {
    // 测试排序逻辑
  });

  it('should handle empty directory', () => {
    // 测试空目录处理
  });
});
```

**MIME 类型检测测试**
```typescript
describe('getMimeType', () => {
  it('should return correct MIME type for known extensions', () => {
    // 测试已知文件类型
  });

  it('should return default MIME type for unknown extensions', () => {
    // 测试未知文件类型
  });
});
```

#### 3.1.2 前端测试

**FileTree 组件测试**
```typescript
describe('FileTree', () => {
  it('should render file tree correctly', () => {
    // 测试文件树渲染
  });

  it('should expand/collapse directories', () => {
    // 测试目录展开/折叠
  });

  it('should call onFileSelect when file is clicked', () => {
    // 测试文件选择
  });
});
```

**FilePreview 组件测试**
```typescript
describe('FilePreview', () => {
  it('should render code with syntax highlighting', () => {
    // 测试代码高亮
  });

  it('should render markdown content', () => {
    // 测试 Markdown 渲染
  });

  it('should display image files', () => {
    // 测试图片显示
  });
});
```

### 3.2 集成测试

**API 集成测试**
```typescript
describe('Skill Preview API', () => {
  it('should return file tree for public skill', async () => {
    // 测试公开技能文件树获取
  });

  it('should return file tree for owner', async () => {
    // 测试所有者文件树获取
  });

  it('should deny access for private skill', async () => {
    // 测试私有技能访问控制
  });

  it('should preview text file content', async () => {
    // 测试文本文件预览
  });

  it('should preview code file with syntax', async () => {
    // 测试代码文件预览
  });
});
```

### 3.3 E2E 测试

**用户流程测试**
```typescript
describe('Skill Preview E2E', () => {
  it('should allow user to preview skill files', async () => {
    // 测试完整的预览流程
  });

  it('should navigate through file tree', async () => {
    // 测试文件树导航
  });

  it('should adjust preview settings', async () => {
    // 测试预览设置调整
  });
});
```

---

## 四、开发任务

### 4.1 后端开发任务

- [ ] 创建文件预览 API 路由
- [ ] 实现文件树构建函数
- [ ] 实现文件预览函数
- [ ] 实现权限检查逻辑
- [ ] 添加错误处理和日志
- [ ] 编写单元测试
- [ ] 编写集成测试

### 4.2 前端开发任务

- [ ] 创建 FileTree 组件
- [ ] 创建 FilePreview 组件
- [ ] 创建 SkillPreviewPage 组件
- [ ] 实现文件图标组件
- [ ] 实现预览设置功能
- [ ] 添加加载状态和错误处理
- [ ] 编写组件测试
- [ ] 编写 E2E 测试

---

## 五、验收标准

### 5.1 功能验收

- [ ] 用户可以查看 Skill 的文件树结构
- [ ] 用户可以展开/折叠目录
- [ ] 用户可以预览代码文件（带语法高亮）
- [ ] 用户可以预览 Markdown 文件（渲染为 HTML）
- [ ] 用户可以预览图片文件
- [ ] 用户可以调整字体大小
- [ ] 用户可以切换亮色/暗色主题
- [ ] 用户可以显示/隐藏行号
- [ ] 公开技能可以被所有用户预览
- [ ] 私有技能只能被所有者预览

### 5.2 性能验收

- [ ] 文件树加载时间 < 500ms
- [ ] 文件预览加载时间 < 1s
- [ ] 大文件（>1MB）预览时间 < 3s
- [ ] 支持并发预览请求

### 5.3 测试验收

- [ ] 单元测试覆盖率 > 80%
- [ ] 所有单元测试通过
- [ ] 所有集成测试通过
- [ ] 所有 E2E 测试通过

---

## 六、风险和依赖

### 6.1 技术风险

- **大文件处理**: 大文件可能导致内存溢出，需要实现流式处理
- **临时文件管理**: 需要确保临时文件被正确清理
- **权限控制**: 需要仔细实现权限检查逻辑

### 6.2 外部依赖

- `react-syntax-highlighter`: 代码高亮库
- `react-markdown`: Markdown 渲染库
- `adm-zip`: ZIP 文件解压库

### 6.3 时间风险

- 如果遇到复杂文件格式处理问题，可能需要额外时间
- 性能优化可能需要额外时间

---

## 七、后续优化

### 7.1 功能增强

- 支持更多文件类型（PDF、视频等）
- 支持文件搜索功能
- 支持文件下载
- 支持文件对比功能

### 7.2 性能优化

- 实现文件缓存机制
- 实现懒加载
- 优化大文件处理

### 7.3 用户体验优化

- 添加快捷键支持
- 优化移动端体验
- 添加文件拖拽功能
