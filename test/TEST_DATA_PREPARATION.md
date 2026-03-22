# 测试数据准备文档

## 概述
本文档记录 SkillHub 项目集成测试所需的测试账号和测试数据。

---

## 1. 测试账号

### 1.1 用户账号

| 用户名 | 邮箱 | 密码 | 状态 | 注册时间 |
|--------|------|------|------|----------|
| testuser3 | testuser3@example.com | Test123456 | 活跃 | 2026-03-21 |

> ⚠️ **注意**：由于系统使用内存数据库，每次重启后需要重新注册测试账号。

### 1.2 测试账号说明

- **testuser2**: 当前活跃测试账号，用于功能验证
  - 角色：普通用户
  - 可用功能：创建/编辑技能、提示词，上传文件等

---

## 2. 测试资源

### 2.1 测试技能文件

| 文件名 | 路径 | 描述 |
|--------|------|------|
| test-skill-1.zip | `test/test-skill-1.zip` | 基础测试技能（无frontmatter） |
| test-skill-2.zip | `test/test-skill-2.zip` | 测试技能2 |
| test-skill-frontmatter.zip | `test/skill-test/test-skill-frontmatter.zip` | 带frontmatter的测试技能 |

### 2.2 测试提示词

| 文件名 | 路径 | 描述 |
|--------|------|------|
| test-prompt-1.json | `test/prompts/test-prompt-1.json` | 测试提示词数据 |

---

## 3. 测试环境

- **前端地址**: http://localhost:5173
- **后端地址**: http://localhost:3001
- **数据库**: 内存数据库（mongodb-memory-server）
- **语言**: 中文/英文

---

## 4. 使用指南

### 4.1 初始化测试数据

1. 启动后端服务：`npm run dev`（backend目录）
2. 启动前端服务：`npm run dev`（frontend目录）
3. 访问 http://localhost:5173/register 注册新账号
4. 使用注册的账号登录

### 4.2 注意事项

- 内存数据库会在服务重启后清空所有数据
- 每个测试会话需要重新注册账号
- 测试文件路径基于项目根目录

---

## 5. 更新记录

| 日期 | 更新内容 | 更新人 |
|------|----------|--------|
| 2026-03-21 | 添加testuser2账号 | Claude |
