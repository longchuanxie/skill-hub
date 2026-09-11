# SkillHub 前端详细设计文档

## 1. 技术架构概述

### 1.1 技术栈

| 层级 | 技术选型 | 版本要求 | 说明 |
|------|----------|----------|------|
| 框架 | React | 18.x | 前端UI框架 |
| 语言 | TypeScript | 5.x | 类型安全 |
| 构建工具 | Vite | 5.x | 快速构建工具 |
| UI组件库 | animate-ui | latest | 动画UI组件库 |
| 样式方案 | Tailwind CSS | 3.x | 原子化CSS框架 |
| 状态管理 | Zustand | 4.x | 轻量级状态管理 |
| 路由 | React Router | 6.x | 前端路由 |
| HTTP客户端 | Axios | 1.x | HTTP请求库 |
| 表单处理 | React Hook Form | 7.x | 表单管理 |
| 数据校验 | Zod | 3.x | Schema校验 |

### 1.2 项目结构

```
frontend/
├── public/
│   ├── favicon.ico
│   └── logo.svg
├── src/
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── skills.ts
│   │   ├── prompts.ts
│   │   ├── enterprises.ts
│   │   └── upload.ts
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   ├── Card/
│   │   │   ├── Table/
│   │   │   ├── Pagination/
│   │   │   ├── SearchBar/
│   │   │   ├── Tag/
│   │   │   ├── Rating/
│   │   │   └── Loading/
│   │   ├── layout/
│   │   │   ├── Header/
│   │   │   ├── Sidebar/
│   │   │   ├── Footer/
│   │   │   └── Layout/
│   │   ├── skill/
│   │   │   ├── SkillCard/
│   │   │   ├── SkillDetail/
│   │   │   ├── SkillForm/
│   │   │   ├── SkillList/
│   │   │   └── SkillVersionHistory/
│   │   ├── prompt/
│   │   │   ├── PromptCard/
│   │   │   ├── PromptDetail/
│   │   │   ├── PromptForm/
│   │   │   ├── PromptList/
│   │   │   └── PromptEditor/
│   │   ├── enterprise/
│   │   │   ├── EnterpriseCard/
│   │   │   ├── EnterpriseMemberList/
│   │   │   └── EnterpriseSettings/
│   │   └── user/
│   │       ├── UserAvatar/
│   │       ├── UserProfile/
│   │       └── UserSettings/
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useSkills.ts
│   │   ├── usePrompts.ts
│   │   ├── useEnterprises.ts
│   │   ├── usePagination.ts
│   │   ├── useSearch.ts
│   │   └── useUpload.ts
│   ├── pages/
│   │   ├── Home/
│   │   ├── Market/
│   │   │   ├── PublicMarket/
│   │   │   └── EnterpriseMarket/
│   │   ├── Skill/
│   │   │   ├── SkillList/
│   │   │   ├── SkillDetail/
│   │   │   └── SkillCreate/
│   │   ├── Prompt/
│   │   │   ├── PromptList/
│   │   │   ├── PromptDetail/
│   │   │   └── PromptCreate/
│   │   ├── Enterprise/
│   │   │   ├── EnterpriseDashboard/
│   │   │   └── EnterpriseMembers/
│   │   ├── User/
│   │   │   ├── Login/
│   │   │   ├── Register/
│   │   │   ├── Profile/
│   │   │   └── Settings/
│   │   └── Admin/
│   │       ├── AdminDashboard/
│   │       ├── UserManagement/
│   │       └── ContentReview/
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── skillStore.ts
│   │   ├── promptStore.ts
│   │   ├── enterpriseStore.ts
│   │   └── uiStore.ts
│   ├── types/
│   │   ├── user.ts
│   │   ├── skill.ts
│   │   ├── prompt.ts
│   │   ├── enterprise.ts
│   │   ├── api.ts
│   │   └── common.ts
│   ├── utils/
│   │   ├── request.ts
│   │   ├── storage.ts
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── constants.ts
│   ├── styles/
│   │   ├── globals.css
│   │   └── variables.css
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.ts
```

---

## 2. 页面设计

### 2.1 页面路由规划

| 路径 | 页面 | 权限 | 说明 |
|------|------|------|------|
| `/` | 首页 | 公开 | 平台介绍和热门资源展示 |
| `/market` | 公开市场 | 公开 | 公开Skill和提示词浏览 |
| `/market/skills` | Skill市场 | 公开 | Skill列表浏览 |
| `/market/prompts` | 提示词市场 | 公开 | 提示词列表浏览 |
| `/skills/:id` | Skill详情 | 按资源权限 | Skill详细信息 |
| `/prompts/:id` | 提示词详情 | 按资源权限 | 提示词详细信息 |
| `/enterprise` | 企业市场 | 企业成员 | 企业内部市场 |
| `/enterprise/skills` | 企业Skill | 企业成员 | 企业Skill列表 |
| `/enterprise/prompts` | 企业提示词 | 企业成员 | 企业提示词列表 |
| `/create/skill` | 创建Skill | developer+ | Skill上传页面 |
| `/create/prompt` | 创建提示词 | developer+ | 提示词创建页面 |
| `/my/resources` | 我的资源 | 登录用户 | 个人资源管理 |
| `/login` | 登录 | 公开 | 用户登录 |
| `/register` | 注册 | 公开 | 用户注册 |
| `/forgot-password` | 忘记密码 | 公开 | 密码找回申请 |
| `/reset-password` | 重置密码 | 公开 | 密码重置页面 |
| `/verify-email` | 邮箱验证 | 公开 | 邮箱验证页面 |
| `/profile` | 个人中心 | 登录用户 | 个人资料管理 |
| `/settings` | 设置 | 登录用户 | 账户设置 |
| `/admin` | 管理后台 | admin | 管理员控制台 |
| `/admin/users` | 用户管理 | admin | 用户管理页面 |
| `/admin/content` | 内容审核 | admin | 内容审核页面 |
| `/admin/enterprises` | 企业管理 | admin | 企业管理页面 |
| `/admin/agents` | Agent管理 | admin | 智能体API管理页面 |

### 2.2 页面布局设计

#### 2.2.1 全局布局

```
+----------------------------------------------------------+
|                        Header                             |
|  [Logo] [导航菜单]              [搜索框] [用户菜单]        |
+----------------------------------------------------------+
|        |                                                  |
|        |                                                  |
| Side   |                   Main Content                  |
| bar    |                                                  |
|        |                                                  |
| (可选) |                                                  |
|        |                                                  |
+----------------------------------------------------------+
|                        Footer                             |
+----------------------------------------------------------+
```

#### 2.2.2 Header组件

```tsx
interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/logo.svg" alt="SkillHub" className="h-8 w-8" />
            <span className="text-xl font-bold text-gray-900">SkillHub</span>
          </Link>
          
          <nav className="hidden md:flex space-x-6">
            <NavLink to="/market">公开市场</NavLink>
            <NavLink to="/enterprise">企业市场</NavLink>
            <NavLink to="/my/resources">我的资源</NavLink>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <SearchBar placeholder="搜索Skill或提示词..." />
          
          {user ? (
            <UserMenu user={user} onLogout={onLogout} />
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" to="/login">登录</Button>
              <Button variant="primary" to="/register">注册</Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
```

---

## 3. 核心组件设计

### 3.1 认证页面组件

#### 3.1.1 ForgotPassword 忘记密码页面

用户提交邮箱以接收密码重置链接。

```tsx
interface ForgotPasswordPageProps {}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await authClient.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (error) {
      // 始终显示成功，防止邮箱枚举
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow">
          <div className="text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">邮件已发送</h2>
            <p className="text-gray-600 mb-6">
              如果该邮箱存在，我们已发送密码重置链接到您的邮箱。
            </p>
            <Button onClick={() => navigate('/login')}>返回登录</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">忘记密码</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              邮箱地址
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入注册邮箱"
              required
            />
          </div>
          
          <Button type="submit" className="w-full" loading={loading}>
            发送重置链接
          </Button>
        </form>
        
        <div className="mt-4 text-center text-sm">
          记起密码了? <Link to="/login" className="text-primary">立即登录</Link>
        </div>
      </div>
    </div>
  );
};
```

**功能说明：**
- 表单验证邮箱格式
- 提交后显示成功消息（无论邮箱是否存在，防止枚举攻击）
- 链接到登录页面

#### 3.1.2 ResetPassword 重置密码页面

用户通过邮件链接访问，输入新密码。

```tsx
interface ResetPasswordPageProps {}

const ResetPasswordPage: React.FC<ResetPasswordPageProps> = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    
    if (password.length < 8) {
      setError('密码长度至少8位');
      return;
    }

    setLoading(true);
    
    try {
      const { data } = await authClient.post('/auth/reset-password', {
        token,
        password,
      });
      
      // 自动登录
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError('密码重置失败，请重新尝试');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">重置密码</h1>
        
        {error && <Alert type="error" message={error} className="mb-4" />}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              新密码
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少8位"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
              确认密码
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入新密码"
              required
            />
          </div>
          
          <Button type="submit" className="w-full" loading={loading}>
            重置密码
          </Button>
        </form>
      </div>
    </div>
  );
};
```

**功能说明：**
- 验证token有效性
- 密码强度校验
- 确认密码一致性
- 重置成功后自动登录

#### 3.1.3 VerifyEmail 邮箱验证页面

用户通过邮件链接验证邮箱地址。

```tsx
interface VerifyEmailPageProps {}

const VerifyEmailPage: React.FC<VerifyEmailPageProps> = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('无效的验证链接');
        return;
      }

      try {
        const { data } = await authClient.post('/auth/verify-email', { token });
        setStatus('success');
        setMessage('邮箱验证成功');
        
        // 3秒后跳转
        setTimeout(() => {
          if (data.user) {
            navigate('/');
          } else {
            navigate('/login');
          }
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage('验证失败，请重新尝试或重新发送验证邮件');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow text-center">
        {status === 'loading' && (
          <>
            <LoadingSpinner className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-xl font-semibold">验证中...</h2>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">验证成功</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500">页面将自动跳转...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">验证失败</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/forgot-password')}>
                重新发送邮件
              </Button>
              <Button variant="secondary" onClick={() => navigate('/login')}>
                返回登录
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
```

**功能说明：**
- 自动验证token
- 显示加载/成功/失败状态
- 成功自动跳转，失败提供重试选项

### 3.2 通用组件

#### 3.2.1 Button组件

**设计原则**: 黑色主色调，通过图标增强可操作性，悬停/点击状态明显变化。

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  to?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  to,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black';
  
  const variantStyles = {
    primary: 'bg-black text-white hover:bg-gray-800 active:bg-gray-900 shadow-sm hover:shadow-md',
    secondary: 'bg-white text-black border-2 border-black hover:bg-gray-50 active:bg-gray-100',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-black',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2',
  };
  
  const classes = cn(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    'hover:scale-[1.02] active:scale-[0.98]',
    (disabled || loading) && 'cursor-not-allowed opacity-60 hover:scale-100',
    className
  );
  
  const content = (
    <>
      {loading && <LoadingSpinner size="sm" />}
      {icon && !loading && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </>
  );
  
  if (to) {
    return (
      <Link to={to} className={classes}>{content}</Link>
    );
  }
  
  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
};
```

**可操作组件存在感强化要点**:
1. **图标支持**: 所有按钮支持icon属性，关键操作按钮必须包含图标
2. **悬停效果**: scale-[1.02]微缩放 + 阴影增强
3. **点击反馈**: scale-[0.98]按下效果
4. **黑色边框**: secondary按钮使用2px黑色边框
5. **焦点环**: 黑色焦点环确保键盘导航可见

#### 3.2.2 Card组件

**设计原则**: 黑色边框强化存在感，悬停时边框变黑，增强交互反馈。

```tsx
interface CardProps {
  title?: string;
  subtitle?: string;
  image?: string;
  tags?: string[];
  stats?: { label: string; value: string | number }[];
  actions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  image,
  tags,
  stats,
  actions,
  onClick,
  className,
  children,
  hoverable = true,
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border-2 overflow-hidden transition-all duration-200',
        hoverable 
          ? 'border-gray-200 hover:border-black hover:shadow-lg cursor-pointer' 
          : 'border-gray-200',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {image && (
        <div className="aspect-video bg-gray-100 relative">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      
      <div className="p-4">
        {title && (
          <h3 className="text-lg font-bold text-black mb-1">{title}</h3>
        )}
        
        {subtitle && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{subtitle}</p>
        )}
        
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag) => (
              <Tag key={tag} label={tag} />
            ))}
          </div>
        )}
        
        {stats && stats.length > 0 && (
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
            {stats.map(({ label, value }) => (
              <span key={label} className="flex items-center gap-1">
                <span className="font-bold text-black">{value}</span> {label}
              </span>
            ))}
          </div>
        )}
        
        {children}
        
        {actions && (
          <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t-2 border-gray-200">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
```

**可操作组件存在感强化要点**:
1. **边框强化**: 使用2px边框，悬停时变为黑色
2. **阴影效果**: 悬停时增强阴影
3. **标题加粗**: font-bold增强视觉层次
4. **分隔线强化**: 使用2px分隔线

#### 3.2.3 Rating组件

```tsx
interface RatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (value: number) => void;
  showValue?: boolean;
  count?: number;
}

const Rating: React.FC<RatingProps> = ({
  value,
  max = 5,
  size = 'md',
  interactive = false,
  onChange,
  showValue = false,
  count,
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };
  
  const displayValue = hoverValue ?? value;
  
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: max }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= displayValue;
          const isHalf = !isFilled && starValue - 0.5 <= displayValue;
          
          return (
            <button
              key={index}
              type="button"
              className={cn(
                sizeStyles[size],
                interactive ? 'cursor-pointer' : 'cursor-default',
                'focus:outline-none transition-colors'
              )}
              disabled={!interactive}
              onClick={() => interactive && onChange?.(starValue)}
              onMouseEnter={() => interactive && setHoverValue(starValue)}
              onMouseLeave={() => interactive && setHoverValue(null)}
            >
              <StarIcon
                className={cn(
                  'w-full h-full',
                  isFilled ? 'text-yellow-400 fill-current' : 'text-gray-300'
                )}
              />
            </button>
          );
        })}
      </div>
      
      {showValue && (
        <span className="text-sm text-gray-600 ml-1">
          {value.toFixed(1)}
        </span>
      )}
      
      {count !== undefined && (
        <span className="text-sm text-gray-500 ml-1">
          ({count})
        </span>
      )}
    </div>
  );
};
```

#### 3.2.4 ViewToggle 视图切换组件

**设计原则**: 黑色主色调，图标增强可识别性，悬停状态明显。

支持卡片视图和列表视图的切换，用于Skill和Prompt列表页面。

```tsx
type ViewMode = 'grid' | 'list';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  options?: {
    grid?: { label: string; icon: React.ReactNode };
    list?: { label: string; icon: React.ReactNode };
  };
}

const ViewToggle: React.FC<ViewToggleProps> = ({
  value,
  onChange,
  options = {
    grid: { label: '网格', icon: <GridIcon /> },
    list: { label: '列表', icon: <ListIcon /> },
  },
}) => {
  return (
    <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={cn(
          'flex items-center justify-center p-2.5 transition-all duration-200',
          value === 'grid'
            ? 'bg-black text-white'
            : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-black'
        )}
        title={options.grid?.label}
      >
        {options.grid?.icon || <GridIcon />}
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        className={cn(
          'flex items-center justify-center p-2.5 transition-all duration-200',
          value === 'list'
            ? 'bg-black text-white'
            : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-black'
        )}
        title={options.list?.label}
      >
        {options.list?.icon || <ListIcon />}
      </button>
    </div>
  );
};
```

**可操作组件存在感强化要点**:
1. **边框强化**: 使用2px边框
2. **选中状态**: 黑色背景明确指示当前选择
3. **悬停反馈**: 背景变化 + 文字变黑
4. **图标支持**: 必须包含图标增强识别性

#### 3.2.5 SkillList 列表组件

**设计原则**: 黑色边框强化存在感，图标增强操作识别性。

支持卡片/列表两种视图模式的Skill列表组件。

```tsx
interface SkillListProps {
  skills: Skill[];
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  onDownload?: (skill: Skill) => void;
  onRate?: (skill: Skill, score: number) => void;
}

const SkillList: React.FC<SkillListProps> = ({
  skills,
  viewMode = 'grid',
  onViewModeChange,
  onDownload,
  onRate,
}) => {
  const navigate = useNavigate();
  
  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {skills.map((skill) => (
        <SkillCard
          key={skill._id}
          skill={skill}
          onDownload={() => onDownload?.(skill)}
          onRate={(score) => onRate?.(skill, score)}
        />
      ))}
    </div>
  );
  
  const renderListView = () => (
    <div className="space-y-2">
      {skills.map((skill) => (
        <div
          key={skill._id}
          className="flex items-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-black hover:shadow-md transition-all duration-200 cursor-pointer"
          onClick={() => navigate(`/skills/${skill._id}`)}
        >
          <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
            <SkillIcon className="w-8 h-8 text-gray-600" />
          </div>
          <div className="flex-1 ml-4 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-black truncate">
                {skill.name}
              </h3>
              <span className="text-xs text-gray-400 ml-2">v{skill.version}</span>
            </div>
            <p className="text-sm text-gray-500 truncate mt-1">
              {skill.description}
            </p>
            <div className="flex items-center mt-2 space-x-4">
              <Rating
                value={skill.stats.avgRating}
                size="sm"
                showValue
                count={skill.stats.ratingCount}
              />
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <DownloadIcon className="w-3 h-3" />
                {skill.stats.downloadCount}
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <PlayIcon className="w-3 h-3" />
                {skill.stats.usageCount}
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 ml-4">
            <Button
              variant="primary"
              size="sm"
              icon={<DownloadIcon className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                onDownload?.(skill);
              }}
            >
              下载
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
  
  return (
    <div>
      {onViewModeChange && (
        <div className="flex justify-end mb-4">
          <ViewToggle value={viewMode} onChange={onViewModeChange} />
        </div>
      )}
      {viewMode === 'grid' ? renderGridView() : renderListView()}
    </div>
  );
};
```

**可操作组件存在感强化要点**:
1. **边框强化**: 列表项使用2px边框，悬停变黑
2. **图标增强**: 下载/使用数量前添加图标
3. **按钮图标**: 下载按钮包含下载图标
4. **悬停效果**: 边框变黑 + 阴影增强

### 3.3 Skill相关组件

#### 3.3.1 SkillCard组件

**设计原则**: 黑色边框，图标增强操作识别性，悬停状态明显。

```tsx
interface SkillCardProps {
  skill: Skill;
  onDownload?: () => void;
  onRate?: (score: number) => void;
}

const SkillCard: React.FC<SkillCardProps> = ({ skill, onDownload, onRate }) => {
  const navigate = useNavigate();
  
  return (
    <Card
      title={skill.name}
      subtitle={skill.description}
      tags={skill.tags}
      stats={[
        { label: '下载', value: skill.stats.downloadCount },
        { label: '使用', value: skill.stats.usageCount },
      ]}
      onClick={() => navigate(`/skills/${skill._id}`)}
      actions={
        <>
          <Button 
            variant="ghost" 
            size="sm"
            icon={<EyeIcon className="w-4 h-4" />}
          >
            详情
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<DownloadIcon className="w-4 h-4" />}
            onClick={(e) => {
              e.stopPropagation();
              onDownload?.();
            }}
          >
            下载
          </Button>
        </>
      }
    >
      <div className="flex items-center justify-between">
        <Rating
          value={skill.stats.avgRating}
          count={skill.stats.ratingCount}
          showValue
        />
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <TagIcon className="w-3 h-3" />
          v{skill.version}
        </span>
      </div>
    </Card>
  );
};
```

**可操作组件存在感强化要点**:
1. **按钮图标**: 详情和下载按钮都包含图标
2. **版本标签图标**: 版本号前添加标签图标
3. **黑色主题**: 继承Card组件的黑色边框设计

#### 3.3.2 SkillForm组件

```tsx
interface SkillFormProps {
  initialData?: Skill;
  onSubmit: (data: SkillFormData) => Promise<void>;
  isEdit?: boolean;
}

interface SkillFormData {
  name: string;
  description: string;
  version: string;
  category: string;
  tags: string[];
  marketType: 'public' | 'enterprise';
  permissions: {
    type: 'public' | 'private' | 'enterprise' | 'shared';
    sharedWith?: string[];
  };
  file?: File;
}

const SkillForm: React.FC<SkillFormProps> = ({ initialData, onSubmit, isEdit = false }) => {
  const { user } = useAuthStore();
  const { uploadFile, uploading, progress } = useUpload();
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SkillFormData>({
    resolver: zodResolver(skillFormSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      description: initialData.description,
      version: initialData.version,
      category: initialData.category,
      tags: initialData.tags,
      marketType: initialData.marketType,
      permissions: initialData.permissions,
    } : {
      marketType: 'public',
      permissions: { type: 'public' },
    },
  });
  
  const marketType = watch('marketType');
  const permissionType = watch('permissions.type');
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const result = await uploadFile(file);
      setValue('file', file);
    } catch (error) {
      toast.error('文件上传失败');
    }
  };
  
  const onFormSubmit = async (data: SkillFormData) => {
    try {
      await onSubmit(data);
      toast.success(isEdit ? 'Skill更新成功' : 'Skill创建成功');
    } catch (error) {
      toast.error(isEdit ? 'Skill更新失败' : 'Skill创建失败');
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Input
        label="Skill名称"
        placeholder="输入Skill名称"
        error={errors.name?.message}
        {...register('name')}
      />
      
      <Textarea
        label="描述"
        placeholder="详细描述Skill的功能和用途"
        rows={4}
        error={errors.description?.message}
        {...register('description')}
      />
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="版本号"
          placeholder="例如: 1.0.0"
          error={errors.version?.message}
          {...register('version')}
        />
        
        <Select
          label="分类"
          options={skillCategories}
          error={errors.category?.message}
          {...register('category')}
        />
      </div>
      
      <TagInput
        label="标签"
        placeholder="输入标签后按回车添加"
        value={watch('tags') || []}
        onChange={(tags) => setValue('tags', tags)}
      />
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">市场设置</h3>
        
        <RadioGroup
          label="市场类型"
          options={[
            { value: 'public', label: '公开市场', description: '所有人可见' },
            { value: 'enterprise', label: '企业市场', description: '仅企业成员可见' },
          ]}
          value={marketType}
          onChange={(value) => setValue('marketType', value)}
        />
        
        {marketType === 'public' && (
          <RadioGroup
            label="访问权限"
            options={[
              { value: 'public', label: '公开', description: '所有人可访问' },
              { value: 'private', label: '私有', description: '仅自己可见' },
              { value: 'shared', label: '共享', description: '指定用户可见' },
            ]}
            value={permissionType}
            onChange={(value) => setValue('permissions.type', value)}
          />
        )}
        
        {permissionType === 'shared' && (
          <UserSelect
            label="共享用户"
            placeholder="选择要共享的用户"
            value={watch('permissions.sharedWith') || []}
            onChange={(users) => setValue('permissions.sharedWith', users)}
          />
        )}
      </div>
      
      {!isEdit && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Skill文件
          </label>
          <FileUpload
            accept=".js,.ts,.zip"
            maxSize={50 * 1024 * 1024}
            onChange={handleFileChange}
            uploading={uploading}
            progress={progress}
          />
          {errors.file && (
            <p className="text-sm text-red-500">{errors.file.message}</p>
          )}
        </div>
      )}
      
      <div className="flex justify-end gap-4">
        <Button type="button" variant="ghost">
          取消
        </Button>
        <Button type="submit" variant="primary" loading={isSubmitting}>
          {isEdit ? '更新' : '创建'}
        </Button>
      </div>
    </form>
  );
};
```

### 3.4 Prompt相关组件

#### 3.4.1 PromptEditor组件

```tsx
interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  showLineNumbers?: boolean;
}

const PromptEditor: React.FC<PromptEditorProps> = ({
  value,
  onChange,
  placeholder = '在此输入提示词内容...',
  maxLength = 50000,
  showLineNumbers = true,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lineCount, setLineCount] = useState(1);
  
  useEffect(() => {
    if (textareaRef.current) {
      setLineCount(value.split('\n').length);
    }
  }, [value]);
  
  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
        <span className="text-sm text-gray-600">提示词编辑器</span>
        <span className="text-sm text-gray-500">
          {value.length} / {maxLength} 字符
        </span>
      </div>
      
      <div className="flex">
        {showLineNumbers && (
          <div className="bg-gray-50 text-gray-400 text-right py-3 px-2 select-none border-r border-gray-200 font-mono text-sm">
            {Array.from({ length: lineCount }).map((_, i) => (
              <div key={i} className="leading-6">{i + 1}</div>
            ))}
          </div>
        )}
        
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="flex-1 p-3 font-mono text-sm leading-6 resize-none focus:outline-none min-h-[300px]"
          spellCheck={false}
        />
      </div>
    </div>
  );
};
```

#### 3.4.2 PromptList 列表组件

支持卡片/列表两种视图模式的Prompt列表组件。

```tsx
interface PromptListProps {
  prompts: Prompt[];
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  onCopy?: (prompt: Prompt) => void;
  onFavorite?: (prompt: Prompt) => void;
}

const PromptList: React.FC<PromptListProps> = ({
  prompts,
  viewMode = 'grid',
  onViewModeChange,
  onCopy,
  onFavorite,
}) => {
  const navigate = useNavigate();
  
  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {prompts.map((prompt) => (
        <PromptCard
          key={prompt._id}
          prompt={prompt}
          onCopy={() => onCopy?.(prompt)}
          onFavorite={() => onFavorite?.(prompt)}
        />
      ))}
    </div>
  );
  
  const renderListView = () => (
    <div className="space-y-2">
      {prompts.map((prompt) => (
        <div
          key={prompt._id}
          className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate(`/prompts/${prompt._id}`)}
        >
          <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
            <PromptIcon className="w-8 h-8 text-gray-400" />
          </div>
          <div className="flex-1 ml-4 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-900 truncate">
                {prompt.name}
              </h3>
              <span className="text-xs text-gray-400 ml-2">{prompt.category}</span>
            </div>
            <p className="text-sm text-gray-500 truncate mt-1">
              {prompt.content.substring(0, 100)}...
            </p>
            <div className="flex items-center mt-2 space-x-4">
              <Rating
                value={prompt.stats.avgRating}
                size="sm"
                showValue
                count={prompt.stats.ratingCount}
              />
              <span className="text-xs text-gray-400">
                {prompt.stats.usageCount} 使用
              </span>
              {prompt.tags?.slice(0, 2).map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex-shrink-0 ml-4 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCopy?.(prompt);
              }}
            >
              复制
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onFavorite?.(prompt);
              }}
            >
              收藏
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
  
  return (
    <div>
      {onViewModeChange && (
        <div className="flex justify-end mb-4">
          <ViewToggle value={viewMode} onChange={onViewModeChange} />
        </div>
      )}
      {viewMode === 'grid' ? renderGridView() : renderListView()}
    </div>
  );
};
```

#### 3.4.3 PromptForm组件

```tsx
interface PromptFormProps {
  initialData?: Prompt;
  onSubmit: (data: PromptFormData) => Promise<void>;
  isEdit?: boolean;
}

interface PromptFormData {
  name: string;
  content: string;
  category: string;
  tags: string[];
  marketType: 'public' | 'enterprise';
  permissions: {
    type: 'public' | 'private' | 'enterprise' | 'shared';
    sharedWith?: string[];
  };
}

const PromptForm: React.FC<PromptFormProps> = ({ initialData, onSubmit, isEdit = false }) => {
  const [securityIssues, setSecurityIssues] = useState<string[]>([]);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PromptFormData>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: initialData || {
      marketType: 'public',
      permissions: { type: 'public' },
    },
  });
  
  const content = watch('content');
  
  const checkSecurity = useCallback(debounce(async (content: string) => {
    if (!content) {
      setSecurityIssues([]);
      return;
    }
    
    try {
      const result = await api.prompts.checkSecurity(content);
      setSecurityIssues(result.issues);
    } catch (error) {
      console.error('Security check failed:', error);
    }
  }, 500), []);
  
  useEffect(() => {
    checkSecurity(content);
  }, [content, checkSecurity]);
  
  const onFormSubmit = async (data: PromptFormData) => {
    if (securityIssues.length > 0) {
      toast.error('请先修复安全问题');
      return;
    }
    
    try {
      await onSubmit(data);
      toast.success(isEdit ? '提示词更新成功' : '提示词创建成功');
    } catch (error) {
      toast.error(isEdit ? '提示词更新失败' : '提示词创建失败');
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Input
        label="提示词名称"
        placeholder="输入提示词名称"
        error={errors.name?.message}
        {...register('name')}
      />
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          提示词内容
        </label>
        <PromptEditor
          value={content || ''}
          onChange={(value) => setValue('content', value)}
        />
        {errors.content && (
          <p className="text-sm text-red-500">{errors.content.message}</p>
        )}
      </div>
      
      {securityIssues.length > 0 && (
        <Alert variant="warning" title="检测到安全问题">
          <ul className="list-disc list-inside text-sm">
            {securityIssues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </Alert>
      )}
      
      <Select
        label="分类"
        options={promptCategories}
        error={errors.category?.message}
        {...register('category')}
      />
      
      <TagInput
        label="标签"
        placeholder="输入标签后按回车添加"
        value={watch('tags') || []}
        onChange={(tags) => setValue('tags', tags)}
      />
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">市场设置</h3>
        
        <RadioGroup
          label="市场类型"
          options={[
            { value: 'public', label: '公开市场', description: '所有人可见' },
            { value: 'enterprise', label: '企业市场', description: '仅企业成员可见' },
          ]}
          value={watch('marketType')}
          onChange={(value) => setValue('marketType', value)}
        />
      </div>
      
      <div className="flex justify-end gap-4">
        <Button type="button" variant="ghost">
          取消
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          disabled={securityIssues.length > 0}
        >
          {isEdit ? '更新' : '创建'}
        </Button>
      </div>
    </form>
  );
};
```

### 3.5 Agent管理组件

#### 3.5.1 AgentList Agent列表组件

管理员查看和管理所有Agent的组件。

```tsx
interface AgentListProps {
  onEdit?: (agent: Agent) => void;
  onDelete?: (agent: Agent) => void;
  onToggleStatus?: (agent: Agent) => void;
}

const AgentList: React.FC<AgentListProps> = ({
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const { data: agents, loading, refetch } = useAgents();
  
  const columns = [
    { key: 'name', title: '名称', width: '15%' },
    { key: 'enterprise', title: '所属企业', width: '15%' },
    { key: 'permissions', title: '权限', width: '25%' },
    { key: 'status', title: '状态', width: '10%' },
    { key: 'lastAccess', title: '最后访问', width: '15%' },
    { key: 'actions', title: '操作', width: '20%' },
  ];
  
  const getPermissionLabels = (permissions: Agent['permissions']) => {
    const labels = [];
    if (permissions.canReadPublic) labels.push('读取公开');
    if (permissions.canReadEnterprise) labels.push('读取企业');
    if (permissions.canDownload) labels.push('下载');
    if (permissions.canUpload) labels.push('上传');
    return labels.join('、') || '无';
  };
  
  return (
    <Table columns={columns} data={agents} loading={loading}>
      {(agent) => (
        <>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                <BotIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                <div className="text-sm text-gray-500">{agent.agentId}</div>
              </div>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className="text-sm text-gray-900">
              {agent.enterpriseId ? '已绑定企业' : '公共'}
            </span>
          </td>
          <td className="px-6 py-4">
            <div className="flex flex-wrap gap-1">
              {agent.permissions.canReadPublic && (
                <Badge variant="success">公开</Badge>
              )}
              {agent.permissions.canReadEnterprise && (
                <Badge variant="info">企业</Badge>
              )}
              {agent.permissions.canDownload && (
                <Badge variant="warning">下载</Badge>
              )}
              {agent.permissions.canUpload && (
                <Badge variant="primary">上传</Badge>
              )}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <Badge 
              variant={agent.status === 'active' ? 'success' : 'secondary'}
            >
              {agent.status === 'active' ? '启用' : '禁用'}
            </Badge>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {agent.lastAccessAt 
              ? new Date(agent.lastAccessAt).toLocaleString() 
              : '从未访问'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onEdit?.(agent)}
            >
              编辑
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onToggleStatus?.(agent)}
            >
              {agent.status === 'active' ? '禁用' : '启用'}
            </Button>
            <Button 
              variant="danger" 
              size="sm"
              onClick={() => onDelete?.(agent)}
            >
              删除
            </Button>
          </td>
        </>
      )}
    </Table>
  );
};
```

#### 3.5.2 AgentForm Agent创建/编辑表单

```tsx
interface AgentFormProps {
  initialData?: Agent;
  onSubmit: (data: AgentFormData) => Promise<void>;
  onCancel: () => void;
}

interface AgentFormData {
  name: string;
  description: string;
  enterpriseId?: string;
  permissions: {
    canReadPublic: boolean;
    canReadEnterprise: boolean;
    canDownload: boolean;
    canUpload: boolean;
  };
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

const AgentForm: React.FC<AgentFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const { data: enterprises } = useEnterprises();
  const [formData, setFormData] = useState<AgentFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    enterpriseId: initialData?.enterpriseId,
    permissions: initialData?.permissions || {
      canReadPublic: true,
      canReadEnterprise: false,
      canDownload: true,
      canUpload: false,
    },
    rateLimit: initialData?.rateLimit || {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
    },
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Agent名称
        </label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="请输入Agent名称"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          描述
        </label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="请输入Agent用途描述"
          rows={3}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          所属企业
        </label>
        <Select
          value={formData.enterpriseId || ''}
          onChange={(e) => setFormData({ 
            ...formData, 
            enterpriseId: e.target.value || undefined 
          })}
          options={[
            { value: '', label: '公共(无企业)' },
            ...(enterprises?.map((ent) => ({ 
              value: ent._id, 
              label: ent.name 
            })) || []),
          ]}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          权限配置
        </label>
        <div className="space-y-2 border border-gray-200 rounded-lg p-4">
          <Checkbox
            label="读取公开资源"
            checked={formData.permissions.canReadPublic}
            onChange={(e) => setFormData({
              ...formData,
              permissions: { ...formData.permissions, canReadPublic: e.target.checked }
            })}
          />
          <Checkbox
            label="读取企业资源"
            checked={formData.permissions.canReadEnterprise}
            onChange={(e) => setFormData({
              ...formData,
              permissions: { ...formData.permissions, canReadEnterprise: e.target.checked }
            })}
          />
          <Checkbox
            label="下载资源"
            checked={formData.permissions.canDownload}
            onChange={(e) => setFormData({
              ...formData,
              permissions: { ...formData.permissions, canDownload: e.target.checked }
            })}
          />
          <Checkbox
            label="上传资源"
            checked={formData.permissions.canUpload}
            onChange={(e) => setFormData({
              ...formData,
              permissions: { ...formData.permissions, canUpload: e.target.checked }
            })}
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          速率限制
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              每分钟请求数
            </label>
            <Input
              type="number"
              value={formData.rateLimit.requestsPerMinute}
              onChange={(e) => setFormData({
                ...formData,
                rateLimit: { 
                  ...formData.rateLimit, 
                  requestsPerMinute: parseInt(e.target.value) 
                }
              })}
              min={1}
              max={1000}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              每小时请求数
            </label>
            <Input
              type="number"
              value={formData.rateLimit.requestsPerHour}
              onChange={(e) => setFormData({
                ...formData,
                rateLimit: { 
                  ...formData.rateLimit, 
                  requestsPerHour: parseInt(e.target.value) 
                }
              })}
              min={1}
              max={10000}
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="secondary" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit">
          {initialData ? '保存' : '创建'}
        </Button>
      </div>
    </form>
  );
};
```

#### 3.5.3 AgentTokenDisplay Token展示组件

创建Agent后展示API Token的组件。

```tsx
interface AgentTokenDisplayProps {
  agentId: string;
  agentToken: string;
  onRegenerate?: () => void;
}

const AgentTokenDisplay: React.FC<AgentTokenDisplayProps> = ({
  agentId,
  agentToken,
  onRegenerate,
}) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(agentToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start">
        <AlertTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-yellow-800">
            Agent创建成功
          </h4>
          <p className="text-sm text-yellow-700 mt-1">
            请妥善保管以下Token，刷新页面后将不再显示
          </p>
          
          <div className="mt-3 space-y-2">
            <div>
              <span className="text-xs text-yellow-600">Agent ID:</span>
              <code className="ml-2 bg-white px-2 py-1 rounded border text-sm">
                {agentId}
              </code>
            </div>
            <div>
              <span className="text-xs text-yellow-600">Agent Token:</span>
              <code className="ml-2 bg-white px-2 py-1 rounded border text-sm font-mono">
                {agentToken}
              </code>
            </div>
          </div>
          
          <div className="mt-3 flex gap-2">
            <Button 
              size="sm" 
              variant="secondary"
              onClick={handleCopy}
            >
              {copied ? '已复制' : '复制Token'}
            </Button>
            {onRegenerate && (
              <Button 
                size="sm" 
                variant="ghost"
                onClick={onRegenerate}
              >
                重新生成
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## 4. 状态管理设计

### 4.1 认证状态 (authStore)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'enterprise_admin' | 'developer' | 'user';
  enterpriseId?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (user, token) => set({
        user,
        token,
        isAuthenticated: true,
      }),
      
      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
      }),
      
      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null,
      })),
      
      setToken: (token) => set({ token }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);
```

### 4.2 UI状态 (uiStore)

```typescript
interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  loading: boolean;
  
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  theme: 'light',
  loading: false,
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
  setLoading: (loading) => set({ loading }),
}));
```

---

## 5. API请求封装

### 5.1 Axios客户端配置

```typescript
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const client: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
```

### 5.2 API模块封装

```typescript
import client from './client';
import { Skill, Prompt, User, PaginatedResponse } from '@/types';

export const authApi = {
  login: (data: { account: string; password: string }) =>
    client.post<{ token: string; user: User }>('/auth/login', data),
  
  register: (data: { username: string; email: string; password: string }) =>
    client.post<{ token: string; user: User }>('/auth/register', data),
  
  logout: () => client.post('/auth/logout'),
  
  refresh: () => client.post<{ token: string }>('/auth/refresh'),
};

export const skillsApi = {
  list: (params?: {
    market?: string;
    category?: string;
    tags?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => client.get<PaginatedResponse<Skill>>('/skills', { params }),
  
  get: (id: string) => client.get<Skill>(`/skills/${id}`),
  
  create: (data: FormData) =>
    client.post<Skill>('/skills', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  update: (id: string, data: Partial<Skill>) =>
    client.put<Skill>(`/skills/${id}`, data),
  
  delete: (id: string) => client.delete(`/skills/${id}`),
  
  download: (id: string) =>
    client.get(`/skills/${id}/download`, { responseType: 'blob' }),
  
  rate: (id: string, data: { score: number; comment?: string }) =>
    client.post(`/skills/${id}/ratings`, data),
};

export const promptsApi = {
  list: (params?: {
    market?: string;
    category?: string;
    tags?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => client.get<PaginatedResponse<Prompt>>('/prompts', { params }),
  
  get: (id: string) => client.get<Prompt>(`/prompts/${id}`),
  
  create: (data: Partial<Prompt>) => client.post<Prompt>('/prompts', data),
  
  update: (id: string, data: Partial<Prompt>) =>
    client.put<Prompt>(`/prompts/${id}`, data),
  
  delete: (id: string) => client.delete(`/prompts/${id}`),
  
  rate: (id: string, data: { score: number; comment?: string }) =>
    client.post(`/prompts/${id}/ratings`, data),
  
  checkSecurity: (content: string) =>
    client.post<{ issues: string[] }>('/prompts/security-check', { content }),
};

export const agentApi = {
  list: (params?: {
    enterpriseId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => client.get<PaginatedResponse<Agent>>('/agents', { params }),
  
  get: (id: string) => client.get<Agent>(`/agents/${id}`),
  
  create: (data: {
    name: string;
    description?: string;
    enterpriseId?: string;
    permissions: {
      canReadPublic: boolean;
      canReadEnterprise: boolean;
      canDownload: boolean;
      canUpload: boolean;
    };
    rateLimit: {
      requestsPerMinute: number;
      requestsPerHour: number;
    };
  }) => client.post<{ agent: Agent; agentToken: string }>('/agents', data),
  
  update: (id: string, data: Partial<Agent>) =>
    client.put<Agent>(`/agents/${id}`, data),
  
  delete: (id: string) => client.delete(`/agents/${id}`),
  
  toggleStatus: (id: string) =>
    client.post<Agent>(`/agents/${id}/toggle-status`),
  
  regenerateToken: (id: string) =>
    client.post<{ agentId: string; agentToken: string }>(`/agents/${id}/regenerate-token`),
};

export const uploadApi = {
  uploadFile: (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return client.post<{ url: string; filename: string }>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      },
    });
  },
};
```

---

## 6. 路由权限控制

### 6.1 路由配置

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requiredRole?: string[];
}> = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user && !requiredRole.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const EnterpriseRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!user?.enterpriseId && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/market" element={<PublicMarket />} />
        <Route path="/market/skills" element={<SkillList market="public" />} />
        <Route path="/market/prompts" element={<PromptList market="public" />} />
        <Route path="/skills/:id" element={<SkillDetail />} />
        <Route path="/prompts/:id" element={<PromptDetail />} />
        
        <Route
          path="/enterprise"
          element={
            <EnterpriseRoute>
              <EnterpriseMarket />
            </EnterpriseRoute>
          }
        />
        <Route
          path="/enterprise/skills"
          element={
            <EnterpriseRoute>
              <SkillList market="enterprise" />
            </EnterpriseRoute>
          }
        />
        <Route
          path="/enterprise/prompts"
          element={
            <EnterpriseRoute>
              <PromptList market="enterprise" />
            </EnterpriseRoute>
          }
        />
        
        <Route
          path="/create/skill"
          element={
            <ProtectedRoute requiredRole={['admin', 'enterprise_admin', 'developer']}>
              <SkillCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create/prompt"
          element={
            <ProtectedRoute requiredRole={['admin', 'enterprise_admin', 'developer']}>
              <PromptCreate />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/my/resources"
          element={
            <ProtectedRoute>
              <MyResources />
            </ProtectedRoute>
          }
        />
        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRole={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/content"
          element={
            <ProtectedRoute requiredRole={['admin']}>
              <ContentReview />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};
```

---

## 7. 错误处理与性能优化

### 7.1 错误边界

React应用中用于捕获子组件树中的JavaScript错误，防止整个应用崩溃。

```tsx
import React, { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 上报错误到监控系统
    this.reportError(error, errorInfo);
    
    // 调用自定义错误回调
    this.props.onError?.(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo): void => {
    // 可以发送到Sentry、LogRocket等监控系统
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    console.error('[Error Reporter]', errorData);
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <div className="text-red-500 text-6xl mb-4">!</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              页面出错了
            </h1>
            <p className="text-gray-600 mb-6">
              抱歉，页面发生了意外错误，请刷新页面重试
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 使用示例
const App: React.FC = () => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // 自定义错误处理
        console.error('App Error:', error, errorInfo);
      }}
    >
      <BrowserRouter>
        <Routes>
          {/* 路由配置 */}
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};
```

### 7.2 API错误处理

```tsx
// hooks/useApiError.ts
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface ApiError {
  code: number;
  message: string;
  details?: Record<string, any>;
}

export const useApiError = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleApiError = useCallback((error: ApiError) => {
    switch (error.code) {
      case 1001: // UNAUTHORIZED
      case 1002: // TOKEN_EXPIRED
      case 1003: // TOKEN_INVALID
        logout();
        navigate('/login');
        return true;
        
      case 2001: // FORBIDDEN
      case 2002: // INSUFFICIENT_PERMISSIONS
        navigate('/403');
        return true;
        
      case 3001: // RESOURCE_NOT_FOUND
        navigate('/404');
        return true;
        
      default:
        return false;
    }
  }, [navigate, logout]);

  return { handleApiError };
};

// API客户端错误处理
import client from './client';

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { code, message } = error.response.data.error || {};
      
      // 业务错误处理
      if (code) {
        console.error(`API Error [${code}]:`, message);
      }
    }
    
    return Promise.reject(error);
  }
);
```

### 7.3 性能优化策略

#### 7.3.1 路由懒加载

```tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 懒加载页面组件
const HomePage = lazy(() => import('@/pages/Home'));
const SkillListPage = lazy(() => import('@/pages/Skill/SkillList'));
const SkillDetailPage = lazy(() => import('@/pages/Skill/SkillDetail'));
const SkillCreatePage = lazy(() => import('@/pages/Skill/SkillCreate'));
const PromptListPage = lazy(() => import('@/pages/Prompt/PromptList'));
const PromptDetailPage = lazy(() => import('@/pages/Prompt/PromptDetail'));
const PromptCreatePage = lazy(() => import('@/pages/Prompt/PromptCreate'));
const ProfilePage = lazy(() => import('@/pages/User/Profile'));
const AdminPage = lazy(() => import('@/pages/Admin'));

// 加载骨架屏
const PageSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  </div>
);

// 应用入口
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/market/skills" element={<SkillListPage />} />
            <Route path="/skills/:id" element={<SkillDetailPage />} />
            <Route path="/create/skill" element={<SkillCreatePage />} />
            <Route path="/market/prompts" element={<PromptListPage />} />
            <Route path="/prompts/:id" element={<PromptDetailPage />} />
            <Route path="/create/prompt" element={<PromptCreatePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
};
```

#### 7.3.2 虚拟列表

当列表数据量大时，使用虚拟列表只渲染可见区域的DOM元素。

```tsx
// components/virtualList/VirtualList.tsx
import React, { useCallback } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
}

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 3,
}: VirtualListProps<T>): React.ReactElement {
  const Row = useCallback(
    ({ index, style }: ListChildComponentProps) => (
      <div style={style} className="px-4">
        {renderItem(items[index], index)}
      </div>
    ),
    [items, renderItem]
  );

  return (
    <AutoSizer>
      {({ width }) => (
        <List
          height={height}
          width={width}
          itemCount={items.length}
          itemSize={itemHeight}
          overscanCount={overscan}
        >
          {Row}
        </List>
      )}
    </AutoSizer>
  );
}

// 使用示例
const SkillList: React.FC<{ skills: Skill[] }> = ({ skills }) => {
  return (
    <div className="h-[600px]">
      <VirtualList
        items={skills}
        height={600}
        itemHeight={200}
        renderItem={(skill) => <SkillCard skill={skill} />}
      />
    </div>
  );
};
```

#### 7.3.3 图片懒加载

```tsx
// components/lazyImage/LazyImage.tsx
import React, { useState, useRef, useEffect } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  placeholder?: string;
  threshold?: number;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg==',
  threshold = 0.1,
  alt,
  className,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <img
      ref={imgRef}
      src={isInView ? src : placeholder}
      alt={alt}
      className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      onLoad={handleLoad}
      {...props}
    />
  );
};
```

#### 7.3.4 数据缓存策略

```tsx
// hooks/useResource.ts
import { useState, useEffect, useCallback } from 'react';
import { skillsApi } from '@/api/skills';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

const cache = new Map<string, CacheEntry<any>>();

const isExpired = (entry: CacheEntry<any>): boolean => {
  return Date.now() - entry.timestamp > entry.expiresIn;
};

export const useResource = <T>(
  fetchFn: () => Promise<T>,
  key: string,
  options: {
    cacheTime?: number;
    autoFetch?: boolean;
  } = {}
) => {
  const { cacheTime = 5 * 60 * 1000, autoFetch = true } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    // 检查缓存
    const cached = cache.get(key);
    if (cached && !isExpired(cached)) {
      setData(cached.data);
      return cached.data;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchFn();
      
      // 更新缓存
      cache.set(key, {
        data: result,
        timestamp: Date.now(),
        expiresIn: cacheTime,
      });
      
      setData(result);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFn, key, cacheTime]);

  const clearCache = useCallback(() => {
    cache.delete(key);
    setData(null);
  }, [key]);

  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
  }, [autoFetch, fetch]);

  return { data, loading, error, refetch: fetch, clearCache };
};

// 使用示例
const SkillList: React.FC = () => {
  const { data: skills, loading, error, refetch } = useResource(
    () => skillsApi.list({ market: 'public' }),
    'skills:public',
    { cacheTime: 5 * 60 * 1000 }
  );

  if (loading) return <SkillListSkeleton />;
  if (error) return <ErrorDisplay error={error} onRetry={refetch} />;

  return (
    <div className="grid grid-cols-3 gap-4">
      {skills?.map((skill) => (
        <SkillCard key={skill._id} skill={skill} />
      ))}
    </div>
  );
};
```

#### 7.3.5 React Query集成(可选)

对于更复杂的数据管理场景，可选使用React Query。

```tsx
// query/useSkills.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { skillsApi } from '@/api/skills';

export const useSkills = (params?: SkillListParams) => {
  return useQuery({
    queryKey: ['skills', params],
    queryFn: () => skillsApi.list(params),
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });
};

export const useSkill = (id: string) => {
  return useQuery({
    queryKey: ['skill', id],
    queryFn: () => skillsApi.get(id),
    enabled: !!id,
  });
};

export const useCreateSkill = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: skillsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
  });
};
```

---

## 8. 类型定义

### 8.1 核心类型

```typescript
export type UserRole = 'admin' | 'enterprise_admin' | 'developer' | 'user';

export type MarketType = 'public' | 'enterprise';

export type PermissionType = 'public' | 'private' | 'enterprise' | 'shared';

export interface User {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
  enterpriseId?: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
}

export interface Skill {
  _id: string;
  name: string;
  description: string;
  author: User;
  version: string;
  versions: SkillVersion[];
  marketType: MarketType;
  enterpriseId?: string;
  permissions: {
    type: PermissionType;
    sharedWith?: string[];
  };
  tags: string[];
  category: string;
  stats: {
    usageCount: number;
    downloadCount: number;
    avgRating: number;
    ratingCount: number;
  };
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface SkillVersion {
  version: string;
  url: string;
  changelog?: string;
  fileSize?: number;
  createdAt: string;
}

export interface Prompt {
  _id: string;
  name: string;
  content: string;
  author: User;
  version: string;
  versions: PromptVersion[];
  marketType: MarketType;
  enterpriseId?: string;
  category: string;
  tags: string[];
  permissions: {
    type: PermissionType;
    sharedWith?: string[];
  };
  stats: {
    usageCount: number;
    avgRating: number;
    ratingCount: number;
  };
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  securityCheck: {
    passed: boolean;
    checkedAt: string;
    issues: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface PromptVersion {
  version: string;
  content: string;
  changelog?: string;
  createdAt: string;
}

export interface Enterprise {
  _id: string;
  name: string;
  domain: string;
  logo?: string;
  description?: string;
  adminId: string;
  members: User[];
  settings: {
    maxMembers: number;
    maxStorage: number;
    allowedDomains: string[];
  };
  status: 'active' | 'inactive' | 'suspended';
}

export interface Rating {
  _id: string;
  userId: string;
  resourceType: 'skill' | 'prompt';
  resourceId: string;
  score: number;
  comment?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

---

## 9. 样式设计规范

### 9.1 颜色系统

```css
:root {
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;
  
  --color-success-500: #22c55e;
  --color-warning-500: #f59e0b;
  --color-error-500: #ef4444;
}
```

### 9.2 间距系统

```css
:root {
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
}
```

### 9.3 字体系统

```css
:root {
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'Fira Code', 'Monaco', 'Consolas', monospace;
  
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
}
```

---

## 10. 环境变量配置

```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=SkillHub
VITE_APP_VERSION=1.0.0
```

---

## 11. 构建配置

### 11.1 Vite配置

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['animate-ui'],
          state: ['zustand'],
        },
      },
    },
  },
});
```

### 11.2 Tailwind配置

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
        },
      },
      fontFamily: {
        sans: ['var(--font-family-sans)'],
        mono: ['var(--font-family-mono)'],
      },
    },
  },
  plugins: [],
};
```

---

## 12. 公共市场访问控制设计

### 12.1 访问权限调整

**核心原则**: 公共市场（主页）不需要登录即可访问，但需要过滤企业私有资源。

```typescript
interface MarketAccessConfig {
  requiresAuth: boolean;
  showLoginPrompt: boolean;
  filterEnterprisePrivate: boolean;
}

const publicMarketConfig: MarketAccessConfig = {
  requiresAuth: false,
  showLoginPrompt: true,
  filterEnterprisePrivate: true,
};
```

### 12.2 路由守卫更新

```tsx
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Layout>
      {children}
    </Layout>
  );
};

const OptionalAuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  
  return (
    <Layout>
      {children}
      {!user && <LoginPromptModal />}
    </Layout>
  );
};
```

### 12.3 资源过滤前端逻辑

```typescript
function filterResourcesForUser<T extends { visibility: string; enterpriseId?: string; owner: { _id: string } }>(
  resources: T[],
  user: User | null
): T[] {
  return resources.filter(resource => {
    if (resource.visibility === 'public') {
      return true;
    }
    
    if (resource.visibility === 'enterprise') {
      if (!user || !user.enterpriseId) {
        return false;
      }
      return resource.enterpriseId === user.enterpriseId;
    }
    
    if (resource.visibility === 'private') {
      if (!user) {
        return false;
      }
      return resource.owner._id === user._id;
    }
    
    return false;
  });
}
```

---

## 13. SkillCard组件更新 - 下载/收藏/点赞功能

### 13.1 更新后的SkillCard组件

```tsx
interface SkillCardProps {
  skill: Skill;
  onFavoriteChange?: (skillId: string, favorited: boolean) => void;
  onLikeChange?: (skillId: string, liked: boolean) => void;
}

const SkillCard: React.FC<SkillCardProps> = ({ skill, onFavoriteChange, onLikeChange }) => {
  const { user } = useAuthStore();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(skill.likeCount || 0);
  const [favoriteCount, setFavoriteCount] = useState(skill.favoriteCount || 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkFavoriteStatus();
      checkLikeStatus();
    }
  }, [user, skill._id]);

  const checkFavoriteStatus = async () => {
    try {
      const response = await favoriteApi.check('skill', skill._id);
      setIsFavorited(response.isFavorited);
    } catch (error) {
      console.error('Failed to check favorite status:', error);
    }
  };

  const checkLikeStatus = async () => {
    try {
      const response = await likeApi.check('skill', skill._id);
      setIsLiked(response.isLiked);
    } catch (error) {
      console.error('Failed to check like status:', error);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const blob = await skillApi.download(skill._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${skill.name}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please login to favorite');
      return;
    }
    
    setLoading(true);
    try {
      if (isFavorited) {
        await favoriteApi.remove('skill', skill._id);
        setIsFavorited(false);
        setFavoriteCount(prev => prev - 1);
        onFavoriteChange?.(skill._id, false);
      } else {
        await favoriteApi.add('skill', skill._id);
        setIsFavorited(true);
        setFavoriteCount(prev => prev + 1);
        onFavoriteChange?.(skill._id, true);
      }
    } catch (error) {
      console.error('Favorite operation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please login to like');
      return;
    }
    
    setLoading(true);
    try {
      const response = await likeApi.toggle('skill', skill._id);
      setIsLiked(response.liked);
      setLikeCount(response.likeCount);
      onLikeChange?.(skill._id, response.liked);
    } catch (error) {
      console.error('Like operation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link to={`/skills/${skill._id}`}>
      <Card className="hover:shadow-lg transition-shadow duration-200 h-full group">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {skill.name}
            </h3>
            <Badge variant="default" className="text-xs">
              v{skill.version}
            </Badge>
          </div>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {skill.description}
          </p>
          
          <div className="flex flex-wrap gap-1 mb-3">
            {skill.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
          
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center space-x-2">
              <Avatar size="sm">
                {skill.owner.avatar ? (
                  <AvatarImage src={skill.owner.avatar} alt={skill.owner.username} />
                ) : null}
                <AvatarFallback>{skill.owner.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-600">{skill.owner.username}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <div className="flex">{renderStars(skill.averageRating)}</div>
              <span className="text-xs text-gray-500">({skill.ratingsCount})</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleDownload}
                className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
                title="Download"
              >
                <DownloadIcon className="w-4 h-4" />
                <span className="text-xs">{skill.downloads}</span>
              </button>
              
              <button
                onClick={handleFavorite}
                className={cn(
                  "flex items-center space-x-1 transition-colors",
                  isFavorited ? "text-yellow-500" : "text-gray-500 hover:text-yellow-500"
                )}
                disabled={loading}
                title={isFavorited ? "Remove from favorites" : "Add to favorites"}
              >
                {isFavorited ? (
                  <StarIconSolid className="w-4 h-4" />
                ) : (
                  <StarIcon className="w-4 h-4" />
                )}
                <span className="text-xs">{favoriteCount}</span>
              </button>
              
              <button
                onClick={handleLike}
                className={cn(
                  "flex items-center space-x-1 transition-colors",
                  isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
                )}
                disabled={loading}
                title={isLiked ? "Unlike" : "Like"}
              >
                {isLiked ? (
                  <HeartIconSolid className="w-4 h-4" />
                ) : (
                  <HeartIcon className="w-4 h-4" />
                )}
                <span className="text-xs">{likeCount}</span>
              </button>
            </div>
            
            <span className="text-xs text-gray-500">
              {skill.category}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
```

### 13.2 PromptCard组件更新

```tsx
interface PromptCardProps {
  prompt: Prompt;
  onFavoriteChange?: (promptId: string, favorited: boolean) => void;
  onLikeChange?: (promptId: string, liked: boolean) => void;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, onFavoriteChange, onLikeChange }) => {
  const { user } = useAuthStore();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(prompt.likeCount || 0);
  const [favoriteCount, setFavoriteCount] = useState(prompt.favoriteCount || 0);
  const [loading, setLoading] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(prompt.content);
      toast.success('Prompt copied to clipboard');
      
      await promptApi.incrementUsage(prompt._id);
    } catch (error) {
      toast.error('Failed to copy prompt');
    }
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please login to favorite');
      return;
    }
    
    setLoading(true);
    try {
      if (isFavorited) {
        await favoriteApi.remove('prompt', prompt._id);
        setIsFavorited(false);
        setFavoriteCount(prev => prev - 1);
        onFavoriteChange?.(prompt._id, false);
      } else {
        await favoriteApi.add('prompt', prompt._id);
        setIsFavorited(true);
        setFavoriteCount(prev => prev + 1);
        onFavoriteChange?.(prompt._id, true);
      }
    } catch (error) {
      console.error('Favorite operation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please login to like');
      return;
    }
    
    setLoading(true);
    try {
      const response = await likeApi.toggle('prompt', prompt._id);
      setIsLiked(response.liked);
      setLikeCount(response.likeCount);
      onLikeChange?.(prompt._id, response.liked);
    } catch (error) {
      console.error('Like operation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link to={`/prompts/${prompt._id}`}>
      <Card className="hover:shadow-lg transition-shadow duration-200 h-full group">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {prompt.name}
            </h3>
            <Badge variant="outline" className="text-xs">
              {prompt.category}
            </Badge>
          </div>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {prompt.description}
          </p>
          
          <div className="flex flex-wrap gap-1 mb-3">
            {prompt.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
          
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center space-x-2">
              <Avatar size="sm">
                <AvatarFallback>{prompt.owner.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-600">{prompt.owner.username}</span>
            </div>
            
            <span className="text-xs text-gray-500">
              {prompt.usageCount} uses
            </span>
          </div>
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
                title="Copy prompt"
              >
                <ClipboardIcon className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleFavorite}
                className={cn(
                  "flex items-center space-x-1 transition-colors",
                  isFavorited ? "text-yellow-500" : "text-gray-500 hover:text-yellow-500"
                )}
                disabled={loading}
                title={isFavorited ? "Remove from favorites" : "Add to favorites"}
              >
                {isFavorited ? (
                  <StarIconSolid className="w-4 h-4" />
                ) : (
                  <StarIcon className="w-4 h-4" />
                )}
                <span className="text-xs">{favoriteCount}</span>
              </button>
              
              <button
                onClick={handleLike}
                className={cn(
                  "flex items-center space-x-1 transition-colors",
                  isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
                )}
                disabled={loading}
                title={isLiked ? "Unlike" : "Like"}
              >
                {isLiked ? (
                  <HeartIconSolid className="w-4 h-4" />
                ) : (
                  <HeartIcon className="w-4 h-4" />
                )}
                <span className="text-xs">{likeCount}</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-1">
              <div className="flex">{renderStars(prompt.averageRating)}</div>
              <span className="text-xs text-gray-500">({prompt.ratingsCount})</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
```

---

## 14. 详情页评论和评分功能设计

### 14.1 评论组件

```tsx
interface CommentSectionProps {
  resourceType: 'skill' | 'prompt';
  resourceId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ resourceType, resourceId }) => {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  
  useEffect(() => {
    fetchComments();
  }, [resourceType, resourceId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await commentApi.getComments(resourceType, resourceId);
      setComments(response.comments);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to comment');
      return;
    }
    
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    
    try {
      const response = await commentApi.create({
        resourceType,
        resourceId,
        content: newComment.trim(),
      });
      
      setComments([response.comment, ...comments]);
      setNewComment('');
      toast.success('Comment posted');
    } catch (error) {
      toast.error('Failed to post comment');
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!user) {
      toast.error('Please login to reply');
      return;
    }
    
    if (!replyContent.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }
    
    try {
      const response = await commentApi.create({
        resourceType,
        resourceId,
        content: replyContent.trim(),
        parentId,
      });
      
      setComments(comments.map(comment => {
        if (comment._id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), response.comment],
          };
        }
        return comment;
      }));
      
      setReplyingTo(null);
      setReplyContent('');
      toast.success('Reply posted');
    } catch (error) {
      toast.error('Failed to post reply');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    try {
      await commentApi.delete(commentId);
      setComments(comments.filter(c => c._id !== commentId));
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">
        Comments ({comments.length})
      </h3>
      
      {user ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <Button type="submit" disabled={!newComment.trim()}>
              Post Comment
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 text-center">
          <p className="text-gray-600">
            <Link to="/login" className="text-blue-600 hover:underline">Login</Link> to comment
          </p>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-8">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              currentUserId={user?._id}
              onReply={(id) => {
                setReplyingTo(id);
                setReplyContent('');
              }}
              onDelete={handleDeleteComment}
              replyingTo={replyingTo}
              replyContent={replyContent}
              onReplyContentChange={setReplyContent}
              onSubmitReply={handleSubmitReply}
              onCancelReply={() => setReplyingTo(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
```

### 14.2 评论项组件

```tsx
interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onReply: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  replyingTo: string | null;
  replyContent: string;
  onReplyContentChange: (content: string) => void;
  onSubmitReply: (parentId: string) => void;
  onCancelReply: () => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  onReply,
  onDelete,
  replyingTo,
  replyContent,
  onReplyContentChange,
  onSubmitReply,
  onCancelReply,
}) => {
  const isOwner = currentUserId === comment.user._id;
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback>{comment.user.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900">{comment.user.username}</span>
              <span className="text-sm text-gray-500 ml-2">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>
            
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(comment._id)}
                className="text-red-500 hover:text-red-600"
              >
                Delete
              </Button>
            )}
          </div>
          
          <p className="mt-2 text-gray-700">{comment.content}</p>
          
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply(comment._id)}
              className="text-gray-500 hover:text-gray-700"
            >
              Reply
            </Button>
          </div>
          
          {replyingTo === comment._id && (
            <div className="mt-3 pl-4 border-l-2 border-gray-200">
              <textarea
                value={replyContent}
                onChange={(e) => onReplyContentChange(e.target.value)}
                placeholder="Write a reply..."
                className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
              />
              <div className="flex justify-end space-x-2 mt-2">
                <Button variant="outline" size="sm" onClick={onCancelReply}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => onSubmitReply(comment._id)}
                  disabled={!replyContent.trim()}
                >
                  Reply
                </Button>
              </div>
            </div>
          )}
          
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-3">
              {comment.replies.map((reply) => (
                <div key={reply._id} className="bg-gray-50 p-3 rounded">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>{reply.user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{reply.user.username}</span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-700">{reply.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

### 14.3 评分组件

```tsx
interface RatingSectionProps {
  resourceType: 'skill' | 'prompt';
  resourceId: string;
  currentRating?: number;
  averageRating: number;
  ratingCount: number;
  onRatingChange?: (rating: number) => void;
}

const RatingSection: React.FC<RatingSectionProps> = ({
  resourceType,
  resourceId,
  currentRating,
  averageRating,
  ratingCount,
  onRatingChange,
}) => {
  const { user } = useAuthStore();
  const [hoveredRating, setHoveredRating] = useState(0);
  const [userRating, setUserRating] = useState(currentRating || 0);
  const [submitting, setSubmitting] = useState(false);

  const handleRate = async (rating: number) => {
    if (!user) {
      toast.error('Please login to rate');
      return;
    }
    
    setSubmitting(true);
    try {
      const api = resourceType === 'skill' ? skillApi : promptApi;
      await api.rate(resourceId, rating);
      setUserRating(rating);
      onRatingChange?.(rating);
      toast.success('Rating submitted');
    } catch (error) {
      toast.error('Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-3xl font-bold text-gray-900">
              {averageRating.toFixed(1)}
            </span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  className={cn(
                    "w-5 h-5",
                    star <= Math.round(averageRating)
                      ? "text-yellow-400"
                      : "text-gray-300"
                  )}
                  filled={star <= Math.round(averageRating)}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-500">{ratingCount} ratings</p>
        </div>
        
        {user && (
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">Your rating</p>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  disabled={submitting}
                  className={cn(
                    "p-0.5 transition-colors",
                    submitting && "cursor-not-allowed opacity-50"
                  )}
                >
                  <StarIcon
                    className={cn(
                      "w-6 h-6 transition-colors",
                      (hoveredRating || userRating) >= star
                        ? "text-yellow-400"
                        : "text-gray-300"
                    )}
                    filled={(hoveredRating || userRating) >= star}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {!user && (
        <p className="text-sm text-gray-500 text-center">
          <Link to="/login" className="text-blue-600 hover:underline">Login</Link> to rate
        </p>
      )}
    </div>
  );
};
```

### 14.4 更新后的SkillDetailPage

```tsx
const SkillDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [userRating, setUserRating] = useState<number | undefined>();

  useEffect(() => {
    fetchSkill();
  }, [id]);

  const fetchSkill = async () => {
    if (!id) return;
    try {
      const response = await skillApi.getSkillById(id);
      setSkill(response as unknown as Skill);
      
      if (user) {
        const ratingResponse = await skillApi.getUserRating(id);
        setUserRating(ratingResponse.rating);
      }
    } catch (err) {
      setError('Failed to load skill');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!id) return;
    setDownloading(true);
    try {
      const blob = await skillApi.download(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${skill?.name || 'skill'}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      if (skill) {
        setSkill({ ...skill, downloads: skill.downloads + 1 });
      }
    } catch (err) {
      setError('Failed to download skill');
    } finally {
      setDownloading(false);
    }
  };

  const handleRatingChange = (rating: number) => {
    setUserRating(rating);
    if (skill) {
      const newAvg = ((skill.averageRating * skill.ratingsCount) + rating) / (skill.ratingsCount + 1);
      setSkill({
        ...skill,
        averageRating: Math.round(newAvg * 10) / 10,
        ratingsCount: skill.ratingsCount + 1,
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (error || !skill) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-500">{error || 'Skill not found'}</div>
          <div className="text-center mt-4">
            <Button onClick={() => navigate('/skills')}>Back to Skills</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => navigate('/skills')} className="mb-6">
          Back to Skills
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{skill.name}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">v{skill.version}</Badge>
                  <Badge variant="outline">{skill.category}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                {isOwner && (
                  <Button variant="outline" onClick={() => navigate(`/skills/${skill._id}/edit`)}>
                    Edit
                  </Button>
                )}
                <Button onClick={handleDownload} disabled={downloading}>
                  {downloading ? 'Downloading...' : 'Download'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{skill.owner.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-600">{skill.owner.username}</span>
              <span className="text-sm text-gray-400">|</span>
              <span className="text-sm text-gray-600">{skill.downloads} downloads</span>
              <span className="text-sm text-gray-400">|</span>
              <span className="text-sm text-gray-600">
                {new Date(skill.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-600">{skill.description}</p>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {skill.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <RatingSection
                resourceType="skill"
                resourceId={skill._id}
                currentRating={userRating}
                averageRating={skill.averageRating}
                ratingCount={skill.ratingsCount}
                onRatingChange={handleRatingChange}
              />
            </div>

            <div>
              <h3 className="font-semibold mb-2">Content</h3>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {skill.content}
              </pre>
            </div>
          </CardContent>
        </Card>

        <CommentSection resourceType="skill" resourceId={skill._id} />
      </div>
    </Layout>
  );
};
```

---

## 15. API服务更新

### 15.1 收藏API

```typescript
export const favoriteApi = {
  add: async (resourceType: 'skill' | 'prompt', resourceId: string) => {
    const response = await marketClient.post('/favorites', {
      resourceType,
      resourceId,
    });
    return response.data;
  },

  remove: async (resourceType: 'skill' | 'prompt', resourceId: string) => {
    const response = await marketClient.delete(`/favorites/${resourceType}/${resourceId}`);
    return response.data;
  },

  list: async (params?: { type?: string; page?: number; limit?: number }) => {
    const response = await marketClient.get('/favorites', { params });
    return response.data;
  },

  check: async (resourceType: 'skill' | 'prompt', resourceId: string) => {
    const response = await marketClient.get(`/favorites/check/${resourceType}/${resourceId}`);
    return response.data;
  },
};
```

### 15.2 点赞API

```typescript
export const likeApi = {
  toggle: async (resourceType: 'skill' | 'prompt', resourceId: string) => {
    const response = await marketClient.post('/likes/toggle', {
      resourceType,
      resourceId,
    });
    return response.data;
  },

  check: async (resourceType: 'skill' | 'prompt', resourceId: string) => {
    const response = await marketClient.get(`/likes/check/${resourceType}/${resourceId}`);
    return response.data;
  },
};
```

### 15.3 评论API

```typescript
export const commentApi = {
  getComments: async (
    resourceType: 'skill' | 'prompt',
    resourceId: string,
    params?: { page?: number; limit?: number; sort?: string }
  ) => {
    const response = await marketClient.get(`/comments/${resourceType}/${resourceId}`, { params });
    return response.data;
  },

  create: async (data: {
    resourceType: 'skill' | 'prompt';
    resourceId: string;
    content: string;
    parentId?: string;
  }) => {
    const response = await marketClient.post('/comments', data);
    return response.data;
  },

  delete: async (commentId: string) => {
    const response = await marketClient.delete(`/comments/${commentId}`);
    return response.data;
  },
};
```

### 15.4 评分API更新

```typescript
export const skillApi = {
  rate: async (id: string, rating: number) => {
    const response = await marketClient.post(`/skills/${id}/rate`, { rating });
    return response.data;
  },

  getUserRating: async (id: string) => {
    const response = await marketClient.get(`/skills/${id}/user-rating`);
    return response.data;
  },
};

export const promptApi = {
  rate: async (id: string, rating: number) => {
    const response = await marketClient.post(`/prompts/${id}/rate`, { rating });
    return response.data;
  },

  getUserRating: async (id: string) => {
    const response = await marketClient.get(`/prompts/${id}/user-rating`);
    return response.data;
  },
};
```

---

## 16. 可操作组件存在感强化设计

### 16.1 设计原则

**核心目标**: 通过视觉设计让用户直观识别可交互组件，提升用户体验。

**设计策略**:
1. 使用图标增强可识别性
2. 悬停状态明显变化
3. 交互反馈即时可见
4. 视觉层次清晰

### 16.2 图标系统设计

```tsx
import {
  DownloadIcon,
  StarIcon,
  HeartIcon,
  BookmarkIcon,
  ShareIcon,
  EditIcon,
  TrashIcon,
  PlusIcon,
  SearchIcon,
  FilterIcon,
  SortIcon,
  CopyIcon,
  CommentIcon,
  RatingIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MenuIcon,
  CloseIcon,
  CheckIcon,
  WarningIcon,
  InfoIcon,
  UserIcon,
  SettingsIcon,
  LogoutIcon,
  LoginIcon,
} from '@radix-ui/react-icons';

const iconConfig = {
  size: {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  },
  color: {
    default: 'text-gray-500',
    hover: 'text-black',
    active: 'text-black',
    disabled: 'text-gray-300',
  },
};
```

### 16.3 可操作按钮样式规范

```tsx
const interactiveButtonStyles = {
  base: `
    inline-flex items-center justify-center gap-2
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black
  `,
  
  primary: `
    bg-black text-white
    hover:bg-gray-800 hover:scale-[1.02]
    active:scale-[0.98]
    shadow-sm hover:shadow-md
  `,
  
  secondary: `
    bg-white text-black border-2 border-black
    hover:bg-gray-50 hover:border-gray-800
    active:bg-gray-100
  `,
  
  ghost: `
    bg-transparent text-gray-600
    hover:bg-gray-100 hover:text-black
    active:bg-gray-200
  `,
  
  icon: `
    p-2 rounded-full
    bg-transparent text-gray-500
    hover:bg-gray-100 hover:text-black hover:scale-110
    active:scale-95
  `,
};
```

### 16.4 卡片组件交互强化

```tsx
interface SkillCardProps {
  skill: Skill;
  onFavoriteChange?: (skillId: string, favorited: boolean) => void;
  onLikeChange?: (skillId: string, liked: boolean) => void;
}

const SkillCard: React.FC<SkillCardProps> = ({ skill, onFavoriteChange, onLikeChange }) => {
  const { user } = useAuthStore();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(skill.likeCount || 0);
  const [favoriteCount, setFavoriteCount] = useState(skill.favoriteCount || 0);

  return (
    <Link to={`/skills/${skill._id}`}>
      <Card className="group hover:shadow-xl hover:border-black transition-all duration-300 h-full border-2 border-transparent">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-bold text-black group-hover:text-gray-700 line-clamp-1 transition-colors">
              {skill.name}
            </h3>
            <Badge className="bg-black text-white text-xs font-medium">
              v{skill.version}
            </Badge>
          </div>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {skill.description}
          </p>
          
          <div className="flex flex-wrap gap-1 mb-3">
            {skill.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full group-hover:bg-gray-200 transition-colors"
              >
                <TagIcon className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>
          
          <div className="flex items-center justify-between mt-auto mb-3">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8 border-2 border-gray-200 group-hover:border-black transition-colors">
                <AvatarFallback className="bg-gray-100 text-black font-medium">
                  {skill.owner.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-700">{skill.owner.username}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <StarIcon className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">{skill.averageRating.toFixed(1)}</span>
              <span className="text-xs text-gray-500">({skill.ratingsCount})</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t-2 border-gray-100 group-hover:border-gray-200 transition-colors">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-100 transition-all duration-200 hover:scale-105 active:scale-95"
                title="Download"
              >
                <DownloadIcon className="w-4 h-4" />
                <span>{skill.downloads}</span>
              </button>
              
              <button
                onClick={handleFavorite}
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95",
                  isFavorited 
                    ? "text-yellow-600 bg-yellow-50 hover:bg-yellow-100" 
                    : "text-gray-600 hover:text-yellow-600 hover:bg-gray-100"
                )}
                title={isFavorited ? "Remove from favorites" : "Add to favorites"}
              >
                {isFavorited ? (
                  <StarFilledIcon className="w-4 h-4" />
                ) : (
                  <StarIcon className="w-4 h-4" />
                )}
                <span>{favoriteCount}</span>
              </button>
              
              <button
                onClick={handleLike}
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95",
                  isLiked 
                    ? "text-red-600 bg-red-50 hover:bg-red-100" 
                    : "text-gray-600 hover:text-red-600 hover:bg-gray-100"
                )}
                title={isLiked ? "Unlike" : "Like"}
              >
                {isLiked ? (
                  <HeartFilledIcon className="w-4 h-4" />
                ) : (
                  <HeartIcon className="w-4 h-4" />
                )}
                <span>{likeCount}</span>
              </button>
            </div>
            
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
              {skill.category}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
```

### 16.5 表单组件交互强化

```tsx
const Input: React.FC<InputProps> = ({ className, ...props }) => {
  return (
    <input
      className={cn(
        "w-full px-4 py-2.5 text-black bg-white border-2 border-gray-200 rounded-lg",
        "placeholder:text-gray-400",
        "hover:border-gray-300",
        "focus:outline-none focus:border-black focus:ring-2 focus:ring-black focus:ring-opacity-10",
        "transition-all duration-200",
        "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
};

const Select: React.FC<SelectProps> = ({ className, children, ...props }) => {
  return (
    <div className="relative">
      <select
        className={cn(
          "w-full px-4 py-2.5 text-black bg-white border-2 border-gray-200 rounded-lg appearance-none cursor-pointer",
          "hover:border-gray-300",
          "focus:outline-none focus:border-black focus:ring-2 focus:ring-black focus:ring-opacity-10",
          "transition-all duration-200",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
    </div>
  );
};

const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', icon, children, className, ...props }) => {
  const variantStyles = {
    primary: 'bg-black text-white hover:bg-gray-800 active:bg-gray-900 shadow-sm hover:shadow-md',
    secondary: 'bg-white text-black border-2 border-black hover:bg-gray-50 active:bg-gray-100',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-black',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2',
  };
  
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-lg",
        "transition-all duration-200 ease-in-out",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black",
        "hover:scale-[1.02] active:scale-[0.98]",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
```

### 16.6 导航组件交互强化

```tsx
const Header: React.FC = () => {
  const { user } = useAuthStore();
  
  return (
    <header className="bg-white border-b-2 border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-black">SkillHub</span>
          </Link>
          
          <nav className="hidden md:flex space-x-1">
            <NavLink 
              to="/skills" 
              className={({ isActive }) => cn(
                "px-4 py-2 rounded-lg font-medium transition-all duration-200",
                "flex items-center gap-2",
                isActive 
                  ? "bg-black text-white" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-black"
              )}
            >
              <GridIcon className="w-4 h-4" />
              Skills
            </NavLink>
            
            <NavLink 
              to="/prompts" 
              className={({ isActive }) => cn(
                "px-4 py-2 rounded-lg font-medium transition-all duration-200",
                "flex items-center gap-2",
                isActive 
                  ? "bg-black text-white" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-black"
              )}
            >
              <ChatBubbleIcon className="w-4 h-4" />
              Prompts
            </NavLink>
            
            {user && (
              <NavLink 
                to="/my/resources" 
                className={({ isActive }) => cn(
                  "px-4 py-2 rounded-lg font-medium transition-all duration-200",
                  "flex items-center gap-2",
                  isActive 
                    ? "bg-black text-white" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-black"
                )}
              >
                <FolderIcon className="w-4 h-4" />
                My Resources
              </NavLink>
            )}
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 w-64 bg-gray-50 border-2 border-transparent rounded-lg text-sm focus:outline-none focus:border-black focus:bg-white transition-all duration-200"
            />
          </div>
          
          {user ? (
            <div className="flex items-center space-x-3">
              <Link to="/upload">
                <Button variant="primary" size="sm" icon={<PlusIcon className="w-4 h-4" />}>
                  Upload
                </Button>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <Avatar className="h-8 w-8 border-2 border-gray-200">
                      <AvatarFallback className="bg-black text-white font-medium">
                        {user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2">
                    <SettingsIcon className="w-4 h-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex items-center gap-2 text-red-600">
                    <LogoutIcon className="w-4 h-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" icon={<LoginIcon className="w-4 h-4" />}>
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
```

---

## 17. 黑色主色调设计系统

### 17.1 色彩系统定义

```typescript
const colorSystem = {
  primary: {
    DEFAULT: '#000000',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  
  accent: {
    yellow: '#FBBF24',
    red: '#EF4444',
    blue: '#3B82F6',
    green: '#22C55E',
    purple: '#A855F7',
  },
  
  semantic: {
    success: '#22C55E',
    warning: '#FBBF24',
    error: '#EF4444',
    info: '#3B82F6',
  },
  
  background: {
    DEFAULT: '#FFFFFF',
    secondary: '#FAFAFA',
    tertiary: '#F5F5F5',
  },
  
  text: {
    primary: '#000000',
    secondary: '#525252',
    tertiary: '#A3A3A3',
    inverse: '#FFFFFF',
  },
  
  border: {
    DEFAULT: '#E5E5E5',
    hover: '#A3A3A3',
    focus: '#000000',
  },
};
```

### 17.2 Tailwind配置更新

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#000000',
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        accent: {
          yellow: '#FBBF24',
          red: '#EF4444',
          blue: '#3B82F6',
          green: '#22C55E',
          purple: '#A855F7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'primary': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'primary-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'primary-active': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};
```

### 17.3 CSS变量定义

```css
/* src/styles/variables.css */
:root {
  /* Primary Colors */
  --color-primary: #000000;
  --color-primary-hover: #262626;
  --color-primary-active: #171717;
  
  /* Background Colors */
  --color-bg-primary: #FFFFFF;
  --color-bg-secondary: #FAFAFA;
  --color-bg-tertiary: #F5F5F5;
  
  /* Text Colors */
  --color-text-primary: #000000;
  --color-text-secondary: #525252;
  --color-text-tertiary: #A3A3A3;
  --color-text-inverse: #FFFFFF;
  
  /* Border Colors */
  --color-border: #E5E5E5;
  --color-border-hover: #A3A3A3;
  --color-border-focus: #000000;
  
  /* Accent Colors */
  --color-accent-yellow: #FBBF24;
  --color-accent-red: #EF4444;
  --color-accent-blue: #3B82F6;
  --color-accent-green: #22C55E;
  --color-accent-purple: #A855F7;
  
  /* Semantic Colors */
  --color-success: #22C55E;
  --color-warning: #FBBF24;
  --color-error: #EF4444;
  --color-info: #3B82F6;
  
  /* Shadows */
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  
  /* Border Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;
  
  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-normal: 200ms ease-in-out;
  --transition-slow: 300ms ease-in-out;
}
```

### 17.4 组件样式示例

```tsx
const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className }) => {
  const variantStyles = {
    default: 'bg-black text-white',
    secondary: 'bg-gray-100 text-gray-700 border border-gray-200',
    outline: 'bg-transparent text-black border-2 border-black',
    success: 'bg-green-50 text-green-700 border border-green-200',
    warning: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    error: 'bg-red-50 text-red-700 border border-red-200',
  };
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

const Card: React.FC<CardProps> = ({ children, className, hoverable = true }) => {
  return (
    <div
      className={cn(
        "bg-white border-2 border-gray-200 rounded-xl overflow-hidden",
        "transition-all duration-200",
        hoverable && "hover:border-black hover:shadow-lg cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
};

const Alert: React.FC<AlertProps> = ({ variant = 'info', title, children }) => {
  const variantStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };
  
  const iconMap = {
    info: <InfoIcon className="w-5 h-5 text-blue-500" />,
    success: <CheckIcon className="w-5 h-5 text-green-500" />,
    warning: <WarningIcon className="w-5 h-5 text-yellow-500" />,
    error: <XIcon className="w-5 h-5 text-red-500" />,
  };
  
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 border-2 rounded-lg",
        variantStyles[variant]
      )}
    >
      {iconMap[variant]}
      <div>
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        <p className="text-sm">{children}</p>
      </div>
    </div>
  );
};
```

### 17.5 页面布局样式

```tsx
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};

const PageHeader: React.FC<{ title: string; description?: string; actions?: React.ReactNode }> = ({ 
  title, 
  description, 
  actions 
}) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">{title}</h1>
          {description && (
            <p className="mt-2 text-gray-600">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
      <div className="mt-4 h-px bg-gray-200" />
    </div>
  );
};
```

### 17.6 交互状态设计

```tsx
const interactiveStates = {
  button: {
    default: 'bg-black text-white',
    hover: 'bg-gray-800 scale-[1.02]',
    active: 'bg-gray-900 scale-[0.98]',
    focus: 'ring-2 ring-black ring-offset-2',
    disabled: 'bg-gray-300 text-gray-500 cursor-not-allowed',
  },
  
  card: {
    default: 'border-gray-200 shadow-sm',
    hover: 'border-black shadow-lg',
    active: 'border-gray-800',
  },
  
  input: {
    default: 'border-gray-200 bg-white',
    hover: 'border-gray-300',
    focus: 'border-black ring-2 ring-black ring-opacity-10',
    disabled: 'bg-gray-50 border-gray-100 text-gray-400',
    error: 'border-red-500 ring-2 ring-red-500 ring-opacity-10',
  },
  
  link: {
    default: 'text-gray-600',
    hover: 'text-black underline',
    active: 'text-gray-800',
    visited: 'text-gray-500',
  },
};
```
```
