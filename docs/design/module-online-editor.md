# 在线编辑功能模块设计文档

**模块名称**: 在线编辑功能  
**文档版本**: v1.0  
**创建日期**: 2026-03-18  
**优先级**: P1  
**预估时间**: 3-4 周

---

## 一、功能概述

### 1.1 功能描述

允许用户在线编辑 Skill 的文件，无需重新打包上传。提供强大的代码编辑器，支持语法高亮、代码补全、实时保存等功能。

### 1.2 用户价值

- **创作者**: 可以快速修改 Skill 内容，无需重新打包上传
- **协作者**: 可以在线协作编辑 Skill
- **效率提升**: 大幅提升修改和迭代速度

### 1.3 核心功能

1. **代码编辑器**: 语法高亮、代码补全、代码格式化、错误提示
2. **文件操作**: 创建、删除、重命名、移动文件
3. **实时保存**: 自动保存、手动保存、保存历史、版本对比
4. **编辑权限**: 所有者编辑、协作者编辑、只读查看

---

## 二、技术方案

### 2.1 后端实现

#### 2.1.1 API 接口设计

**更新文件内容**
```
PUT /api/skills/:skillId/files/:filePath
```

**创建新文件**
```
POST /api/skills/:skillId/files
```

**删除文件**
```
DELETE /api/skills/:skillId/files/:filePath
```

**重命名文件**
```
PATCH /api/skills/:skillId/files/:filePath
```

**移动文件**
```
PATCH /api/skills/:skillId/files/:filePath/move
```

**获取编辑历史**
```
GET /api/skills/:skillId/files/:filePath/history
```

#### 2.1.2 核心函数

```typescript
// 更新文件内容
export const updateSkillFile = async (req: AuthRequest, res: Response): Promise<void>

// 创建新文件
export const createSkillFile = async (req: AuthRequest, res: Response): Promise<void>

// 删除文件
export const deleteSkillFile = async (req: AuthRequest, res: Response): Promise<void>

// 重命名文件
export const renameSkillFile = async (req: AuthRequest, res: Response): Promise<void>

// 移动文件
export const moveSkillFile = async (req: AuthRequest, res: Response): Promise<void>

// 获取编辑历史
export const getFileHistory = async (req: AuthRequest, res: Response): Promise<void>
```

#### 2.1.3 数据模型

**文件操作请求**
```typescript
interface UpdateFileRequest {
  content: string;
  message?: string;
}

interface CreateFileRequest {
  filePath: string;
  content: string;
  message?: string;
}

interface RenameFileRequest {
  newName: string;
  message?: string;
}

interface MoveFileRequest {
  newPath: string;
  message?: string;
}
```

**文件操作响应**
```typescript
interface FileOperationResponse {
  message: string;
  version: string;
  fileTree?: FileTreeNode[];
}
```

**编辑历史记录**
```typescript
interface FileHistoryRecord {
  version: string;
  timestamp: Date;
  message: string;
  author: string;
  changes: FileChange[];
}

interface FileChange {
  type: 'create' | 'update' | 'delete' | 'rename' | 'move';
  filePath: string;
  oldPath?: string;
}
```

### 2.2 前端实现

#### 2.2.1 组件设计

**CodeEditor 组件**
- Monaco Editor 集成
- 语法高亮和代码补全
- 实时保存功能
- 错误提示

**FileEditor 组件**
- 整合代码编辑器
- 文件操作工具栏
- 保存状态指示
- 编辑历史查看

**SkillEditorPage 组件**
- 整合文件树和编辑器
- 布局管理
- 文件切换
- 未保存提示

#### 2.2.2 依赖库

```json
{
  "@monaco-editor/react": "^4.6.0",
  "react-diff-viewer": "^3.1.1",
  "lucide-react": "^0.300.0"
}
```

---

## 三、测试方案

### 3.1 单元测试

#### 3.1.1 后端测试

**文件更新测试**
```typescript
describe('updateSkillFile', () => {
  it('should update file content and create new version', async () => {
    // 测试文件更新
  });

  it('should check edit permission', async () => {
    // 测试权限检查
  });

  it('should handle invalid file path', async () => {
    // 测试错误处理
  });
});
```

**文件创建测试**
```typescript
describe('createSkillFile', () => {
  it('should create new file', async () => {
    // 测试文件创建
  });

  it('should create nested directories', async () => {
    // 测试嵌套目录创建
  });

  it('should prevent duplicate file creation', async () => {
    // 测试重复文件处理
  });
});
```

#### 3.1.2 前端测试

**CodeEditor 组件测试**
```typescript
describe('CodeEditor', () => {
  it('should initialize with correct content', () => {
    // 测试编辑器初始化
  });

  it('should trigger auto-save', async () => {
    // 测试自动保存
  });

  it('should show unsaved changes warning', () => {
    // 测试未保存提示
  });
});
```

### 3.2 集成测试

**API 集成测试**
```typescript
describe('Skill Edit API', () => {
  it('should allow owner to edit files', async () => {
    // 测试所有者编辑权限
  });

  it('should prevent non-owner from editing', async () => {
    // 测试非所有者编辑限制
  });

  it('should create new version on edit', async () => {
    // 测试版本创建
  });

  it('should handle concurrent edits', async () => {
    // 测试并发编辑处理
  });
});
```

### 3.3 E2E 测试

**用户流程测试**
```typescript
describe('Skill Edit E2E', () => {
  it('should allow user to edit and save file', async () => {
    // 测试完整编辑流程
  });

  it('should show unsaved changes warning', async () => {
    // 测试未保存提示
  });

  it('should allow creating new files', async () => {
    // 测试文件创建流程
  });

  it('should allow deleting files', async () => {
    // 测试文件删除流程
  });
});
```

---

## 四、开发任务

### 4.1 后端开发任务

- [ ] 创建文件编辑 API 路由
- [ ] 实现文件更新函数
- [ ] 实现文件创建函数
- [ ] 实现文件删除函数
- [ ] 实现文件重命名函数
- [ ] 实现文件移动函数
- [ ] 实现编辑历史记录
- [ ] 实现权限检查逻辑
- [ ] 添加并发编辑处理
- [ ] 添加错误处理和日志
- [ ] 编写单元测试
- [ ] 编写集成测试

### 4.2 前端开发任务

- [ ] 创建 CodeEditor 组件（Monaco Editor）
- [ ] 创建 FileEditor 组件
- [ ] 创建 SkillEditorPage 组件
- [ ] 实现实时保存功能
- [ ] 实现未保存提示功能
- [ ] 实现文件操作工具栏
- [ ] 实现编辑历史查看
- [ ] 实现版本对比功能
- [ ] 添加加载状态和错误处理
- [ ] 编写组件测试
- [ ] 编写 E2E 测试

---

## 五、验收标准

### 5.1 功能验收

- [ ] 用户可以在线编辑文件内容
- [ ] 编辑器支持语法高亮
- [ ] 编辑器支持代码补全
- [ ] 用户可以创建新文件
- [ ] 用户可以删除文件
- [ ] 用户可以重命名文件
- [ ] 用户可以移动文件
- [ ] 编辑内容自动保存
- [ ] 用户可以手动保存
- [ ] 用户可以查看编辑历史
- [ ] 用户可以对比不同版本
- [ ] 所有者可以编辑
- [ ] 非所有者无法编辑

### 5.2 性能验收

- [ ] 编辑器加载时间 < 2s
- [ ] 文件保存时间 < 1s
- [ ] 自动保存间隔 < 30s
- [ ] 大文件（>1MB）编辑响应时间 < 500ms

### 5.3 测试验收

- [ ] 单元测试覆盖率 > 80%
- [ ] 所有单元测试通过
- [ ] 所有集成测试通过
- [ ] 所有 E2E 测试通过

---

## 六、风险和依赖

### 6.1 技术风险

- **并发编辑**: 多用户同时编辑可能导致冲突，需要实现冲突解决机制
- **版本管理**: 版本过多可能导致存储问题，需要实现版本清理策略
- **临时文件管理**: 需要确保临时文件被正确清理

### 6.2 外部依赖

- `@monaco-editor/react`: Monaco Editor React 组件
- `react-diff-viewer`: 版本对比组件
- `adm-zip`: ZIP 文件操作库

### 6.3 时间风险

- Monaco Editor 集成可能需要额外时间
- 并发编辑处理可能比较复杂
- 版本对比功能可能需要额外时间

---

## 七、后续优化

### 7.1 功能增强

- 支持多文件同时编辑
- 支持协作编辑（实时同步）
- 支持代码片段库
- 支持代码模板

### 7.2 性能优化

- 实现增量保存
- 实现文件缓存
- 优化大文件编辑性能

### 7.3 用户体验优化

- 添加快捷键支持
- 优化移动端体验
- 添加代码格式化快捷键
- 添加代码检查集成
