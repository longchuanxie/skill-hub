# SkillHub Phase 1 基础夯实实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 建立 SkillHub 的质量保障体系、优化用户体验、提升系统性能、完善监控能力，实现从"功能可用"到"产品卓越"的跨越。

**Architecture:** 采用分层实施策略，优先建立测试体系保障代码质量，然后优化用户体验提升用户满意度，接着进行性能优化确保系统可扩展，最后完善监控告警保障系统稳定性。每个模块独立实施，互不阻塞，可并行推进。

**Tech Stack:** 
- 测试: Jest + Supertest (后端), Vitest + React Testing Library (前端), Playwright (E2E)
- 缓存: Redis
- 监控: Winston + Morgan (日志), 自定义监控中间件
- 前端: React + TypeScript + Tailwind CSS

---

## 概览

**总时长**: 8 周（4 个 Sprint，每 Sprint 2 周）

**模块划分**:
1. **模块 1**: 测试体系建设（2-3 周）
2. **模块 2**: 用户体验优化（3-4 周）
3. **模块 3**: 性能优化（2-3 周）
4. **模块 4**: 监控告警（2 周）

**关键指标**:
- 测试覆盖率: 80%+
- 页面加载时间: < 2s
- API 响应时间: < 200ms (P95)
- 系统可用性: 99.5%+

---

## 模块 1: 测试体系建设

**目标**: 建立完整的测试体系，确保代码质量和系统稳定性

**时间估算**: 2-3 周

**测试覆盖率目标**:
- 单元测试: 80%+
- 集成测试: 核心流程 100%
- E2E 测试: 关键用户路径 100%

---

### Task 1.1: 后端测试框架搭建

**Files:**
- Create: `backend/jest.config.js`
- Create: `backend/tests/setup.ts`
- Create: `backend/tests/helpers/dbHandler.ts`
- Modify: `backend/package.json`

**Step 1: 安装测试依赖**

Run: `cd backend && npm install --save-dev jest @types/jest ts-jest supertest @types/supertest mongodb-memory-server`

Expected: 依赖安装成功

**Step 2: 创建 Jest 配置文件**

Create: `backend/jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/app.ts',
    '!src/types/**/*.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000
};
```

**Step 3: 创建测试设置文件**

Create: `backend/tests/setup.ts`

```typescript
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

**Step 4: 创建数据库辅助函数**

Create: `backend/tests/helpers/dbHandler.ts`

```typescript
import mongoose from 'mongoose';

export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

export const closeDatabase = async () => {
  await mongoose.connection.close();
};
```

**Step 5: 更新 package.json 添加测试脚本**

Modify: `backend/package.json`

在 `scripts` 部分添加:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --reporters=default --reporters=jest-junit"
  }
}
```

**Step 6: 提交测试框架配置**

Run: `cd backend && git add jest.config.js tests/ package.json && git commit -m "feat(test): setup backend testing framework with Jest"`

Expected: 提交成功

---

### Task 1.2: 认证系统单元测试

**Files:**
- Create: `backend/tests/unit/models/User.test.ts`
- Create: `backend/tests/unit/middleware/auth.test.ts`
- Create: `backend/tests/unit/utils/jwt.test.ts`

**Step 1: 编写 User 模型测试**

Create: `backend/tests/unit/models/User.test.ts`

```typescript
import { User } from '../../../src/models/User';
import bcrypt from 'bcryptjs';

describe('User Model', () => {
  const validUserData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    role: 'user'
  };

  it('should create a user successfully', async () => {
    const user = new User(validUserData);
    const savedUser = await user.save();
    
    expect(savedUser._id).toBeDefined();
    expect(savedUser.username).toBe(validUserData.username);
    expect(savedUser.email).toBe(validUserData.email);
    expect(savedUser.role).toBe('user');
    expect(savedUser.isEmailVerified).toBe(false);
  });

  it('should hash password before saving', async () => {
    const user = new User(validUserData);
    await user.save();
    
    expect(user.password).not.toBe(validUserData.password);
    const isMatch = await bcrypt.compare(validUserData.password, user.password);
    expect(isMatch).toBe(true);
  });

  it('should compare password correctly', async () => {
    const user = new User(validUserData);
    await user.save();
    
    const isMatch = await user.comparePassword('password123');
    expect(isMatch).toBe(true);
    
    const isWrongMatch = await user.comparePassword('wrongpassword');
    expect(isWrongMatch).toBe(false);
  });

  it('should fail validation without required fields', async () => {
    const user = new User({});
    
    await expect(user.save()).rejects.toThrow();
  });

  it('should fail with duplicate username', async () => {
    const user1 = new User(validUserData);
    await user1.save();
    
    const user2 = new User(validUserData);
    
    await expect(user2.save()).rejects.toThrow();
  });

  it('should fail with duplicate email', async () => {
    const user1 = new User(validUserData);
    await user1.save();
    
    const user2 = new User({
      ...validUserData,
      username: 'differentuser'
    });
    
    await expect(user2.save()).rejects.toThrow();
  });
});
```

**Step 2: 运行 User 模型测试**

Run: `cd backend && npm test tests/unit/models/User.test.ts`

Expected: 所有测试通过

**Step 3: 编写认证中间件测试**

Create: `backend/tests/unit/middleware/auth.test.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { auth, requireRole } from '../../../src/middleware/auth';
import { User } from '../../../src/models/User';
import jwt from 'jsonwebtoken';

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    nextFunction = jest.fn();
  });

  it('should reject request without token', async () => {
    await auth(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'No token provided'
    });
  });

  it('should reject request with invalid token', async () => {
    mockRequest!.headers!['authorization'] = 'Bearer invalid-token';

    await auth(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Invalid token'
    });
  });

  it('should accept request with valid token', async () => {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );

    mockRequest!.headers!['authorization'] = `Bearer ${token}`;

    await auth(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
    expect(mockRequest!.user).toBeDefined();
    expect(mockRequest!.user!._id.toString()).toBe(user._id.toString());
  });

  it('should require specific role', async () => {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'user'
    });
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );

    mockRequest!.headers!['authorization'] = `Bearer ${token}`;
    mockRequest!.user = user;

    const adminOnly = requireRole('admin');

    await adminOnly(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Insufficient permissions'
    });
  });
});
```

**Step 4: 运行认证中间件测试**

Run: `cd backend && npm test tests/unit/middleware/auth.test.ts`

Expected: 所有测试通过

**Step 5: 编写 JWT 工具函数测试**

Create: `backend/tests/unit/utils/jwt.test.ts`

```typescript
import { generateToken, verifyToken } from '../../../src/utils/jwt';
import jwt from 'jsonwebtoken';

describe('JWT Utils', () => {
  const userId = '507f1f77bcf86cd799439011';

  it('should generate a valid token', () => {
    const token = generateToken(userId);
    
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);
  });

  it('should verify a valid token', () => {
    const token = generateToken(userId);
    const decoded = verifyToken(token);
    
    expect(decoded).toBeDefined();
    expect(decoded!.userId).toBe(userId);
  });

  it('should reject invalid token', () => {
    const decoded = verifyToken('invalid-token');
    
    expect(decoded).toBeNull();
  });

  it('should reject expired token', () => {
    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '-1h' }
    );
    
    const decoded = verifyToken(token);
    
    expect(decoded).toBeNull();
  });
});
```

**Step 6: 运行 JWT 工具函数测试**

Run: `cd backend && npm test tests/unit/utils/jwt.test.ts`

Expected: 所有测试通过

**Step 7: 提交认证系统测试**

Run: `cd backend && git add tests/unit/ && git commit -m "feat(test): add authentication system unit tests"`

Expected: 提交成功

---

### Task 1.3: Skill/Prompt CRUD 集成测试

**Files:**
- Create: `backend/tests/integration/skills.test.ts`
- Create: `backend/tests/integration/prompts.test.ts`

**Step 1: 编写 Skill 集成测试**

Create: `backend/tests/integration/skills.test.ts`

```typescript
import request from 'supertest';
import app from '../../src/app';
import { User } from '../../src/models/User';
import { Skill } from '../../src/models/Skill';
import jwt from 'jsonwebtoken';

describe('Skills API', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    await user.save();
    userId = user._id.toString();

    authToken = jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );
  });

  describe('POST /api/skills', () => {
    it('should create a new skill', async () => {
      const skillData = {
        name: 'Test Skill',
        description: 'A test skill',
        category: 'general',
        tags: ['test', 'demo'],
        visibility: 'public'
      };

      const response = await request(app)
        .post('/api/skills')
        .set('Authorization', `Bearer ${authToken}`)
        .send(skillData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(skillData.name);
      expect(response.body.description).toBe(skillData.description);
      expect(response.body.owner).toBe(userId);
    });

    it('should reject skill without auth', async () => {
      const response = await request(app)
        .post('/api/skills')
        .send({ name: 'Test Skill' });

      expect(response.status).toBe(401);
    });

    it('should reject skill with missing required fields', async () => {
      const response = await request(app)
        .post('/api/skills')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/skills', () => {
    beforeEach(async () => {
      const skills = [
        { name: 'Skill 1', description: 'Desc 1', category: 'general', owner: userId, visibility: 'public' },
        { name: 'Skill 2', description: 'Desc 2', category: 'general', owner: userId, visibility: 'public' },
        { name: 'Private Skill', description: 'Private', category: 'general', owner: userId, visibility: 'private' }
      ];

      await Skill.insertMany(skills);
    });

    it('should return public skills', async () => {
      const response = await request(app)
        .get('/api/skills');

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/skills?page=1&limit=1');

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
    });

    it('should support search', async () => {
      const response = await request(app)
        .get('/api/skills?search=Skill 1');

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe('Skill 1');
    });
  });

  describe('GET /api/skills/:id', () => {
    let skillId: string;

    beforeEach(async () => {
      const skill = new Skill({
        name: 'Test Skill',
        description: 'Test Description',
        category: 'general',
        owner: userId,
        visibility: 'public'
      });
      await skill.save();
      skillId = skill._id.toString();
    });

    it('should return skill by id', async () => {
      const response = await request(app)
        .get(`/api/skills/${skillId}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Test Skill');
    });

    it('should return 404 for non-existent skill', async () => {
      const response = await request(app)
        .get('/api/skills/507f1f77bcf86cd799439011');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/skills/:id', () => {
    let skillId: string;

    beforeEach(async () => {
      const skill = new Skill({
        name: 'Test Skill',
        description: 'Test Description',
        category: 'general',
        owner: userId,
        visibility: 'public'
      });
      await skill.save();
      skillId = skill._id.toString();
    });

    it('should update skill', async () => {
      const response = await request(app)
        .put(`/api/skills/${skillId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'Updated Description' });

      expect(response.status).toBe(200);
      expect(response.body.description).toBe('Updated Description');
    });

    it('should reject update by non-owner', async () => {
      const otherUser = new User({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'password123'
      });
      await otherUser.save();

      const otherToken = jwt.sign(
        { userId: otherUser._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .put(`/api/skills/${skillId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ description: 'Hacked' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/skills/:id', () => {
    let skillId: string;

    beforeEach(async () => {
      const skill = new Skill({
        name: 'Test Skill',
        description: 'Test Description',
        category: 'general',
        owner: userId,
        visibility: 'public'
      });
      await skill.save();
      skillId = skill._id.toString();
    });

    it('should delete skill', async () => {
      const response = await request(app)
        .delete(`/api/skills/${skillId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      const deletedSkill = await Skill.findById(skillId);
      expect(deletedSkill).toBeNull();
    });

    it('should reject delete by non-owner', async () => {
      const otherUser = new User({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'password123'
      });
      await otherUser.save();

      const otherToken = jwt.sign(
        { userId: otherUser._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .delete(`/api/skills/${skillId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
    });
  });
});
```

**Step 2: 运行 Skill 集成测试**

Run: `cd backend && npm test tests/integration/skills.test.ts`

Expected: 所有测试通过

**Step 3: 编写 Prompt 集成测试**

Create: `backend/tests/integration/prompts.test.ts`

```typescript
import request from 'supertest';
import app from '../../src/app';
import { User } from '../../src/models/User';
import { Prompt } from '../../src/models/Prompt';
import jwt from 'jsonwebtoken';

describe('Prompts API', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    await user.save();
    userId = user._id.toString();

    authToken = jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );
  });

  describe('POST /api/prompts', () => {
    it('should create a new prompt', async () => {
      const promptData = {
        name: 'Test Prompt',
        description: 'A test prompt',
        content: 'Hello {{name}}!',
        variables: [
          { name: 'name', type: 'string', required: true }
        ],
        category: 'general',
        visibility: 'public'
      };

      const response = await request(app)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(promptData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(promptData.name);
      expect(response.body.content).toBe(promptData.content);
    });

    it('should validate variable syntax', async () => {
      const response = await request(app)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Prompt',
          description: 'Invalid',
          content: 'Hello {{invalid syntax',
          category: 'general'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/prompts', () => {
    beforeEach(async () => {
      const prompts = [
        { name: 'Prompt 1', description: 'Desc 1', content: 'Content 1', category: 'general', owner: userId, visibility: 'public' },
        { name: 'Prompt 2', description: 'Desc 2', content: 'Content 2', category: 'general', owner: userId, visibility: 'public' }
      ];

      await Prompt.insertMany(prompts);
    });

    it('should return prompts', async () => {
      const response = await request(app)
        .get('/api/prompts');

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
    });
  });

  describe('POST /api/prompts/:id/use', () => {
    let promptId: string;

    beforeEach(async () => {
      const prompt = new Prompt({
        name: 'Test Prompt',
        description: 'Test',
        content: 'Hello {{name}}!',
        variables: [{ name: 'name', type: 'string', required: true }],
        category: 'general',
        owner: userId,
        visibility: 'public'
      });
      await prompt.save();
      promptId = prompt._id.toString();
    });

    it('should use prompt with variables', async () => {
      const response = await request(app)
        .post(`/api/prompts/${promptId}/use`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ variables: { name: 'World' } });

      expect(response.status).toBe(200);
      expect(response.body.result).toBe('Hello World!');
    });

    it('should increment usage count', async () => {
      await request(app)
        .post(`/api/prompts/${promptId}/use`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ variables: { name: 'World' } });

      const prompt = await Prompt.findById(promptId);
      expect(prompt!.usageCount).toBe(1);
    });
  });
});
```

**Step 4: 运行 Prompt 集成测试**

Run: `cd backend && npm test tests/integration/prompts.test.ts`

Expected: 所有测试通过

**Step 5: 提交集成测试**

Run: `cd backend && git add tests/integration/ && git commit -m "feat(test): add skills and prompts integration tests"`

Expected: 提交成功

---

### Task 1.4: 前端测试框架搭建

**Files:**
- Create: `frontend/vitest.config.ts`
- Create: `frontend/tests/setup.ts`
- Modify: `frontend/package.json`

**Step 1: 安装前端测试依赖**

Run: `cd frontend && npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui`

Expected: 依赖安装成功

**Step 2: 创建 Vitest 配置文件**

Create: `frontend/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
        'src/main.tsx'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

**Step 3: 创建测试设置文件**

Create: `frontend/tests/setup.ts`

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

**Step 4: 更新 package.json 添加测试脚本**

Modify: `frontend/package.json`

在 `scripts` 部分添加:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

**Step 5: 提交前端测试框架配置**

Run: `cd frontend && git add vitest.config.ts tests/ package.json && git commit -m "feat(test): setup frontend testing framework with Vitest"`

Expected: 提交成功

---

### Task 1.5: 前端组件测试

**Files:**
- Create: `frontend/tests/components/SkillCard.test.tsx`
- Create: `frontend/tests/components/PromptCard.test.tsx`
- Create: `frontend/tests/components/Layout.test.tsx`

**Step 1: 编写 SkillCard 组件测试**

Create: `frontend/tests/components/SkillCard.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SkillCard from '../../src/components/SkillCard';

const mockSkill = {
  _id: '1',
  name: 'Test Skill',
  description: 'A test skill description',
  category: 'general',
  tags: ['test', 'demo'],
  downloads: 100,
  averageRating: 4.5,
  likeCount: 50,
  owner: {
    _id: 'user1',
    username: 'testuser'
  },
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z'
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('SkillCard', () => {
  it('should render skill information', () => {
    renderWithRouter(<SkillCard skill={mockSkill} />);

    expect(screen.getByText('Test Skill')).toBeDefined();
    expect(screen.getByText('A test skill description')).toBeDefined();
    expect(screen.getByText('test')).toBeDefined();
    expect(screen.getByText('demo')).toBeDefined();
  });

  it('should display download count', () => {
    renderWithRouter(<SkillCard skill={mockSkill} />);

    expect(screen.getByText(/100/)).toBeDefined();
  });

  it('should display rating', () => {
    renderWithRouter(<SkillCard skill={mockSkill} />);

    expect(screen.getByText(/4.5/)).toBeDefined();
  });

  it('should have link to skill detail', () => {
    renderWithRouter(<SkillCard skill={mockSkill} />);

    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/skills/1');
  });
});
```

**Step 2: 运行 SkillCard 组件测试**

Run: `cd frontend && npm test tests/components/SkillCard.test.tsx`

Expected: 所有测试通过

**Step 3: 编写 PromptCard 组件测试**

Create: `frontend/tests/components/PromptCard.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PromptCard from '../../src/components/PromptCard';

const mockPrompt = {
  _id: '1',
  name: 'Test Prompt',
  description: 'A test prompt',
  content: 'Hello {{name}}!',
  variables: [{ name: 'name', type: 'string', required: true }],
  category: 'general',
  usageCount: 200,
  averageRating: 4.8,
  owner: {
    _id: 'user1',
    username: 'testuser'
  }
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('PromptCard', () => {
  it('should render prompt information', () => {
    renderWithRouter(<PromptCard prompt={mockPrompt} />);

    expect(screen.getByText('Test Prompt')).toBeDefined();
    expect(screen.getByText('A test prompt')).toBeDefined();
  });

  it('should display variable count', () => {
    renderWithRouter(<PromptCard prompt={mockPrompt} />);

    expect(screen.getByText(/1/)).toBeDefined();
  });

  it('should display usage count', () => {
    renderWithRouter(<PromptCard prompt={mockPrompt} />);

    expect(screen.getByText(/200/)).toBeDefined();
  });

  it('should have link to prompt detail', () => {
    renderWithRouter(<PromptCard prompt={mockPrompt} />);

    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/prompts/1');
  });
});
```

**Step 4: 运行 PromptCard 组件测试**

Run: `cd frontend && npm test tests/components/PromptCard.test.tsx`

Expected: 所有测试通过

**Step 5: 提交前端组件测试**

Run: `cd frontend && git add tests/components/ && git commit -m "feat(test): add frontend component tests"`

Expected: 提交成功

---

### Task 1.6: E2E 测试框架搭建

**Files:**
- Create: `e2e/playwright.config.ts`
- Create: `e2e/tests/auth.spec.ts`
- Create: `e2e/tests/skills.spec.ts`
- Create: `e2e/package.json`

**Step 1: 创建 E2E 测试目录和配置**

Create: `e2e/package.json`

```json
{
  "name": "skillhub-e2e",
  "version": "1.0.0",
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:debug": "playwright test --debug"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0"
  }
}
```

**Step 2: 安装 Playwright**

Run: `cd e2e && npm install && npx playwright install`

Expected: Playwright 安装成功

**Step 3: 创建 Playwright 配置**

Create: `e2e/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'cd ../frontend && npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Step 4: 编写认证流程 E2E 测试**

Create: `e2e/tests/auth.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should register a new user', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/login');
    await expect(page.locator('.toast-success')).toBeVisible();
  });

  test('should login successfully', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.toast-error')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('should logout successfully', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');
    
    await expect(page).toHaveURL('/login');
  });
});
```

**Step 5: 编写 Skill 管理 E2E 测试**

Create: `e2e/tests/skills.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Skills Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('should display skills list', async ({ page }) => {
    await page.goto('/skills');
    
    await expect(page.locator('text=Skills')).toBeVisible();
    await expect(page.locator('.skill-card').first()).toBeVisible();
  });

  test('should search skills', async ({ page }) => {
    await page.goto('/skills');
    
    await page.fill('input[placeholder*="Search"]', 'test');
    await page.press('input[placeholder*="Search"]', 'Enter');
    
    await expect(page.locator('.skill-card')).toHaveCount(1);
  });

  test('should view skill detail', async ({ page }) => {
    await page.goto('/skills');
    
    await page.click('.skill-card:first-child');
    
    await expect(page).toHaveURL(/\/skills\/\w+/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should upload a new skill', async ({ page }) => {
    await page.goto('/upload');
    
    await page.fill('input[name="name"]', 'New Test Skill');
    await page.fill('textarea[name="description"]', 'Test description');
    await page.selectOption('select[name="category"]', 'general');
    
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('./test-files/test-skill.zip');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.toast-success')).toBeVisible();
  });
});
```

**Step 6: 运行 E2E 测试**

Run: `cd e2e && npm test`

Expected: 所有测试通过

**Step 7: 提交 E2E 测试**

Run: `cd e2e && git add . && git commit -m "feat(test): add E2E tests with Playwright"`

Expected: 提交成功

---

### Task 1.7: CI/CD 测试集成

**Files:**
- Create: `.github/workflows/test.yml`

**Step 1: 创建 GitHub Actions 测试工作流**

Create: `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:7.0
        ports:
          - 27017:27017
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        cache-dependency-path: backend/package-lock.json
    
    - name: Install backend dependencies
      working-directory: ./backend
      run: npm ci
    
    - name: Run backend tests
      working-directory: ./backend
      run: npm run test:ci
      env:
        MONGODB_URI: mongodb://localhost:27017/skillhub-test
        JWT_SECRET: test-secret-key
    
    - name: Upload backend coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./backend/coverage/lcov.info
        flags: backend

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install frontend dependencies
      working-directory: ./frontend
      run: npm ci
    
    - name: Run frontend tests
      working-directory: ./frontend
      run: npm run test:coverage
    
    - name: Upload frontend coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./frontend/coverage/lcov.info
        flags: frontend

  e2e-tests:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:7.0
        ports:
          - 27017:27017
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
    
    - name: Install backend dependencies
      working-directory: ./backend
      run: npm ci
    
    - name: Install frontend dependencies
      working-directory: ./frontend
      run: npm ci
    
    - name: Install E2E dependencies
      working-directory: ./e2e
      run: npm ci && npx playwright install --with-deps
    
    - name: Start backend
      working-directory: ./backend
      run: npm run dev &
      env:
        MONGODB_URI: mongodb://localhost:27017/skillhub-test
        JWT_SECRET: test-secret-key
        PORT: 3001
    
    - name: Start frontend
      working-directory: ./frontend
      run: npm run dev &
    
    - name: Wait for services
      run: |
        sleep 10
        curl --retry 10 --retry-delay 5 --retry-connrefused http://localhost:3001/api/health
        curl --retry 10 --retry-delay 5 --retry-connrefused http://localhost:5173
    
    - name: Run E2E tests
      working-directory: ./e2e
      run: npm test
    
    - name: Upload E2E test results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: playwright-report
        path: ./e2e/playwright-report/
```

**Step 2: 提交 CI/CD 配置**

Run: `git add .github/workflows/test.yml && git commit -m "feat(ci): add automated testing workflow"`

Expected: 提交成功

**Step 3: 验证 CI/CD 运行**

Run: `git push origin main`

Expected: GitHub Actions 自动运行测试

---

## 模块 2: 用户体验优化

**目标**: 提升用户体验，降低使用门槛，提高用户满意度

**时间估算**: 3-4 周

**关键指标**:
- 用户满意度: 4.5/5
- 新手引导完成率: 80%+
- 错误处理满意度: 90%+

---

### Task 2.1: 新手引导系统

**Files:**
- Create: `frontend/src/components/onboarding/OnboardingTour.tsx`
- Create: `frontend/src/components/onboarding/TourStep.tsx`
- Create: `frontend/src/hooks/useOnboarding.ts`
- Create: `frontend/src/stores/onboardingStore.ts`

**Step 1: 创建引导状态管理**

Create: `frontend/src/stores/onboardingStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
  completed: boolean;
  currentStep: number;
  skipped: boolean;
  completeOnboarding: () => void;
  setCurrentStep: (step: number) => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      completed: false,
      currentStep: 0,
      skipped: false,
      completeOnboarding: () => set({ completed: true }),
      setCurrentStep: (step) => set({ currentStep: step }),
      skipOnboarding: () => set({ skipped: true, completed: true }),
      resetOnboarding: () => set({ completed: false, currentStep: 0, skipped: false }),
    }),
    {
      name: 'onboarding-storage',
    }
  )
);
```

**Step 2: 创建引导步骤组件**

Create: `frontend/src/components/onboarding/TourStep.tsx`

```typescript
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface TourStepProps {
  title: string;
  description: string;
  targetSelector: string;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export const TourStep: React.FC<TourStepProps> = ({
  title,
  description,
  targetSelector,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}) => {
  const targetElement = document.querySelector(targetSelector);
  const rect = targetElement?.getBoundingClientRect();

  if (!rect) return null;

  const position = {
    top: rect.bottom + 10,
    left: rect.left,
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onSkip}
      />
      <div
        className="fixed border-2 border-blue-500 rounded-lg pointer-events-none z-50"
        style={{
          top: rect.top - 4,
          left: rect.left - 4,
          width: rect.width + 8,
          height: rect.height + 8,
        }}
      />
      <Card
        className="fixed z-50 w-80 p-4 shadow-lg"
        style={position}
      >
        <div className="mb-3">
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {currentStep + 1} / {totalSteps}
          </span>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button size="sm" variant="outline" onClick={onPrev}>
                上一步
              </Button>
            )}
            <Button size="sm" onClick={onNext}>
              {currentStep === totalSteps - 1 ? '完成' : '下一步'}
            </Button>
          </div>
        </div>
        
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onSkip}
        >
          ✕
        </button>
      </Card>
    </>
  );
};
```

**Step 3: 创建引导流程组件**

Create: `frontend/src/components/onboarding/OnboardingTour.tsx`

```typescript
import React, { useEffect } from 'react';
import { TourStep } from './TourStep';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useAuthStore } from '@/stores/authStore';

const TOUR_STEPS = [
  {
    title: '欢迎来到 SkillHub',
    description: '这里是 AI 资源管理平台，让我们开始探索吧！',
    targetSelector: '[data-testid="logo"]',
  },
  {
    title: '浏览技能市场',
    description: '在这里发现和下载高质量的 AI 技能包',
    targetSelector: '[href="/skills"]',
  },
  {
    title: '探索提示词库',
    description: '浏览和使用社区贡献的提示词模板',
    targetSelector: '[href="/prompts"]',
  },
  {
    title: '上传资源',
    description: '分享你的技能和提示词给社区',
    targetSelector: '[href="/upload"]',
  },
  {
    title: '个人中心',
    description: '管理你的资源、收藏和设置',
    targetSelector: '[data-testid="user-menu"]',
  },
];

export const OnboardingTour: React.FC = () => {
  const { completed, currentStep, setCurrentStep, completeOnboarding, skipOnboarding } = useOnboardingStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated && !completed) {
      const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
      if (!hasSeenOnboarding) {
        setCurrentStep(0);
      }
    }
  }, [isAuthenticated, completed, setCurrentStep]);

  if (completed || currentStep >= TOUR_STEPS.length) {
    return null;
  }

  const handleNext = () => {
    if (currentStep === TOUR_STEPS.length - 1) {
      completeOnboarding();
      localStorage.setItem('hasSeenOnboarding', 'true');
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentTourStep = TOUR_STEPS[currentStep];

  return (
    <TourStep
      title={currentTourStep.title}
      description={currentTourStep.description}
      targetSelector={currentTourStep.targetSelector}
      currentStep={currentStep}
      totalSteps={TOUR_STEPS.length}
      onNext={handleNext}
      onPrev={handlePrev}
      onSkip={skipOnboarding}
    />
  );
};
```

**Step 4: 创建引导 Hook**

Create: `frontend/src/hooks/useOnboarding.ts`

```typescript
import { useEffect } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useAuthStore } from '@/stores/authStore';

export const useOnboarding = () => {
  const { completed, resetOnboarding } = useOnboardingStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated && !completed) {
      const shouldShowOnboarding = !localStorage.getItem('hasSeenOnboarding');
      if (shouldShowOnboarding) {
        resetOnboarding();
      }
    }
  }, [isAuthenticated, completed, resetOnboarding]);

  const startOnboarding = () => {
    resetOnboarding();
  };

  return {
    completed,
    startOnboarding,
  };
};
```

**Step 5: 集成引导组件到应用**

Modify: `frontend/src/App.tsx`

在 `<BrowserRouter>` 内添加:

```typescript
import { OnboardingTour } from './components/onboarding/OnboardingTour';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ... existing routes ... */}
      </Routes>
      <Toaster />
      <OnboardingTour />
    </BrowserRouter>
  );
}
```

**Step 6: 提交新手引导系统**

Run: `cd frontend && git add src/components/onboarding/ src/stores/onboardingStore.ts src/hooks/useOnboarding.ts src/App.tsx && git commit -m "feat(ux): add interactive onboarding tour system"`

Expected: 提交成功

---

### Task 2.2: 错误处理优化

**Files:**
- Create: `frontend/src/components/errors/ErrorBoundary.tsx`
- Create: `frontend/src/components/errors/ErrorMessage.tsx`
- Create: `frontend/src/utils/errorMessages.ts`
- Modify: `frontend/src/api/client.ts`

**Step 1: 创建错误消息映射**

Create: `frontend/src/utils/errorMessages.ts`

```typescript
export const ERROR_MESSAGES: Record<string, { title: string; description: string; action?: string }> = {
  NETWORK_ERROR: {
    title: '网络连接失败',
    description: '请检查您的网络连接，然后重试',
    action: '重试',
  },
  UNAUTHORIZED: {
    title: '未授权访问',
    description: '您的登录已过期，请重新登录',
    action: '重新登录',
  },
  FORBIDDEN: {
    title: '权限不足',
    description: '您没有权限执行此操作',
  },
  NOT_FOUND: {
    title: '资源不存在',
    description: '您请求的资源已被删除或不存在',
  },
  VALIDATION_ERROR: {
    title: '输入验证失败',
    description: '请检查您的输入是否符合要求',
  },
  SERVER_ERROR: {
    title: '服务器错误',
    description: '服务器遇到了问题，请稍后再试',
    action: '重试',
  },
  FILE_TOO_LARGE: {
    title: '文件过大',
    description: '文件大小超过限制（最大 50MB）',
  },
  INVALID_FILE_TYPE: {
    title: '文件类型不支持',
    description: '请上传支持的文件格式',
  },
};

export const getErrorMessage = (errorCode: string): typeof ERROR_MESSAGES[string] => {
  return ERROR_MESSAGES[errorCode] || {
    title: '未知错误',
    description: '发生了一个未知错误，请稍后再试',
    action: '重试',
  };
};
```

**Step 2: 创建错误展示组件**

Create: `frontend/src/components/errors/ErrorMessage.tsx`

```typescript
import React from 'react';
import { AlertCircle, RefreshCw, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ErrorMessageProps {
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
  variant?: 'inline' | 'card' | 'toast';
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  description,
  action,
  onAction,
  variant = 'inline',
}) => {
  const getActionIcon = () => {
    switch (action) {
      case '重试':
        return <RefreshCw className="w-4 h-4" />;
      case '重新登录':
        return <LogIn className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (variant === 'toast') {
    return (
      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-red-900">{title}</h4>
          <p className="text-sm text-red-700 mt-1">{description}</p>
          {action && onAction && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={onAction}
            >
              {getActionIcon()}
              <span className="ml-2">{action}</span>
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className="p-6 max-w-md mx-auto">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-2">{description}</p>
          {action && onAction && (
            <Button className="mt-4" onClick={onAction}>
              {getActionIcon()}
              <span className="ml-2">{action}</span>
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="flex items-center gap-2 text-red-600">
      <AlertCircle className="w-4 h-4" />
      <span className="text-sm">{title}</span>
    </div>
  );
};
```

**Step 3: 创建错误边界组件**

Create: `frontend/src/components/errors/ErrorBoundary.tsx`

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorMessage } from './ErrorMessage';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // 可以在这里上报错误到监控系统
    // reportError(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <ErrorMessage
            title="页面出现错误"
            description="抱歉，页面遇到了问题。请刷新页面或返回首页。"
            action="重试"
            onAction={this.handleRetry}
            variant="card"
          />
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Step 4: 优化 API 客户端错误处理**

Modify: `frontend/src/api/client.ts`

在响应拦截器中添加:

```typescript
import { getErrorMessage } from '@/utils/errorMessages';
import { toast } from 'sonner';

// 在 axios 实例中添加响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorCode = error.response?.data?.code || 'UNKNOWN_ERROR';
    const errorInfo = getErrorMessage(errorCode);

    // 根据错误类型处理
    switch (error.response?.status) {
      case 401:
        // 未授权，跳转到登录页
        window.location.href = '/login';
        break;
      case 403:
        toast.error(errorInfo.title, {
          description: errorInfo.description,
        });
        break;
      case 404:
        toast.error(errorInfo.title, {
          description: errorInfo.description,
        });
        break;
      case 500:
        toast.error(errorInfo.title, {
          description: errorInfo.description,
          action: errorInfo.action ? {
            label: errorInfo.action,
            onClick: () => window.location.reload(),
          } : undefined,
        });
        break;
      default:
        toast.error(errorInfo.title, {
          description: errorInfo.description,
        });
    }

    return Promise.reject(error);
  }
);
```

**Step 5: 集成错误边界到应用**

Modify: `frontend/src/main.tsx`

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/errors/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
```

**Step 6: 提交错误处理优化**

Run: `cd frontend && git add src/components/errors/ src/utils/errorMessages.ts src/api/client.ts src/main.tsx && git commit -m "feat(ux): improve error handling with user-friendly messages"`

Expected: 提交成功

---

## 模块 3: 性能优化

**目标**: 提升系统性能，确保可扩展性，优化用户体验

**时间估算**: 2-3 周

**关键指标**:
- API 响应时间: < 200ms (P95)
- 页面加载时间: < 2s
- 缓存命中率: 80%+

---

### Task 3.1: Redis 缓存集成

**Files:**
- Create: `backend/src/config/redis.ts`
- Create: `backend/src/middleware/cache.ts`
- Create: `backend/src/utils/cacheHelper.ts`
- Modify: `backend/package.json`
- Modify: `backend/src/app.ts`

**Step 1: 安装 Redis 依赖**

Run: `cd backend && npm install redis @types/redis`

Expected: 依赖安装成功

**Step 2: 创建 Redis 配置**

Create: `backend/src/config/redis.ts`

```typescript
import { createClient } from 'redis';
import { logger } from '../utils/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = createClient({
  url: redisUrl,
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis Client Connected');
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info('Redis connection established');
  } catch (error) {
    logger.error('Redis connection failed:', error);
    process.exit(1);
  }
};

export const disconnectRedis = async () => {
  await redisClient.quit();
};
```

**Step 3: 创建缓存辅助函数**

Create: `backend/src/utils/cacheHelper.ts`

```typescript
import { redisClient } from '../config/redis';
import { logger } from './logger';

const DEFAULT_TTL = 3600; // 1 hour

export class CacheHelper {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  static async set(key: string, value: any, ttl: number = DEFAULT_TTL): Promise<void> {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  static async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
    }
  }

  static generateKey(...parts: string[]): string {
    return parts.join(':');
  }
}
```

**Step 4: 创建缓存中间件**

Create: `backend/src/middleware/cache.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { CacheHelper } from '../utils/cacheHelper';

export const cache = (ttl: number = 3600) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = CacheHelper.generateKey('cache', req.originalUrl);

    try {
      const cachedData = await CacheHelper.get(key);
      
      if (cachedData) {
        res.set('X-Cache', 'HIT');
        return res.json(cachedData);
      }

      res.set('X-Cache', 'MISS');
      
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        CacheHelper.set(key, body, ttl).catch(err => {
          console.error('Cache set error:', err);
        });
        return originalJson(body);
      };

      next();
    } catch (error) {
      next();
    }
  };
};

export const clearCache = (pattern: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        CacheHelper.delPattern(pattern).catch(err => {
          console.error('Cache clear error:', err);
        });
      }
    });
    next();
  };
};
```

**Step 5: 集成 Redis 到应用**

Modify: `backend/src/app.ts`

在 MongoDB 连接后添加:

```typescript
import { connectRedis } from './config/redis';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    logger.info('Connected to MongoDB');
    
    // 连接 Redis
    if (process.env.REDIS_URL) {
      await connectRedis();
    }
    
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  });
```

**Step 6: 应用缓存到热点 API**

Modify: `backend/src/routes/skills.ts`

```typescript
import { cache, clearCache } from '../middleware/cache';

// 对列表查询应用缓存
router.get('/', cache(600), skillController.getSkills);

// 对详情查询应用缓存
router.get('/:id', cache(1800), skillController.getSkillById);

// 创建/更新/删除时清除缓存
router.post('/', clearCache('cache:/api/skills*'), skillController.createSkill);
router.put('/:id', clearCache('cache:/api/skills*'), skillController.updateSkill);
router.delete('/:id', clearCache('cache:/api/skills*'), skillController.deleteSkill);
```

**Step 7: 提交 Redis 缓存集成**

Run: `cd backend && git add src/config/redis.ts src/middleware/cache.ts src/utils/cacheHelper.ts src/app.ts src/routes/skills.ts package.json && git commit -m "feat(perf): integrate Redis caching for hot data"`

Expected: 提交成功

---

### Task 3.2: 数据库索引优化

**Files:**
- Create: `backend/src/scripts/createIndexes.ts`
- Modify: `backend/src/models/Skill.ts`
- Modify: `backend/src/models/Prompt.ts`
- Modify: `backend/src/models/User.ts`

**Step 1: 为 Skill 模型添加索引**

Modify: `backend/src/models/Skill.ts`

在 Schema 定义后添加:

```typescript
// 单字段索引
skillSchema.index({ owner: 1 });
skillSchema.index({ enterpriseId: 1 });
skillSchema.index({ category: 1 });
skillSchema.index({ status: 1 });
skillSchema.index({ visibility: 1 });
skillSchema.index({ createdAt: -1 });
skillSchema.index({ downloads: -1 });
skillSchema.index({ averageRating: -1 });

// 复合索引
skillSchema.index({ visibility: 1, status: 1 });
skillSchema.index({ owner: 1, visibility: 1 });
skillSchema.index({ enterpriseId: 1, visibility: 1 });
skillSchema.index({ category: 1, visibility: 1, status: 1 });

// 文本索引（用于搜索）
skillSchema.index({ name: 'text', description: 'text', tags: 'text' });
```

**Step 2: 为 Prompt 模型添加索引**

Modify: `backend/src/models/Prompt.ts`

在 Schema 定义后添加:

```typescript
// 单字段索引
promptSchema.index({ owner: 1 });
promptSchema.index({ enterpriseId: 1 });
promptSchema.index({ category: 1 });
promptSchema.index({ status: 1 });
promptSchema.index({ visibility: 1 });
promptSchema.index({ createdAt: -1 });
promptSchema.index({ usageCount: -1 });
promptSchema.index({ averageRating: -1 });

// 复合索引
promptSchema.index({ visibility: 1, status: 1 });
promptSchema.index({ owner: 1, visibility: 1 });
promptSchema.index({ enterpriseId: 1, visibility: 1 });
promptSchema.index({ category: 1, visibility: 1, status: 1 });

// 文本索引（用于搜索）
promptSchema.index({ name: 'text', description: 'text', content: 'text', tags: 'text' });
```

**Step 3: 为 User 模型添加索引**

Modify: `backend/src/models/User.ts`

在 Schema 定义后添加:

```typescript
// 单字段索引（username 和 email 已有 unique 索引）
userSchema.index({ enterpriseId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// 复合索引
userSchema.index({ enterpriseId: 1, role: 1 });
```

**Step 4: 创建索引脚本**

Create: `backend/src/scripts/createIndexes.ts`

```typescript
import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { Skill } from '../models/Skill';
import { Prompt } from '../models/Prompt';
import { User } from '../models/User';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillhub';

async function createIndexes() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    logger.info('Creating indexes for Skill model...');
    await Skill.ensureIndexes();
    logger.info('Skill indexes created');

    logger.info('Creating indexes for Prompt model...');
    await Prompt.ensureIndexes();
    logger.info('Prompt indexes created');

    logger.info('Creating indexes for User model...');
    await User.ensureIndexes();
    logger.info('User indexes created');

    logger.info('All indexes created successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error creating indexes:', error);
    process.exit(1);
  }
}

createIndexes();
```

**Step 5: 添加索引创建脚本到 package.json**

Modify: `backend/package.json`

在 `scripts` 部分添加:

```json
{
  "scripts": {
    "create-indexes": "ts-node src/scripts/createIndexes.ts"
  }
}
```

**Step 6: 运行索引创建脚本**

Run: `cd backend && npm run create-indexes`

Expected: 索引创建成功

**Step 7: 提交数据库索引优化**

Run: `cd backend && git add src/models/ src/scripts/createIndexes.ts package.json && git commit -m "feat(perf): add database indexes for query optimization"`

Expected: 提交成功

---

## 模块 4: 监控告警

**目标**: 建立完善的监控告警体系，保障系统稳定性

**时间估算**: 2 周

**关键指标**:
- 监控覆盖率: 100%
- 告警响应时间: < 5 分钟
- 故障发现率: 99%+

---

### Task 4.1: 应用性能监控

**Files:**
- Create: `backend/src/middleware/performanceMonitor.ts`
- Create: `backend/src/utils/metrics.ts`
- Create: `backend/src/routes/metrics.ts`

**Step 1: 创建性能监控中间件**

Create: `backend/src/middleware/performanceMonitor.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface RequestMetrics {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
}

const metrics: RequestMetrics[] = [];

export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const metric: RequestMetrics = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      timestamp: new Date(),
    };

    metrics.push(metric);

    // 记录慢请求
    if (responseTime > 1000) {
      logger.warn(`Slow request: ${req.method} ${req.path} - ${responseTime}ms`);
    }

    // 记录错误请求
    if (res.statusCode >= 400) {
      logger.error(`Error request: ${req.method} ${req.path} - ${res.statusCode}`);
    }
  });

  next();
};

export const getMetrics = () => {
  return metrics;
};

export const clearMetrics = () => {
  metrics.length = 0;
};
```

**Step 2: 创建指标收集工具**

Create: `backend/src/utils/metrics.ts`

```typescript
import os from 'os';

export interface SystemMetrics {
  cpu: number;
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  uptime: number;
  timestamp: Date;
}

export class MetricsCollector {
  static getSystemMetrics(): SystemMetrics {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      cpu: os.loadavg()[0],
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        usagePercent: (usedMemory / totalMemory) * 100,
      },
      uptime: os.uptime(),
      timestamp: new Date(),
    };
  }

  static getProcessMetrics() {
    const memoryUsage = process.memoryUsage();
    
    return {
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
      rss: memoryUsage.rss,
      uptime: process.uptime(),
      timestamp: new Date(),
    };
  }
}
```

**Step 3: 创建指标 API 路由**

Create: `backend/src/routes/metrics.ts`

```typescript
import { Router } from 'express';
import { MetricsCollector } from '../utils/metrics';
import { getMetrics } from '../middleware/performanceMonitor';

const router = Router();

router.get('/system', (req, res) => {
  const metrics = MetricsCollector.getSystemMetrics();
  res.json(metrics);
});

router.get('/process', (req, res) => {
  const metrics = MetricsCollector.getProcessMetrics();
  res.json(metrics);
});

router.get('/requests', (req, res) => {
  const metrics = getMetrics();
  res.json(metrics);
});

export default router;
```

**Step 4: 集成监控中间件到应用**

Modify: `backend/src/app.ts`

```typescript
import { performanceMonitor } from './middleware/performanceMonitor';
import metricsRoutes from './routes/metrics';

app.use(performanceMonitor());
app.use('/api/metrics', metricsRoutes);
```

**Step 5: 提交性能监控**

Run: `cd backend && git add src/middleware/performanceMonitor.ts src/utils/metrics.ts src/routes/metrics.ts src/app.ts && git commit -m "feat(monitor): add application performance monitoring"`

Expected: 提交成功

---

## 总结

**计划完成并保存到 `docs/plans/2026-03-17-phase1-foundation-plan.md`**

### 实施优先级

**Sprint 1 (Week 1-2)**:
- ✅ Task 1.1-1.4: 测试体系建设
- ✅ Task 3.1-3.2: 性能优化（Redis + 索引）

**Sprint 2 (Week 3-4)**:
- ✅ Task 1.5-1.7: 前端测试 + E2E 测试 + CI/CD
- ✅ Task 2.1: 新手引导系统

**Sprint 3 (Week 5-6)**:
- ✅ Task 2.2: 错误处理优化
- ✅ Task 4.1: 性能监控

**Sprint 4 (Week 7-8)**:
- ✅ 整体测试和优化
- ✅ 文档完善
- ✅ 部署和验证

### 关键成功指标

| 指标 | 目标 | 验证方法 |
|------|------|----------|
| 测试覆盖率 | 80%+ | `npm run test:coverage` |
| API 响应时间 | < 200ms (P95) | 性能监控 |
| 页面加载时间 | < 2s | Lighthouse |
| 缓存命中率 | 80%+ | Redis 监控 |
| 系统可用性 | 99.5%+ | 监控系统 |

### 风险与应对

| 风险 | 应对措施 |
|------|----------|
| 测试覆盖率不达标 | 优先覆盖核心模块，逐步提升 |
| 性能优化效果不明显 | 持续监控，迭代优化 |
| Redis 连接问题 | 添加降级策略，缓存失败不影响服务 |
| CI/CD 配置复杂 | 分步实施，先本地后云端 |

---

**两种执行方式:**

**1. Subagent-Driven (当前会话)** - 我在当前会话中逐任务调度子代理执行，任务间进行代码审查，快速迭代

**2. Parallel Session (独立会话)** - 打开新会话使用 executing-plans skill，批量执行并设置检查点

**选择哪种方式？**
