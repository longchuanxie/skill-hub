# SkillHub 安装部署指南

## 方式一：使用 npm 一键安装（推荐）

### 前置要求

- Node.js >= 18.0.0
- MongoDB >= 6.0
- Redis >= 6.0（可选，用于缓存）

### 安装步骤

```bash
# 1. 全局安装 skillhub
npm install -g @xielc/skillhub

# 2. 进入安装目录（全局 node_modules）
cd $(npm root -g)/xielc/skillhub

# 3. 配置环境变量
cp backend/.env.example backend/.env
# 编辑 backend/.env 文件，配置 MongoDB 等信息

# 4. 启动服务
npm start
```

### 验证安装

访问 `http://localhost:3001`，看到 SkillHub 界面即表示安装成功。

---

## 方式二：从源码构建

### 前置要求

- Node.js >= 18.0.0
- npm >= 8.0.0
- MongoDB >= 6.0
- Redis >= 6.0（可选）
- Git

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/xielc/skill-hub.git
cd skill-hub

# 2. 安装所有依赖
npm install

# 3. 配置环境变量
cp backend/.env.example backend/.env
# 编辑 backend/.env 文件

# 4. 启动服务
npm start
```

---

## 环境变量配置

在 `backend/.env` 中配置以下变量：

```env
# 服务端口
PORT=3001

# MongoDB 连接
MONGODB_URI=mongodb://localhost:27017/skillhub

# Redis 连接（可选）
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS Origins（前端地址）
CORS_ORIGIN=http://localhost:3001

# JWT Secret
JWT_SECRET=your-secret-key-here

# Base URL（用于生成文件访问链接）
BASE_URL=http://localhost:3001

# 存储类型（local 或 minio）
STORAGE_TYPE=local

# 文件上传大小限制
MAX_FILE_SIZE=104857600
```

---

## 使用 PM2 部署生产环境

```bash
# 1. 安装 PM2
npm install -g pm2

# 2. 在项目目录创建 ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'skillhub',
    script: 'backend/dist/app.js',
    cwd: './',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
EOF

# 3. 启动服务
pm2 start ecosystem.config.js

# 4. 保存进程列表
pm2 save

# 5. 设置开机自启
pm2 startup
```

---

## Docker 部署

```bash
# 使用 Docker Compose
version: '3.8'

services:
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  skillhub:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/skillhub
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - mongodb
      - redis

volumes:
  mongodb_data:
```

---

## 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发模式启动后端 |
| `npm run dev:frontend` | 开发模式启动前端 |
| `npm run build:all` | 构建前后端 |
| `npm start` | 生产环境启动 |
| `npm test` | 运行后端测试 |
| `npm run test:frontend` | 运行前端测试 |

---

## 目录结构

```
skillhub/
├── backend/           # 后端服务
│   ├── dist/         # 编译输出
│   ├── src/          # 源代码
│   └── uploads/      # 上传文件存储
├── frontend/         # 前端应用
│   ├── dist/         # 编译输出
│   └── src/          # 源代码
├── docs/             # 文档
├── .env              # 环境变量配置
└── package.json      # 根配置文件
```
