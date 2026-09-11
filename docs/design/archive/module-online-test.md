# 在线测试功能模块设计文档

**模块名称**: 在线测试功能  
**文档版本**: v1.0  
**创建日期**: 2026-03-18  
**优先级**: P2  
**预估时间**: 2-3 周

---

## 一、功能概述

### 1.1 功能描述

允许用户在线测试 Skill 是否正常工作，提供测试环境、测试用例管理、测试结果展示等功能。

### 1.2 用户价值

- **创作者**: 上传后可以立即测试 Skill 是否正常工作
- **使用者**: 可以在使用前测试 Skill 是否符合预期
- **调试**: 可以在线调试 Skill，快速定位问题

### 1.3 核心功能

1. **测试环境**: 提供安全的测试执行环境
2. **测试用例管理**: 创建、编辑、删除测试用例
3. **测试执行**: 运行测试用例并获取结果
4. **结果展示**: 显示测试结果、日志、错误信息
5. **调试功能**: 断点调试、变量查看、日志输出

---

## 二、技术方案

### 2.1 后端实现

#### 2.1.1 API 接口设计

**创建测试用例**
```
POST /api/skills/:skillId/test-cases
```

**获取测试用例列表**
```
GET /api/skills/:skillId/test-cases
```

**更新测试用例**
```
PUT /api/skills/:skillId/test-cases/:testCaseId
```

**删除测试用例**
```
DELETE /api/skills/:skillId/test-cases/:testCaseId
```

**执行测试**
```
POST /api/skills/:skillId/test
```

**获取测试结果**
```
GET /api/skills/:skillId/test-results/:testResultId
```

**获取测试日志**
```
GET /api/skills/:skillId/test-results/:testResultId/logs
```

#### 2.1.2 核心函数

```typescript
// 创建测试用例
export const createTestCase = async (req: AuthRequest, res: Response): Promise<void>

// 获取测试用例列表
export const getTestCases = async (req: AuthRequest, res: Response): Promise<void>

// 更新测试用例
export const updateTestCase = async (req: AuthRequest, res: Response): Promise<void>

// 删除测试用例
export const deleteTestCase = async (req: AuthRequest, res: Response): Promise<void>

// 执行测试
export const executeTest = async (req: AuthRequest, res: Response): Promise<void>

// 获取测试结果
export const getTestResult = async (req: AuthRequest, res: Response): Promise<void>

// 获取测试日志
export const getTestLogs = async (req: AuthRequest, res: Response): Promise<void>
```

#### 2.1.3 数据模型

**测试用例**
```typescript
interface TestCase {
  _id: string;
  skillId: string;
  name: string;
  description: string;
  input: any;
  expectedOutput: any;
  timeout: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

**测试结果**
```typescript
interface TestResult {
  _id: string;
  skillId: string;
  version: string;
  status: 'running' | 'passed' | 'failed' | 'error';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  results: TestCaseResult[];
  logs: TestLog[];
  createdAt: Date;
  createdBy: string;
}

interface TestCaseResult {
  testCaseId: string;
  testCaseName: string;
  status: 'passed' | 'failed' | 'error' | 'timeout';
  actualOutput?: any;
  errorMessage?: string;
  duration: number;
}

interface TestLog {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  data?: any;
}
```

### 2.2 前端实现

#### 2.2.1 组件设计

**TestCaseEditor 组件**
- 编辑测试用例
- 输入/输出编辑器
- 超时设置

**TestCaseList 组件**
- 显示测试用例列表
- 添加/删除测试用例
- 测试用例排序

**TestRunner 组件**
- 执行测试
- 显示测试进度
- 显示测试结果

**TestResultViewer 组件**
- 显示测试结果详情
- 显示测试日志
- 错误信息展示

**SkillTestPage 组件**
- 整合所有测试组件
- 布局管理
- 测试状态管理

#### 2.2.2 依赖库

```json
{
  "@monaco-editor/react": "^4.6.0",
  "react-json-view": "^1.21.3",
  "lucide-react": "^0.300.0"
}
```

---

## 三、测试方案

### 3.1 单元测试

#### 3.1.1 后端测试

**测试用例管理测试**
```typescript
describe('createTestCase', () => {
  it('should create test case', async () => {
    // 测试测试用例创建
  });

  it('should validate test case input', async () => {
    // 测试输入验证
  });

  it('should check permission', async () => {
    // 测试权限检查
  });
});
```

**测试执行测试**
```typescript
describe('executeTest', () => {
  it('should execute test cases', async () => {
    // 测试测试执行
  });

  it('should handle timeout', async () => {
    // 测试超时处理
  });

  it('should capture logs', async () => {
    // 测试日志捕获
  });
});
```

#### 3.1.2 前端测试

**TestCaseEditor 组件测试**
```typescript
describe('TestCaseEditor', () => {
  it('should render test case form', () => {
    // 测试表单渲染
  });

  it('should validate input', () => {
    // 测试输入验证
  });

  it('should save test case', async () => {
    // 测试保存功能
  });
});
```

### 3.2 集成测试

**API 集成测试**
```typescript
describe('Skill Test API', () => {
  it('should create and execute test case', async () => {
    // 测试完整测试流程
  });

  it('should handle test failure', async () => {
    // 测试失败处理
  });

  it('should capture test logs', async () => {
    // 测试日志捕获
  });
});
```

### 3.3 E2E 测试

**用户流程测试**
```typescript
describe('Skill Test E2E', () => {
  it('should allow user to create and run test', async () => {
    // 测试完整测试流程
  });

  it('should display test results', async () => {
    // 测试结果显示
  });

  it('should allow viewing test logs', async () => {
    // 测试日志查看
  });
});
```

---

## 四、开发任务

### 4.1 后端开发任务

- [ ] 创建测试管理 API 路由
- [ ] 实现测试用例 CRUD 操作
- [ ] 实现测试执行引擎
- [ ] 实现测试环境隔离
- [ ] 实现日志捕获功能
- [ ] 实现超时处理
- [ ] 实现错误处理
- [ ] 添加权限检查逻辑
- [ ] 编写单元测试
- [ ] 编写集成测试

### 4.2 前端开发任务

- [ ] 创建 TestCaseEditor 组件
- [ ] 创建 TestCaseList 组件
- [ ] 创建 TestRunner 组件
- [ ] 创建 TestResultViewer 组件
- [ ] 创建 SkillTestPage 组件
- [ ] 实现测试用例管理
- [ ] 实现测试执行功能
- [ ] 实现结果展示功能
- [ ] 实现实时日志显示
- [ ] 添加加载状态和错误处理
- [ ] 编写组件测试
- [ ] 编写 E2E 测试

---

## 五、验收标准

### 5.1 功能验收

- [ ] 用户可以创建测试用例
- [ ] 用户可以编辑测试用例
- [ ] 用户可以删除测试用例
- [ ] 用户可以执行测试
- [ ] 测试结果正确显示
- [ ] 测试日志正确显示
- [ ] 超时测试正确处理
- [ ] 错误信息正确显示
- [ ] 所有者可以管理测试用例
- [ ] 非所有者可以运行测试

### 5.2 性能验收

- [ ] 测试用例创建时间 < 500ms
- [ ] 测试执行响应时间 < 1s
- [ ] 测试结果加载时间 < 500ms
- [ ] 支持并发测试执行

### 5.3 测试验收

- [ ] 单元测试覆盖率 > 80%
- [ ] 所有单元测试通过
- [ ] 所有集成测试通过
- [ ] 所有 E2E 测试通过

---

## 六、风险和依赖

### 6.1 技术风险

- **安全性**: 测试环境需要与生产环境隔离，防止安全漏洞
- **资源管理**: 测试执行可能消耗大量资源，需要实现资源限制
- **超时处理**: 需要正确处理测试超时，避免资源泄漏

### 6.2 外部依赖

- `@monaco-editor/react`: Monaco Editor React 组件
- `react-json-view`: JSON 数据展示组件
- `vm2` 或 `isolated-vm`: 安全的 JavaScript 执行环境

### 6.3 时间风险

- 测试环境隔离可能需要额外时间
- 超时处理和资源管理可能比较复杂
- 日志捕获和展示可能需要额外时间

---

## 七、后续优化

### 7.1 功能增强

- 支持性能测试
- 支持压力测试
- 支持自动化测试
- 支持测试报告生成
- 支持测试覆盖率分析

### 7.2 性能优化

- 实现测试结果缓存
- 优化测试执行性能
- 实现并发测试执行

### 7.3 用户体验优化

- 添加测试模板
- 添加测试用例导入/导出
- 优化测试结果展示
- 添加测试历史对比
