# 版本管理功能模块设计文档

**模块名称**: 版本管理功能  
**文档版本**: v1.0  
**创建日期**: 2026-03-18  
**优先级**: P2  
**预估时间**: 2-3 周

---

## 一、功能概述

### 1.1 功能描述

提供完整的 Skill 版本管理功能，包括版本创建、版本对比、版本回滚、版本标签等功能。

### 1.2 用户价值

- **创作者**: 可以轻松管理 Skill 的不同版本，快速回滚到历史版本
- **使用者**: 可以选择使用特定版本的 Skill
- **协作**: 团队协作时可以追踪版本变更历史

### 1.3 核心功能

1. **版本创建**: 自动或手动创建新版本
2. **版本列表**: 查看所有版本历史
3. **版本对比**: 对比不同版本的差异
4. **版本回滚**: 回滚到历史版本
5. **版本标签**: 为版本添加标签（如 stable、beta）
6. **版本下载**: 下载特定版本的 Skill

---

## 二、技术方案

### 2.1 后端实现

#### 2.1.1 API 接口设计

**获取版本列表**
```
GET /api/skills/:skillId/versions
```

**获取版本详情**
```
GET /api/skills/:skillId/versions/:version
```

**创建新版本**
```
POST /api/skills/:skillId/versions
```

**回滚版本**
```
POST /api/skills/:skillId/versions/:version/rollback
```

**添加版本标签**
```
POST /api/skills/:skillId/versions/:version/tags
```

**删除版本标签**
```
DELETE /api/skills/:skillId/versions/:version/tags/:tag
```

**对比版本**
```
GET /api/skills/:skillId/versions/compare?from=:fromVersion&to=:toVersion
```

**下载版本**
```
GET /api/skills/:skillId/versions/:version/download
```

#### 2.1.2 核心函数

```typescript
// 获取版本列表
export const getVersions = async (req: AuthRequest, res: Response): Promise<void>

// 获取版本详情
export const getVersion = async (req: AuthRequest, res: Response): Promise<void>

// 创建新版本
export const createVersion = async (req: AuthRequest, res: Response): Promise<void>

// 回滚版本
export const rollbackVersion = async (req: AuthRequest, res: Response): Promise<void>

// 添加版本标签
export const addVersionTag = async (req: AuthRequest, res: Response): Promise<void>

// 删除版本标签
export const deleteVersionTag = async (req: AuthRequest, res: Response): Promise<void>

// 对比版本
export const compareVersions = async (req: AuthRequest, res: Response): Promise<void>

// 下载版本
export const downloadVersion = async (req: AuthRequest, res: Response): Promise<void>
```

#### 2.1.3 数据模型

**版本信息**
```typescript
interface SkillVersion {
  version: string;
  url: string;
  createdAt: Date;
  createdBy: string;
  message?: string;
  tags: string[];
  changelog?: string;
}

**版本对比结果**
```typescript
interface VersionComparison {
  fromVersion: string;
  toVersion: string;
  changes: FileChange[];
  summary: {
    added: number;
    modified: number;
    deleted: number;
  };
}

interface FileChange {
  type: 'added' | 'modified' | 'deleted';
  path: string;
  oldContent?: string;
  newContent?: string;
}
```

**版本创建请求**
```typescript
interface CreateVersionRequest {
  message?: string;
  tags?: string[];
  changelog?: string;
}
```

### 2.2 前端实现

#### 2.2.1 组件设计

**VersionList 组件**
- 显示版本列表
- 版本信息展示
- 版本标签显示
- 版本操作按钮

**VersionDetail 组件**
- 显示版本详情
- 版本文件树
- 版本信息编辑

**VersionComparison 组件**
- 显示版本差异
- 文件对比视图
- 差异统计

**VersionTagManager 组件**
- 管理版本标签
- 添加/删除标签
- 标签颜色设置

**SkillVersionPage 组件**
- 整合所有版本组件
- 布局管理
- 版本状态管理

#### 2.2.2 依赖库

```json
{
  "react-diff-viewer": "^3.1.1",
  "lucide-react": "^0.300.0",
  "date-fns": "^3.0.0"
}
```

---

## 三、测试方案

### 3.1 单元测试

#### 3.1.1 后端测试

**版本创建测试**
```typescript
describe('createVersion', () => {
  it('should create new version', async () => {
    // 测试版本创建
  });

  it('should increment version number', async () => {
    // 测试版本号递增
  });

  it('should validate version message', async () => {
    // 测试版本信息验证
  });
});
```

**版本回滚测试**
```typescript
describe('rollbackVersion', () => {
  it('should rollback to specified version', async () => {
    // 测试版本回滚
  });

  it('should create new version after rollback', async () => {
    // 测试回滚后创建新版本
  });

  it('should check permission', async () => {
    // 测试权限检查
  });
});
```

#### 3.1.2 前端测试

**VersionList 组件测试**
```typescript
describe('VersionList', () => {
  it('should render version list', () => {
    // 测试版本列表渲染
  });

  it('should display version tags', () => {
    // 测试版本标签显示
  });

  it('should trigger version selection', () => {
    // 测试版本选择
  });
});
```

### 3.2 集成测试

**API 集成测试**
```typescript
describe('Skill Version API', () => {
  it('should create and retrieve versions', async () => {
    // 测试版本创建和获取
  });

  it('should compare versions correctly', async () => {
    // 测试版本对比
  });

  it('should rollback version successfully', async () => {
    // 测试版本回滚
  });
});
```

### 3.3 E2E 测试

**用户流程测试**
```typescript
describe('Skill Version E2E', () => {
  it('should allow user to create version', async () => {
    // 测试版本创建流程
  });

  it('should allow user to compare versions', async () => {
    // 测试版本对比流程
  });

  it('should allow user to rollback version', async () => {
    // 测试版本回滚流程
  });
});
```

---

## 四、开发任务

### 4.1 后端开发任务

- [ ] 创建版本管理 API 路由
- [ ] 实现版本创建函数
- [ ] 实现版本列表获取
- [ ] 实现版本详情获取
- [ ] 实现版本回滚函数
- [ ] 实现版本标签管理
- [ ] 实现版本对比函数
- [ ] 实现版本下载功能
- [ ] 添加权限检查逻辑
- [ ] 添加错误处理和日志
- [ ] 编写单元测试
- [ ] 编写集成测试

### 4.2 前端开发任务

- [ ] 创建 VersionList 组件
- [ ] 创建 VersionDetail 组件
- [ ] 创建 VersionComparison 组件
- [ ] 创建 VersionTagManager 组件
- [ ] 创建 SkillVersionPage 组件
- [ ] 实现版本列表展示
- [ ] 实现版本详情查看
- [ ] 实现版本对比功能
- [ ] 实现版本标签管理
- [ ] 实现版本回滚功能
- [ ] 添加加载状态和错误处理
- [ ] 编写组件测试
- [ ] 编写 E2E 测试

---

## 五、验收标准

### 5.1 功能验收

- [ ] 用户可以查看版本列表
- [ ] 用户可以创建新版本
- [ ] 用户可以查看版本详情
- [ ] 用户可以对比不同版本
- [ ] 用户可以回滚到历史版本
- [ ] 用户可以添加版本标签
- [ ] 用户可以删除版本标签
- [ ] 用户可以下载特定版本
- [ ] 版本号自动递增
- [ ] 所有者可以管理版本
- [ ] 非所有者只能查看版本

### 5.2 性能验收

- [ ] 版本列表加载时间 < 500ms
- [ ] 版本详情加载时间 < 500ms
- [ ] 版本对比时间 < 2s
- [ ] 版本回滚时间 < 3s
- [ ] 版本下载时间 < 5s

### 5.3 测试验收

- [ ] 单元测试覆盖率 > 80%
- [ ] 所有单元测试通过
- [ ] 所有集成测试通过
- [ ] 所有 E2E 测试通过

---

## 六、风险和依赖

### 6.1 技术风险

- **存储空间**: 版本过多可能导致存储空间问题，需要实现版本清理策略
- **版本对比**: 大文件对比可能消耗大量资源，需要优化对比算法
- **回滚操作**: 回滚操作需要确保数据一致性

### 6.2 外部依赖

- `react-diff-viewer`: 版本对比组件
- `adm-zip`: ZIP 文件操作库
- `diff`: 文件差异计算库

### 6.3 时间风险

- 版本对比功能可能需要额外时间
- 版本回滚逻辑可能比较复杂
- 版本清理策略需要仔细设计

---

## 七、后续优化

### 7.1 功能增强

- 支持版本分支
- 支持版本合并
- 支持版本发布流程
- 支持版本审核
- 支持版本自动化发布

### 7.2 性能优化

- 实现版本缓存
- 优化版本对比性能
- 实现增量版本存储

### 7.3 用户体验优化

- 添加版本搜索功能
- 优化版本对比展示
- 添加版本快捷操作
- 添加版本通知功能
