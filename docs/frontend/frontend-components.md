# SkillHub 前端 - 组件设计

## 0. 设计系统

### 0.1 主色调系统（黑色主题）

**核心原则**: 以黑色为主色调，通过高对比度设计强化视觉层次和可操作组件的存在感。

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
};
```

### 0.2 可操作组件存在感强化

**设计策略**:
1. 使用图标增强可识别性
2. 悬停状态明显变化（边框变黑、阴影增强）
3. 交互反馈即时可见（缩放、颜色变化）
4. 视觉层次清晰（黑色边框、高对比度）

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
    default: 'border-2 border-gray-200',
    hover: 'border-black shadow-lg',
    active: 'border-gray-800',
  },
  
  input: {
    default: 'border-2 border-gray-200',
    hover: 'border-gray-300',
    focus: 'border-black ring-2 ring-black ring-opacity-10',
    error: 'border-red-500 ring-2 ring-red-500 ring-opacity-10',
  },
};
```

---

## 1. 通用组件

### 1.1 Button组件

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
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      {icon && !loading && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </>
  );
  
  if (to) {
    return <Link to={to} className={classes}>{content}</Link>;
  }
  
  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
};
```

### 1.2 Input组件

```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  helperText?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  error,
  helperText,
  prefix,
  suffix,
  className,
  ...props
}) => {
  return (
    <div className="w-full">
      <div className={cn(
        'flex items-center border-2 rounded-lg overflow-hidden transition-all duration-200',
        error 
          ? 'border-red-500 ring-2 ring-red-500 ring-opacity-10' 
          : 'border-gray-200 hover:border-gray-300 focus-within:border-black focus-within:ring-2 focus-within:ring-black focus-within:ring-opacity-10',
        props.disabled && 'bg-gray-50 cursor-not-allowed'
      )}>
        {prefix && <span className="pl-3 text-gray-500">{prefix}</span>}
        <input
          className={cn(
            'flex-1 py-2.5 px-3 text-black outline-none bg-transparent',
            prefix && 'pl-1',
            suffix && 'pr-1',
            className
          )}
          {...props}
        />
        {suffix && <span className="pr-3 text-gray-500">{suffix}</span>}
      </div>
      {helperText && (
        <p className={cn('mt-1 text-sm', error ? 'text-red-500' : 'text-gray-500')}>
          {helperText}
        </p>
      )}
    </div>
  );
};
```

### 1.3 Modal组件

```tsx
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) => {
  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />
        
        <div className={cn(
          'relative bg-white rounded-xl shadow-2xl w-full animate-fade-in border-2 border-gray-200',
          sizeStyles[size]
        )}>
          {title && (
            <div className="flex items-center justify-between p-4 border-b-2 border-gray-200">
              <h3 className="text-lg font-bold text-black">{title}</h3>
              <button 
                onClick={onClose} 
                className="p-1.5 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
          )}
          
          <div className="p-4">
            {children}
          </div>
          
          {footer && (
            <div className="flex justify-end gap-2 p-4 border-t-2 border-gray-200">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

### 1.4 Card组件

```tsx
interface CardProps {
  title?: string;
  subtitle?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  header,
  footer,
  children,
  className,
  hoverable = false,
}) => {
  return (
    <div className={cn(
      'bg-white rounded-xl border-2 overflow-hidden transition-all duration-200',
      hoverable 
        ? 'border-gray-200 hover:border-black hover:shadow-lg cursor-pointer' 
        : 'border-gray-200',
      className
    )}>
      {(title || subtitle || header) && (
        <div className="p-4 border-b-2 border-gray-200">
          {header || (
            <>
              {title && <h3 className="text-lg font-bold text-black">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </>
          )}
        </div>
      )}
      
      <div className="p-4">
        {children}
      </div>
      
      {footer && (
        <div className="p-4 border-t-2 border-gray-200 bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
};
```

### 1.5 Table组件

```tsx
interface TableColumn<T> {
  key: string;
  title: string;
  width?: string;
  render?: (item: T, index: number) => React.ReactNode;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  empty?: React.ReactNode;
  onRowClick?: (item: T) => void;
}

const Table = <T extends { _id?: string }>({
  columns,
  data,
  loading,
  empty,
  onRowClick,
}: TableProps<T>) => {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (!data.length) {
    return empty || <Empty message="暂无数据" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {columns.map((col) => (
              <th 
                key={col.key}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                style={{ width: col.width }}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr 
              key={item._id || index}
              className={cn(onRowClick && 'cursor-pointer hover:bg-gray-50')}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4">
                  {col.render ? col.render(item, index) : (item as Record<string, unknown>)[col.key] as React.ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### 1.6 Pagination组件

```tsx
interface PaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
  showQuickJumper?: boolean;
  showSizeChanger?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  current,
  total,
  pageSize,
  onChange,
  showQuickJumper = true,
  showSizeChanger = true,
}) => {
  const totalPages = Math.ceil(total / pageSize);
  
  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      
      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);
      
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (current < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-between py-4">
      <div className="text-sm text-gray-700">
        共 {total} 条记录，第 {current}/{totalPages} 页
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={current === 1}
          onClick={() => onChange(current - 1)}
        >
          上一页
        </Button>
        
        {renderPageNumbers().map((page, idx) => (
          page === '...' ? (
            <span key={idx} className="px-2 text-gray-400">...</span>
          ) : (
            <Button
              key={idx}
              variant={current === page ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => onChange(page as number)}
            >
              {page}
            </Button>
          )
        ))}
        
        <Button
          variant="ghost"
          size="sm"
          disabled={current === totalPages}
          onClick={() => onChange(current + 1)}
        >
          下一页
        </Button>
      </div>
    </div>
  );
};
```

### 1.7 Rating评分组件

```tsx
interface RatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

const Rating: React.FC<RatingProps> = ({
  value,
  onChange,
  readonly = false,
  max = 5,
  size = 'md',
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
      {Array.from({ length: max }).map((_, index) => {
        const ratingValue = index + 1;
        const filled = ratingValue <= displayValue;
        
        return (
          <button
            key={index}
            type="button"
            disabled={readonly}
            className={cn(
              'transition-colors',
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
              filled ? 'text-yellow-400' : 'text-gray-300'
            )}
            onMouseEnter={() => !readonly && setHoverValue(ratingValue)}
            onMouseLeave={() => !readonly && setHoverValue(null)}
            onClick={() => !readonly && onChange?.(ratingValue)}
          >
            <StarIcon className={sizeStyles[size]} filled={filled} />
          </button>
        );
      })}
    </div>
  );
};
```

### 1.8 ViewToggle视图切换组件

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

## 2. 布局组件

### 2.1 Header组件

```tsx
interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <header className="bg-white border-b-2 border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <img src="/logo.svg" alt="SkillHub" className="h-8 w-8" />
            <span className="text-xl font-bold text-black">SkillHub</span>
          </Link>
          
          <nav className="hidden md:flex space-x-6">
            <NavLink to="/market" className="flex items-center gap-1.5 text-gray-600 hover:text-black font-medium transition-colors">
              <MarketIcon className="w-4 h-4" />
              公开市场
            </NavLink>
            {user && <NavLink to="/enterprise" className="flex items-center gap-1.5 text-gray-600 hover:text-black font-medium transition-colors">
              <BuildingIcon className="w-4 h-4" />
              企业市场
            </NavLink>}
            {user && <NavLink to="/my/resources" className="flex items-center gap-1.5 text-gray-600 hover:text-black font-medium transition-colors">
              <FolderIcon className="w-4 h-4" />
              我的资源
            </NavLink>}
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <SearchBar 
            placeholder="搜索Skill或提示词..." 
            onSearch={(keyword) => navigate(`/market?keyword=${keyword}`)}
          />
          
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuVisible(!menuVisible)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <UserAvatar user={user} size="sm" />
                <span className="text-sm font-medium text-black">{user.username}</span>
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              </button>
              
              {menuVisible && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border-2 border-gray-200 py-1">
                  <MenuItem to="/profile" icon={<UserIcon className="w-4 h-4" />}>个人中心</MenuItem>
                  <MenuItem to="/settings" icon={<SettingsIcon className="w-4 h-4" />}>设置</MenuItem>
                  {user.role === 'admin' && (
                    <MenuItem to="/admin" icon={<ShieldIcon className="w-4 h-4" />}>管理后台</MenuItem>
                  )}
                  <Divider />
                  <MenuItem onClick={onLogout} icon={<LogoutIcon className="w-4 h-4" />}>退出登录</MenuItem>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" to="/login" icon={<LoginIcon className="w-4 h-4" />}>登录</Button>
              <Button variant="primary" to="/register" icon={<UserPlusIcon className="w-4 h-4" />}>注册</Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
```

### 2.2 Sidebar组件

```tsx
interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onCollapse }) => {
  const location = useLocation();
  const { user } = useAuthStore();

  const menuItems = [
    {
      title: '概览',
      icon: <DashboardIcon />,
      path: '/admin',
    },
    {
      title: '用户管理',
      icon: <UserIcon />,
      path: '/admin/users',
    },
    {
      title: '内容审核',
      icon: <CheckIcon />,
      path: '/admin/content',
    },
    {
      title: '企业管理',
      icon: <BuildingIcon />,
      path: '/admin/enterprises',
    },
    {
      title: 'Agent管理',
      icon: <BotIcon />,
      path: '/admin/agents',
    },
  ];

  return (
    <aside className={cn(
      'bg-gray-900 text-white transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
        {!collapsed && <span className="font-semibold">管理后台</span>}
        <button onClick={() => onCollapse?.(!collapsed)}>
          <MenuIcon />
        </button>
      </div>
      
      <nav className="py-4">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex items-center px-4 py-3 transition-colors',
              location.pathname === item.path 
                ? 'bg-primary text-white' 
                : 'text-gray-400 hover:bg-gray-800'
            )}
          >
            <span className="w-5">{item.icon}</span>
            {!collapsed && <span className="ml-3">{item.title}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
};
```

## 3. Skill组件

### 3.1 SkillCard组件

**设计原则**: 黑色边框，图标增强操作识别性，悬停状态明显。

```tsx
interface SkillCardProps {
  skill: Skill;
  viewMode?: 'grid' | 'list';
  onClick?: () => void;
}

const SkillCard: React.FC<SkillCardProps> = ({ skill, viewMode = 'grid', onClick }) => {
  if (viewMode === 'list') {
    return (
      <div 
        className="flex items-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-black hover:shadow-md transition-all duration-200 cursor-pointer"
        onClick={onClick}
      >
        <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
          <CodeIcon className="w-8 h-8 text-gray-600" />
        </div>
        <div className="ml-4 flex-1 min-w-0">
          <h3 className="text-lg font-bold text-black truncate">{skill.name}</h3>
          <p className="text-sm text-gray-500 truncate">{skill.description}</p>
          <div className="flex items-center gap-4 mt-2">
            <Rating value={skill.rating} readonly size="sm" />
            <span className="text-sm text-gray-400 flex items-center gap-1">
              <DownloadIcon className="w-3 h-3" />
              {skill.downloadCount}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-black hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border-b-2 border-gray-200">
        <CodeIcon className="w-16 h-16 text-gray-600" />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1 text-black truncate">{skill.name}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{skill.description}</p>
        
        <div className="flex items-center justify-between">
          <Rating value={skill.rating} readonly size="sm" />
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <TagIcon className="w-3 h-3" />
            v{skill.version}
          </span>
        </div>
      </div>
    </div>
  );
};
```

### 3.2 SkillList组件

```tsx
interface SkillListProps {
  skills: Skill[];
  viewMode: 'grid' | 'list';
  loading?: boolean;
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
  };
  onPageChange?: (page: number) => void;
  onSortChange?: (sort: string) => void;
}

const SkillList: React.FC<SkillListProps> = ({
  skills,
  viewMode,
  loading,
  pagination,
  onPageChange,
  onSortChange,
}) => {
  return (
    <div>
      {loading ? (
        <LoadingSpinner />
      ) : skills.length === 0 ? (
        <Empty message="暂无Skill" />
      ) : (
        <>
          <div className={cn(
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
              : 'space-y-3'
          )}>
            {skills.map((skill) => (
              <SkillCard
                key={skill._id}
                skill={skill}
                viewMode={viewMode}
                onClick={() => navigate(`/skills/${skill._id}`)}
              />
            ))}
          </div>
          
          {pagination && pagination.total > pagination.pageSize && (
            <Pagination
              current={pagination.current}
              total={pagination.total}
              pageSize={pagination.pageSize}
              onChange={onPageChange!}
            />
          )}
        </>
      )}
    </div>
  );
};
```

### 3.3 SkillForm组件

```tsx
interface SkillFormProps {
  initialData?: Partial<Skill>;
  onSubmit: (data: SkillFormData) => Promise<void>;
  onCancel: () => void;
}

interface SkillFormData {
  name: string;
  description: string;
  category: string;
  tags: string[];
  visibility: 'public' | 'enterprise' | 'private';
  files: File[];
}

const SkillForm: React.FC<SkillFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const { upload, uploading, progress } = useUpload();
  const [formData, setFormData] = useState<SkillFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    tags: initialData?.tags || [],
    visibility: initialData?.visibility || 'public',
    files: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">名称</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="请输入Skill名称"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">描述</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="详细描述您的Skill功能"
          rows={4}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">分类</label>
        <Select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          options={[
            { value: 'productivity', label: '生产力' },
            { value: 'developer', label: '开发者' },
            { value: 'ai', label: 'AI工具' },
            { value: 'other', label: '其他' },
          ]}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">标签</label>
        <InputTags
          value={formData.tags}
          onChange={(tags) => setFormData({ ...formData, tags })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">可见性</label>
        <Radio.Group
          value={formData.visibility}
          onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
        >
          <Radio value="public">公开</Radio>
          <Radio value="enterprise">企业内</Radio>
          <Radio value="private">私有</Radio>
        </Radio.Group>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">上传文件</label>
        <Upload
          accept=".js,.ts,.json,.zip"
          multiple
          onChange={(files) => setFormData({ ...formData, files })}
        />
        {uploading && <Progress value={progress} />}
      </div>

      <div className="flex gap-4">
        <Button type="submit" loading={uploading}>
          {initialData ? '更新' : '创建'}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          取消
        </Button>
      </div>
    </form>
  );
};
```

## 4. Prompt组件

### 4.1 PromptCard组件

```tsx
interface PromptCardProps {
  prompt: Prompt;
  viewMode?: 'grid' | 'list';
  onClick?: () => void;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, viewMode = 'grid', onClick }) => {
  if (viewMode === 'list') {
    return (
      <div 
        className="flex items-center p-4 bg-white border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
      >
        <div className="flex-shrink-0 w-16 h-16 bg-purple-50 rounded-lg flex items-center justify-center">
          <ChatIcon className="w-8 h-8 text-purple-400" />
        </div>
        <div className="ml-4 flex-1 min-w-0">
          <h3 className="text-lg font-medium truncate">{prompt.name}</h3>
          <p className="text-sm text-gray-500 truncate">{prompt.description}</p>
          <div className="flex items-center gap-4 mt-2">
            <Rating value={prompt.rating} readonly size="sm" />
            <span className="text-sm text-gray-400">{prompt.usageCount} 次使用</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="h-32 bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <ChatIcon className="w-16 h-16 text-purple-400" />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 truncate">{prompt.name}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{prompt.description}</p>
        
        <div className="flex items-center justify-between">
          <Rating value={prompt.rating} readonly size="sm" />
          <span className="text-xs text-gray-400">{prompt.usageCount}次使用</span>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="purple">{prompt.category}</Badge>
        </div>
      </div>
    </div>
  );
};
```

### 4.2 PromptList组件

```tsx
interface PromptListProps {
  prompts: Prompt[];
  viewMode: 'grid' | 'list';
  loading?: boolean;
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
  };
  onPageChange?: (page: number) => void;
}

const PromptList: React.FC<PromptListProps> = ({
  prompts,
  viewMode,
  loading,
  pagination,
  onPageChange,
}) => {
  return (
    <div>
      {loading ? (
        <LoadingSpinner />
      ) : prompts.length === 0 ? (
        <Empty message="暂无提示词" />
      ) : (
        <>
          <div className={cn(
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
              : 'space-y-3'
          )}>
            {prompts.map((prompt) => (
              <PromptCard
                key={prompt._id}
                prompt={prompt}
                viewMode={viewMode}
                onClick={() => navigate(`/prompts/${prompt._id}`)}
              />
            ))}
          </div>
          
          {pagination && pagination.total > pagination.pageSize && (
            <Pagination
              current={pagination.current}
              total={pagination.total}
              pageSize={pagination.pageSize}
              onChange={onPageChange!}
            />
          )}
        </>
      )}
    </div>
  );
};
```

### 4.3 PromptEditor组件

```tsx
interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  variables?: Variable[];
  onVariableInsert?: (variable: string) => void;
}

const PromptEditor: React.FC<PromptEditorProps> = ({
  value,
  onChange,
  variables = [],
  onVariableInsert,
}) => {
  const [preview, setPreview] = useState(false);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant={!preview ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setPreview(false)}
          >
            编辑
          </Button>
          <Button
            variant={preview ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setPreview(true)}
          >
            预览
          </Button>
        </div>
        
        {variables.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">变量:</span>
            {variables.map((v) => (
              <button
                key={v.name}
                className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => onVariableInsert?.(`{{${v.name}}}`)}
              >
                {v.name}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {preview ? (
        <div className="p-4 min-h-[300px] whitespace-pre-wrap">
          {value}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-[300px] p-4 outline-none resize-none font-mono text-sm"
          placeholder="输入您的提示词内容..."
        />
      )}
    </div>
  );
};
```

## 5. Agent组件

### 5.1 AgentCard组件

```tsx
interface AgentCardProps {
  agent: Agent;
  onEdit?: () => void;
  onToggleStatus?: () => void;
  onDelete?: () => void;
}

const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onEdit,
  onToggleStatus,
  onDelete,
}) => {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <BotIcon className="w-6 h-6 text-primary" />
          </div>
          <div className="ml-4">
            <h3 className="font-semibold">{agent.name}</h3>
            <p className="text-sm text-gray-500">{agent.agentId}</p>
          </div>
        </div>
        
        <Badge variant={agent.status === 'active' ? 'success' : 'secondary'}>
          {agent.status === 'active' ? '启用' : '禁用'}
        </Badge>
      </div>
      
      {agent.description && (
        <p className="mt-3 text-sm text-gray-600">{agent.description}</p>
      )}
      
      <div className="mt-4 flex flex-wrap gap-1">
        {agent.permissions.canReadPublic && (
          <Badge variant="info">公开读取</Badge>
        )}
        {agent.permissions.canReadEnterprise && (
          <Badge variant="info">企业读取</Badge>
        )}
        {agent.permissions.canDownload && (
          <Badge variant="warning">下载</Badge>
        )}
        {agent.permissions.canUpload && (
          <Badge variant="success">上传</Badge>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onEdit}>编辑</Button>
        <Button variant="ghost" size="sm" onClick={onToggleStatus}>
          {agent.status === 'active' ? '禁用' : '启用'}
        </Button>
        <Button variant="danger" size="sm" onClick={onDelete}>删除</Button>
      </div>
    </Card>
  );
};
```

### 5.2 AgentApiDoc组件

```tsx
interface ApiDoc {
  title: string;
  method: string;
  path: string;
  description: string;
  permissions: string[];
  request?: Record<string, string>;
  response?: object | string;
}

interface AgentApiDocViewerProps {
  api: ApiDoc;
}

const AgentApiDocViewer: React.FC<AgentApiDocViewerProps> = ({ api }) => {
  const methodColors: Record<string, string> = {
    GET: 'bg-blue-100 text-blue-800',
    POST: 'bg-green-100 text-green-800',
    PUT: 'bg-yellow-100 text-yellow-800',
    DELETE: 'bg-red-100 text-red-800',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className={cn('px-2 py-1 rounded text-sm font-medium', methodColors[api.method])}>
            {api.method}
          </span>
          <code className="text-sm">{api.path}</code>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-gray-600 mb-4">{api.description}</p>
        
        <div className="mb-4">
          <h4 className="font-medium mb-2">权限要求</h4>
          <div className="flex flex-wrap gap-2">
            {api.permissions.map((perm) => (
              <Badge key={perm}>{perm}</Badge>
            ))}
          </div>
        </div>
        
        {api.request && (
          <div className="mb-4">
            <h4 className="font-medium mb-2">请求参数</h4>
            <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
              {JSON.stringify(api.request, null, 2)}
            </pre>
          </div>
        )}
        
        {api.response && (
          <div>
            <h4 className="font-medium mb-2">响应示例</h4>
            <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
              {typeof api.response === 'string' ? api.response : JSON.stringify(api.response, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```
