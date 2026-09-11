# Frontend - Agent Browser UI

Agent Browser 前端应用，基于 React 18 和 TypeScript 构建的技能与提示词管理界面。

## 技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **React Router v6** - 路由管理
- **Zustand** - 状态管理
- **i18next** - 国际化
- **Radix UI** - 无障碍 UI 组件
- **Lucide React** - 图标库

## 目录结构

```
frontend/
├── src/
│   ├── components/      # React 组件
│   │   ├── layout/     # 布局组件
│   │   │   ├── Container.tsx
│   │   │   ├── Flex.tsx
│   │   │   ├── Grid.tsx
│   │   │   └── ...
│   │   ├── ui/         # 基础 UI 组件
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Dialog.tsx
│   │   │   └── ...
│   │   ├── typography/ # 排版组件
│   │   │   ├── Text.tsx
│   │   │   ├── Heading.tsx
│   │   │   └── ...
│   │   ├── VersionCard.tsx      # 版本卡片组件
│   │   ├── VersionDiffPanel.tsx # 版本差异面板
│   │   └── ...
│   ├── pages/           # 页面组件
│   │   ├── Home.tsx             # 首页
│   │   ├── Login.tsx            # 登录页
│   │   ├── Register.tsx         # 注册页
│   │   ├── Skills.tsx           # 技能市场
│   │   ├── Prompts.tsx          # 提示词市场
│   │   ├── SkillDetail.tsx      # 技能详情
│   │   ├── PromptDetail.tsx     # 提示词详情
│   │   ├── PromptVersionHistoryPage.tsx    # 版本历史
│   │   ├── PromptVersionComparePage.tsx    # 版本对比
│   │   ├── Profile.tsx          # 个人中心
│   │   └── ...
│   ├── services/        # API 服务
│   │   └── api.ts       # API 接口封装
│   ├── stores/          # 状态管理
│   │   ├── authStore.ts         # 认证状态
│   │   └── ...
│   ├── i18n/            # 国际化
│   │   ├── index.ts             # i18n 配置
│   │   └── locales/             # 语言文件
│   │       ├── zh.json          # 中文
│   │       └── en.json          # 英文
│   ├── lib/             # 工具库
│   │   └── utils.ts             # 工具函数
│   ├── App.tsx          # 主应用组件
│   └── main.tsx         # 入口文件
├── public/              # 静态资源
├── index.html           # HTML 模板
├── package.json
├── vite.config.ts       # Vite 配置
├── tailwind.config.js   # Tailwind 配置
└── tsconfig.json        # TypeScript 配置
```

## 安装与运行

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 主要页面

### 公共页面
| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | Home | 首页，展示热门技能和提示词 |
| `/login` | Login | 用户登录 |
| `/register` | Register | 用户注册 |
| `/skills` | Skills | 技能市场 |
| `/prompts` | Prompts | 提示词市场 |
| `/skills/:id` | SkillDetail | 技能详情 |
| `/prompts/:id` | PromptDetail | 提示词详情 |

### 用户页面
| 路由 | 页面 | 说明 |
|------|------|------|
| `/profile` | Profile | 个人中心 |
| `/my/resources` | MyResources | 我的资源 |
| `/settings` | Settings | 设置页面 |
| `/settings/api-keys` | ApiKeys | API Key 管理 |

### 版本控制页面
| 路由 | 页面 | 说明 |
|------|------|------|
| `/prompts/:id/versions` | PromptVersionHistoryPage | 提示词版本历史 |
| `/prompts/:id/compare` | PromptVersionComparePage | 提示词版本对比 |

## 核心组件

### VersionCard
版本卡片组件，用于展示版本信息：
- 版本号和创建时间
- 当前版本标识
- 选中状态指示
- 操作按钮（对比、回滚）

### VersionDiffPanel
版本差异面板，用于展示两个版本的差异：
- 内容变更高亮
- 描述变更提示
- 变量变更提示

### 布局组件
- `Container` - 容器组件，支持最大宽度设置
- `Flex` - 弹性布局组件
- `Grid` - 网格布局组件

## 国际化

支持中文和英文两种语言，配置位于 `src/i18n/locales/`：

```typescript
// 切换语言
import { useTranslation } from 'react-i18next';

const { t, i18n } = useTranslation();

// 切换到中文
i18n.changeLanguage('zh');

// 切换到英文
i18n.changeLanguage('en');
```

## 状态管理

使用 Zustand 进行状态管理：

```typescript
// authStore.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}));
```

## API 调用

所有 API 调用都通过 `services/api.ts` 封装：

```typescript
// 获取技能列表
const skills = await api.getSkills({ page: 1, pageSize: 12 });

// 获取提示词详情
const prompt = await api.getPrompt(id);

// 创建提示词
await api.createPrompt({
  name: 'My Prompt',
  content: '...',
  variables: []
});
```

## 样式规范

使用 Tailwind CSS 进行样式开发：
- 遵循移动优先原则
- 使用语义化的颜色变量
- 支持暗色模式

## 许可证

MIT License
