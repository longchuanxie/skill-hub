# SkillHub 企业级功能增强实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现 SkillHub 企业级功能增强，包括国际化、自定义页面、版本控制、OAuth2 登录和 Agent API 前端管理

**Architecture:** 前端使用 React + TypeScript + Vite + react-i18next，后端使用 Express + TypeScript + MongoDB，采用 RESTful API 设计

**Tech Stack:** React 18, TypeScript, Express, MongoDB, react-i18next, zustand, axios

---

## Phase 1: 国际化基础架构

### Task 1: 安装国际化依赖

**Files:**
- Modify: `frontend/package.json`

**Step 1: 安装 react-i18next 相关依赖**

```bash
cd d:\workplace\idea\agent-browser\frontend
npm install i18next react-i18next i18next-browser-languagedetector
```

**Step 2: 验证安装成功**

Run: `npm list i18next react-i18next`
Expected: 显示已安装的版本

---

### Task 2: 创建国际化配置和翻译文件

**Files:**
- Create: `frontend/src/i18n/index.ts`
- Create: `frontend/src/i18n/locales/en.json`
- Create: `frontend/src/i18n/locales/zh.json`

**Step 1: 创建 i18n 配置文件**

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import zh from './locales/zh.json';

const resources = {
  en: { translation: en },
  zh: { translation: zh },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
```

**Step 2: 创建英文翻译文件**

```json
{
  "common": {
    "submit": "Submit",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "view": "View",
    "create": "Create",
    "search": "Search",
    "loading": "Loading...",
    "confirm": "Confirm",
    "back": "Back",
    "next": "Next",
    "previous": "Previous",
    "all": "All",
    "none": "None",
    "yes": "Yes",
    "no": "No"
  },
  "nav": {
    "home": "Home",
    "skills": "Skills",
    "prompts": "Prompts",
    "myResources": "My Resources",
    "profile": "Profile",
    "settings": "Settings",
    "upload": "Upload",
    "about": "About",
    "terms": "Terms",
    "privacy": "Privacy"
  },
  "auth": {
    "login": "Login",
    "register": "Register",
    "logout": "Logout",
    "forgotPassword": "Forgot Password",
    "resetPassword": "Reset Password",
    "username": "Username",
    "email": "Email",
    "password": "Password",
    "confirmPassword": "Confirm Password",
    "rememberMe": "Remember me",
    "noAccount": "Don't have an account?",
    "hasAccount": "Already have an account?",
    "loginSuccess": "Login successful",
    "logoutSuccess": "Logout successful",
    "registerSuccess": "Registration successful",
    "orContinueWith": "Or continue with"
  },
  "skills": {
    "title": "Skills",
    "createSkill": "Create Skill",
    "editSkill": "Edit Skill",
    "skillName": "Skill Name",
    "description": "Description",
    "category": "Category",
    "tags": "Tags",
    "visibility": "Visibility",
    "version": "Version",
    "downloads": "Downloads",
    "rating": "Rating",
    "uploadFile": "Upload File",
    "download": "Download",
    "versions": "Versions",
    "versionHistory": "Version History",
    "createVersion": "Create New Version",
    "latestVersion": "Latest Version"
  },
  "prompts": {
    "title": "Prompts",
    "createPrompt": "Create Prompt",
    "editPrompt": "Edit Prompt",
    "promptName": "Prompt Name",
    "content": "Content",
    "variables": "Variables",
    "usageCount": "Usage Count"
  },
  "agents": {
    "title": "API Agents",
    "createAgent": "Create Agent",
    "agentName": "Agent Name",
    "apiKey": "API Key",
    "permissions": "Permissions",
    "rateLimit": "Rate Limit",
    "usage": "Usage Statistics",
    "regenerateKey": "Regenerate Key",
    "copyKey": "Copy Key",
    "keyCopied": "API Key copied to clipboard",
    "lastUsed": "Last Used",
    "totalRequests": "Total Requests"
  },
  "settings": {
    "title": "Settings",
    "language": "Language",
    "theme": "Theme",
    "notifications": "Notifications",
    "account": "Account",
    "security": "Security",
    "preferences": "Preferences"
  },
  "footer": {
    "copyright": "SkillHub Platform",
    "allRightsReserved": "All rights reserved"
  },
  "errors": {
    "required": "This field is required",
    "invalidEmail": "Invalid email address",
    "passwordMismatch": "Passwords do not match",
    "minLength": "Minimum {{count}} characters required",
    "maxLength": "Maximum {{count}} characters allowed",
    "networkError": "Network error, please try again",
    "unauthorized": "Unauthorized access",
    "notFound": "Resource not found",
    "serverError": "Server error, please try again later"
  },
  "success": {
    "saved": "Saved successfully",
    "deleted": "Deleted successfully",
    "updated": "Updated successfully",
    "created": "Created successfully"
  }
}
```

**Step 3: 创建中文翻译文件**

```json
{
  "common": {
    "submit": "提交",
    "cancel": "取消",
    "save": "保存",
    "delete": "删除",
    "edit": "编辑",
    "view": "查看",
    "create": "创建",
    "search": "搜索",
    "loading": "加载中...",
    "confirm": "确认",
    "back": "返回",
    "next": "下一步",
    "previous": "上一步",
    "all": "全部",
    "none": "无",
    "yes": "是",
    "no": "否"
  },
  "nav": {
    "home": "首页",
    "skills": "技能",
    "prompts": "提示词",
    "myResources": "我的资源",
    "profile": "个人资料",
    "settings": "设置",
    "upload": "上传",
    "about": "关于我们",
    "terms": "服务条款",
    "privacy": "隐私政策"
  },
  "auth": {
    "login": "登录",
    "register": "注册",
    "logout": "退出登录",
    "forgotPassword": "忘记密码",
    "resetPassword": "重置密码",
    "username": "用户名",
    "email": "邮箱",
    "password": "密码",
    "confirmPassword": "确认密码",
    "rememberMe": "记住我",
    "noAccount": "还没有账号？",
    "hasAccount": "已有账号？",
    "loginSuccess": "登录成功",
    "logoutSuccess": "退出成功",
    "registerSuccess": "注册成功",
    "orContinueWith": "或通过以下方式继续"
  },
  "skills": {
    "title": "技能",
    "createSkill": "创建技能",
    "editSkill": "编辑技能",
    "skillName": "技能名称",
    "description": "描述",
    "category": "分类",
    "tags": "标签",
    "visibility": "可见性",
    "version": "版本",
    "downloads": "下载量",
    "rating": "评分",
    "uploadFile": "上传文件",
    "download": "下载",
    "versions": "版本",
    "versionHistory": "版本历史",
    "createVersion": "创建新版本",
    "latestVersion": "最新版本"
  },
  "prompts": {
    "title": "提示词",
    "createPrompt": "创建提示词",
    "editPrompt": "编辑提示词",
    "promptName": "提示词名称",
    "content": "内容",
    "variables": "变量",
    "usageCount": "使用次数"
  },
  "agents": {
    "title": "API 代理",
    "createAgent": "创建代理",
    "agentName": "代理名称",
    "apiKey": "API 密钥",
    "permissions": "权限",
    "rateLimit": "速率限制",
    "usage": "使用统计",
    "regenerateKey": "重新生成密钥",
    "copyKey": "复制密钥",
    "keyCopied": "API 密钥已复制到剪贴板",
    "lastUsed": "最后使用",
    "totalRequests": "总请求数"
  },
  "settings": {
    "title": "设置",
    "language": "语言",
    "theme": "主题",
    "notifications": "通知",
    "account": "账户",
    "security": "安全",
    "preferences": "偏好设置"
  },
  "footer": {
    "copyright": "SkillHub 平台",
    "allRightsReserved": "版权所有"
  },
  "errors": {
    "required": "此字段为必填项",
    "invalidEmail": "无效的邮箱地址",
    "passwordMismatch": "两次密码输入不一致",
    "minLength": "最少需要 {{count}} 个字符",
    "maxLength": "最多允许 {{count}} 个字符",
    "networkError": "网络错误，请重试",
    "unauthorized": "未授权访问",
    "notFound": "资源未找到",
    "serverError": "服务器错误，请稍后重试"
  },
  "success": {
    "saved": "保存成功",
    "deleted": "删除成功",
    "updated": "更新成功",
    "created": "创建成功"
  }
}
```

---

### Task 3: 创建语言状态管理和切换组件

**Files:**
- Create: `frontend/src/stores/languageStore.ts`
- Create: `frontend/src/components/LanguageSwitcher.tsx`

**Step 1: 创建语言状态管理**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'en' | 'zh' | 'auto';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'auto',
      setLanguage: (lang) => set({ language: lang }),
    }),
    { name: 'language-storage' }
  )
);
```

**Step 2: 创建语言切换组件**

```typescript
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '../stores/languageStore';
import { Button } from './ui/button';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { language, setLanguage } = useLanguageStore();

  const handleChange = (lang: 'en' | 'zh') => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={i18n.language === 'en' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleChange('en')}
        className="px-2"
      >
        EN
      </Button>
      <Button
        variant={i18n.language === 'zh' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleChange('zh')}
        className="px-2"
      >
        中文
      </Button>
    </div>
  );
}
```

---

### Task 4: 集成 i18n 到应用入口

**Files:**
- Modify: `frontend/src/main.tsx`

**Step 1: 导入 i18n 配置**

在文件顶部添加导入:

```typescript
import './i18n';
```

**Step 2: 验证 i18n 集成**

Run: `npm run dev`
Expected: 应用正常启动，无错误

---

### Task 5: 更新 Layout 组件使用国际化

**Files:**
- Modify: `frontend/src/components/Layout.tsx`

**Step 1: 添加 i18n 导入和使用**

在文件顶部添加:

```typescript
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
```

**Step 2: 在组件中使用翻译**

在 Layout 组件函数内添加:

```typescript
const { t } = useTranslation();
```

**Step 3: 替换硬编码文本**

将导航和页脚的硬编码文本替换为 `t()` 函数调用

**Step 4: 添加语言切换组件**

在 header 的右侧区域添加 LanguageSwitcher 组件

---

## Phase 2: 自定义页面功能

### Task 6: 创建 CustomPage 数据模型

**Files:**
- Create: `backend/src/models/CustomPage.ts`

---

### Task 7: 创建 CustomPage 控制器

**Files:**
- Create: `backend/src/controllers/customPageController.ts`

---

### Task 8: 创建 CustomPage 路由

**Files:**
- Create: `backend/src/routes/customPages.ts`

---

### Task 9: 添加管理员权限中间件

**Files:**
- Modify: `backend/src/middleware/auth.ts`

---

### Task 10: 注册 CustomPage 路由到应用

**Files:**
- Modify: `backend/src/app.ts`

---

### Task 11: 创建前端自定义页面 API

**Files:**
- Create: `frontend/src/api/customPages.ts`

---

### Task 12: 创建自定义页面展示组件

**Files:**
- Create: `frontend/src/pages/AboutPage.tsx`
- Create: `frontend/src/pages/TermsPage.tsx`
- Create: `frontend/src/pages/PrivacyPage.tsx`
- Create: `frontend/src/components/CustomPageView.tsx`

---

### Task 13: 注册自定义页面路由

**Files:**
- Modify: `frontend/src/App.tsx`

---

### Task 14: 安装 react-markdown 依赖

**Files:**
- Modify: `frontend/package.json`

---

## Phase 3: 版本控制功能

### Task 15: 创建 ResourceVersion 数据模型

**Files:**
- Create: `backend/src/models/ResourceVersion.ts`

---

### Task 16: 创建版本控制器

**Files:**
- Create: `backend/src/controllers/versionController.ts`

---

### Task 17: 创建版本路由

**Files:**
- Create: `backend/src/routes/versions.ts`

---

### Task 18: 注册版本路由

**Files:**
- Modify: `backend/src/app.ts`

---

### Task 19: 创建前端版本 API

**Files:**
- Create: `frontend/src/api/versions.ts`

---

### Task 20: 创建版本列表组件

**Files:**
- Create: `frontend/src/components/VersionList.tsx`

---

## Phase 4: OAuth2 登录集成

### Task 21: 创建 OAuthProvider 数据模型

**Files:**
- Create: `backend/src/models/OAuthProvider.ts`

---

### Task 22: 创建 OAuthSession 数据模型

**Files:**
- Create: `backend/src/models/OAuthSession.ts`

---

### Task 23: 实现 OAuth 控制器

**Files:**
- Modify: `backend/src/routes/oauth.ts`

---

### Task 24: 更新 OAuth 路由注册

**Files:**
- Modify: `backend/src/app.ts`

---

### Task 25: 创建前端 OAuth API

**Files:**
- Create: `frontend/src/api/oauth.ts`

---

### Task 26: 创建 OAuth 回调页面

**Files:**
- Create: `frontend/src/pages/OAuthCallbackPage.tsx`

---

### Task 27: 创建 OAuth 登录按钮组件

**Files:**
- Create: `frontend/src/components/OAuthLoginButton.tsx`

---

### Task 28: 注册 OAuth 回调路由

**Files:**
- Modify: `frontend/src/App.tsx`

---

### Task 29: 更新登录页面添加 OAuth 登录

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx`

---

## Phase 5: Agent API 前端管理

### Task 30: 创建前端 Agent API

**Files:**
- Create: `frontend/src/api/agents.ts`

---

### Task 31: 创建 Agent 列表页面

**Files:**
- Create: `frontend/src/pages/AgentsPage.tsx`

---

### Task 32: 创建 Agent 详情页面

**Files:**
- Create: `frontend/src/pages/AgentDetailPage.tsx`

---

### Task 33: 创建 Agent 创建页面

**Files:**
- Create: `frontend/src/pages/AgentCreatePage.tsx`

---

### Task 34: 注册 Agent 路由

**Files:**
- Modify: `frontend/src/App.tsx`

---

### Task 35: 安装 axios 依赖 (后端)

**Files:**
- Modify: `backend/package.json`

---

## 实施顺序建议

1. **Phase 1 (国际化)** - 基础设施，其他功能依赖
2. **Phase 2 (自定义页面)** - 独立功能，可并行
3. **Phase 3 (版本控制)** - 核心功能增强
4. **Phase 4 (OAuth2)** - 企业集成功能
5. **Phase 5 (Agent API)** - 前端管理界面

---

**计划完成，保存至 `docs/plans/2026-03-15-enterprise-features.md`**
