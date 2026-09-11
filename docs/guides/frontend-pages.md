# SkillHub 前端 - 页面设计

## 1. 页面路由规划

### 1.1 完整路由表

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
| `/enterprise/:id` | 企业详情 | 企业成员 | 企业信息页面 |
| `/enterprise/:id/members` | 企业成员 | 企业成员 | 企业成员管理 |
| `/enterprise/:id/settings` | 企业设置 | enterprise_admin | 企业设置页面 |
| `/admin` | 管理后台 | admin | 管理员控制台 |
| `/admin/users` | 用户管理 | admin | 用户管理页面 |
| `/admin/content` | 内容审核 | admin | 内容审核页面 |
| `/admin/enterprises` | 企业管理 | admin | 企业管理页面 |
| `/admin/agents` | Agent管理 | admin | 智能体API管理页面 |
| `/agent-api` | Agent API文档 | enterprise_admin | Agent API文档页面 |

## 2. 认证页面

### 2.1 登录页面

```tsx
interface LoginPageProps {}

const LoginPage: React.FC<LoginPageProps> = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await authClient.post('/auth/login', { email, password });
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError('邮箱或密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">登录 SkillHub</h1>
          <p className="text-gray-600 mt-2">欢迎回来</p>
        </div>

        {error && <Alert type="error" message={error} className="mb-4" />}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              邮箱
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              密码
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>

          <div className="flex items-center justify-between mb-6">
            <Checkbox label="记住我" />
            <Link to="/forgot-password" className="text-sm text-primary">
              忘记密码?
            </Link>
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            登录
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          还没有账号? <Link to="/register" className="text-primary">立即注册</Link>
        </div>
      </div>
    </div>
  );
};
```

### 2.2 注册页面

```tsx
interface RegisterPageProps {}

const RegisterPage: React.FC<RegisterPageProps> = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await authClient.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      
      if (data.requiresVerification) {
        navigate('/verify-email', { state: { email: formData.email } });
      } else {
        login(data.user, data.token);
        navigate('/');
      }
    } catch (err) {
      setError('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">注册 SkillHub</h1>
          <p className="text-gray-600 mt-2">创建您的账号</p>
        </div>

        {error && <Alert type="error" message={error} className="mb-4" />}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium mb-2">
              用户名
            </label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="请输入用户名"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              邮箱
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="请输入邮箱"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              密码
            </label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="至少8位，包含大小写字母和数字"
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
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="再次输入密码"
              required
            />
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            注册
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          已有账号? <Link to="/login" className="text-primary">立即登录</Link>
        </div>
      </div>
    </div>
  );
};
```

### 2.3 忘记密码页面

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
    } catch (error) {
      // 始终显示成功，防止邮箱枚举
    } finally {
      setSuccess(true);
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

### 2.4 重置密码页面

```tsx
interface ResetPasswordPageProps {}

const ResetPasswordPage: React.FC<ResetPasswordPageProps> = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  
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

    setLoading(true);
    
    try {
      const { data } = await authClient.post('/auth/reset-password', {
        token,
        password,
      });
      
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError('密码重置失败，请重新尝试');
    } finally {
      setLoading(false);
    }
  };

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

### 2.5 邮箱验证页面

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

## 3. 市场页面

### 3.1 公开市场页面

**设计原则**: 黑色主色调，图标增强操作识别性，强化可操作组件存在感。

```tsx
interface PublicMarketPageProps {}

const PublicMarketPage: React.FC<PublicMarketPageProps> = () => {
  const [activeTab, setActiveTab] = useState<'skills' | 'prompts'>('skills');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchParams, setSearchParams] = useSearchParams();
  
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'popular';
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-black">公开市场</h1>
        <p className="text-gray-600">发现优质的Skill和智能体提示词</p>
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <Tabs 
          value={activeTab} 
          onChange={(tab) => setActiveTab(tab)}
          tabs={[
            { key: 'skills', label: 'Skills', icon: <CodeIcon className="w-4 h-4" /> },
            { key: 'prompts', label: '提示词', icon: <PromptIcon className="w-4 h-4" /> },
          ]}
          className="border-b-2 border-gray-200"
        />
        
        <div className="flex items-center gap-4">
          <Select
            value={sort}
            onChange={(e) => setSearchParams({ ...Object.fromEntries(searchParams), sort: e.target.value })}
            options={[
              { value: 'popular', label: '最受欢迎', icon: <TrendingUpIcon className="w-4 h-4" /> },
              { value: 'latest', label: '最新发布', icon: <ClockIcon className="w-4 h-4" /> },
              { value: 'rating', label: '最高评分', icon: <StarIcon className="w-4 h-4" /> },
            ]}
            className="border-2 border-gray-200 rounded-lg"
          />
          />
          
          <ViewToggle value={viewMode} onChange={setViewMode} />
        </div>
      </div>
      
      <div className="mb-6">
        <SearchBar 
          placeholder={`搜索${activeTab === 'skills' ? 'Skill' : '提示词'}...`}
          onSearch={(keyword) => setSearchParams({ ...Object.fromEntries(searchParams), keyword })}
        />
      </div>
      
      {activeTab === 'skills' ? (
        <SkillList viewMode={viewMode} category={category} sort={sort} />
      ) : (
        <PromptList viewMode={viewMode} category={category} sort={sort} />
      )}
    </div>
  );
};
```

### 3.2 Skill列表页面

**设计原则**: 黑色主色调，图标增强操作识别性，强化可操作组件存在感。

```tsx
interface SkillListPageProps {
  enterprise?: boolean;
}

const SkillListPage: React.FC<SkillListPageProps> = ({ enterprise = false }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { skills, loading, pagination, fetchSkills } = useSkills({
    enterprise,
  });
  
  useEffect(() => {
    fetchSkills({ page: 1 });
  }, [enterprise]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CodeIcon className="w-6 h-6 text-black" />
          <h1 className="text-2xl font-bold text-black">
            {enterprise ? '企业Skills' : '公开Skills'}
          </h1>
        </div>
        
        <ViewToggle value={viewMode} onChange={setViewMode} />
      </div>
      
      <SkillList
        viewMode={viewMode}
        skills={skills}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => fetchSkills({ page })}
        onSortChange={(sort) => fetchSkills({ sort })}
      />
    </div>
  );
};
```

## 4. 资源详情页面

### 4.1 Skill详情页面

**设计原则**: 黑色主色调，图标增强操作识别性，强化可操作组件存在感。

```tsx
interface SkillDetailPageProps {}

const SkillDetailPage: React.FC<SkillDetailPageProps> = () => {
  const { id } = useParams();
  const { skill, loading, error, fetchSkill } = useSkill(id!);
  const [activeVersion, setActiveVersion] = useState<string>('');
  
  useEffect(() => {
    fetchSkill(id!);
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <Alert type="error" message={error} />;
  if (!skill) return <Empty message="Skill不存在" />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SkillDetail
            skill={skill}
            activeVersion={activeVersion}
            onVersionChange={setActiveVersion}
          />
        </div>
        
        <div>
          <Card className="border-2 border-gray-200">
            <CardHeader className="border-b-2 border-gray-200">
              <h3 className="text-lg font-bold text-black flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                操作
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  variant="primary" 
                  className="w-full"
                  icon={<DownloadIcon className="w-4 h-4" />}
                  onClick={() => downloadSkill(skill._id)}
                >
                  下载
                </Button>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">评分</span>
                  <Rating 
                    value={skill.rating} 
                    onChange={(value) => rateSkill(skill._id, value)}
                  />
                </div>
                <Button 
                  variant="secondary" 
                  className="w-full"
                  icon={<HeartIcon className="w-4 h-4" />}
                  onClick={() => favoriteSkill(skill._id)}
                >
                  收藏
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-4 border-2 border-gray-200">
            <CardHeader className="border-b-2 border-gray-200">
              <h3 className="text-lg font-bold text-black flex items-center gap-2">
                <BarChartIcon className="w-5 h-5" />
                统计
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-1.5">
                    <DownloadIcon className="w-4 h-4" />
                    下载次数
                  </span>
                  <span className="font-bold text-black">{skill.downloadCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-1.5">
                    <StarIcon className="w-4 h-4" />
                    评分
                  </span>
                  <span className="font-bold text-black">{skill.rating.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-1.5">
                    <TagIcon className="w-4 h-4" />
                    版本
                  </span>
                  <span className="font-bold text-black">{skill.version}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
```

## 5. 创建页面

### 5.1 创建Skill页面

**设计原则**: 黑色主色调，图标增强操作识别性，强化可操作组件存在感。

```tsx
interface CreateSkillPageProps {}

const CreateSkillPage: React.FC<CreateSkillPageProps> = () => {
  const navigate = useNavigate();
  const { createSkill, uploading, progress } = useUploadSkill();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    tags: [] as string[],
    visibility: 'public' as 'public' | 'enterprise' | 'private',
    files: [] as File[],
  });
  
  const [step, setStep] = useState(1);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const skill = await createSkill(formData);
      navigate(`/skills/${skill._id}`);
    } catch (error) {
      // 处理错误
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <PlusIcon className="w-6 h-6 text-black" />
          <h1 className="text-2xl font-bold text-black">创建Skill</h1>
        </div>
        
        <Steps current={step} className="border-b-2 border-gray-200 pb-4">
          <Steps.Step title="基本信息" icon={<FileTextIcon className="w-4 h-4" />} />
          <Steps.Step title="上传文件" icon={<UploadIcon className="w-4 h-4" />} />
          <Steps.Step title="权限设置" icon={<LockIcon className="w-4 h-4" />} />
        </Steps>
        
        <form onSubmit={handleSubmit} className="mt-8">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-black">名称</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入Skill名称"
                  prefix={<EditIcon className="w-4 h-4 text-gray-400" />}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-black">描述</label>
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
              
              <Button type="button" onClick={() => setStep(2)}>
                下一步
              </Button>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">上传文件</label>
                <Upload
                  accept=".js,.ts,.json,.zip"
                  multiple
                  onChange={(files) => setFormData({ ...formData, files })}
                />
              </div>
              
              {uploading && (
                <Progress value={progress} />
              )}
              
              <div className="flex gap-4">
                <Button variant="secondary" onClick={() => setStep(1)}>
                  上一步
                </Button>
                <Button type="button" onClick={() => setStep(3)}>
                  下一步
                </Button>
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-4">
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
              
              <div className="flex gap-4">
                <Button variant="secondary" onClick={() => setStep(2)}>
                  上一步
                </Button>
                <Button type="submit" loading={uploading}>
                  创建
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
```

## 6. 个人中心页面

### 6.1 我的资源页面

```tsx
interface MyResourcesPageProps {}

const MyResourcesPage: React.FC<MyResourcesPageProps> = () => {
  const [activeTab, setActiveTab] = useState<'skills' | 'prompts'>('skills');
  const { user, loading } = useUserResources();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">我的资源</h1>
      
      <Tabs 
        value={activeTab} 
        onChange={(tab) => setActiveTab(tab)}
        tabs={[
          { key: 'skills', label: `我的Skills (${user?.skillsCount || 0})` },
          { key: 'prompts', label: `我的提示词 (${user?.promptsCount || 0})` },
        ]}
      />
      
      <div className="mt-6">
        {activeTab === 'skills' ? (
          <UserSkillList userId={user?.id} />
        ) : (
          <UserPromptList userId={user?.id} />
        )}
      </div>
    </div>
  );
};
```

## 7. 管理后台页面

### 7.1 管理员仪表盘

```tsx
interface AdminDashboardPageProps {}

const AdminDashboardPage: React.FC<AdminDashboardPageProps> = () => {
  const { stats, loading, refreshStats } = useAdminStats();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">管理后台</h1>
        <Button onClick={refreshStats}>刷新</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="用户总数"
          value={stats.totalUsers}
          icon={<UserIcon />}
          trend={stats.usersTrend}
        />
        <StatCard
          title="企业总数"
          value={stats.totalEnterprises}
          icon={<BuildingIcon />}
        />
        <StatCard
          title="Skill总数"
          value={stats.totalSkills}
          icon={<CodeIcon />}
        />
        <StatCard
          title="待审核"
          value={stats.pendingReview}
          icon={<AlertIcon />}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>最近注册用户</CardHeader>
          <CardContent>
            <RecentUsersList users={stats.recentUsers} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>待审核内容</CardHeader>
          <CardContent>
            <PendingContentList items={stats.pendingContent} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
```

### 7.2 Agent管理页面

```tsx
interface AgentManagementPageProps {}

const AgentManagementPage: React.FC<AgentManagementPageProps> = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const { agents, loading, fetchAgents, createAgent, updateAgent, deleteAgent } = useAgents();

  const handleCreate = async (data: AgentFormData) => {
    await createAgent(data);
    setModalVisible(false);
  };

  const handleEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    setModalVisible(true);
  };

  const handleToggleStatus = async (agent: Agent) => {
    await updateAgent(agent._id, { 
      status: agent.status === 'active' ? 'inactive' : 'active' 
    });
  };

  const handleDelete = async (agent: Agent) => {
    if (confirm(`确定要删除Agent "${agent.name}" 吗?`)) {
      await deleteAgent(agent._id);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Agent管理</h1>
        <Button onClick={() => setModalVisible(true)}>创建Agent</Button>
      </div>

      <Card>
        <Table
          columns={[
            { key: 'name', title: '名称', width: '20%' },
            { key: 'enterprise', title: '所属企业', width: '15%' },
            { key: 'permissions', title: '权限', width: '25%' },
            { key: 'status', title: '状态', width: '10%' },
            { key: 'lastAccess', title: '最后访问', width: '15%' },
            { key: 'actions', title: '操作', width: '15%' },
          ]}
          data={agents}
          loading={loading}
        >
          {(agent) => (
            <>
              <td>
                <div className="font-medium">{agent.name}</div>
                <div className="text-sm text-gray-500">{agent.agentId}</div>
              </td>
              <td>{agent.enterpriseId ? '已绑定企业' : '公共'}</td>
              <td>
                <div className="flex flex-wrap gap-1">
                  {agent.permissions.canReadPublic && <Badge>公开</Badge>}
                  {agent.permissions.canReadEnterprise && <Badge>企业</Badge>}
                  {agent.permissions.canDownload && <Badge>下载</Badge>}
                  {agent.permissions.canUpload && <Badge>上传</Badge>}
                </div>
              </td>
              <td>
                <Badge variant={agent.status === 'active' ? 'success' : 'secondary'}>
                  {agent.status === 'active' ? '启用' : '禁用'}
                </Badge>
              </td>
              <td>{agent.lastAccessAt ? new Date(agent.lastAccessAt).toLocaleString() : '从未'}</td>
              <td>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(agent)}>编辑</Button>
                <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(agent)}>
                  {agent.status === 'active' ? '禁用' : '启用'}
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(agent)}>删除</Button>
              </td>
            </>
          )}
        </Table>
      </Card>

      <Modal
        open={modalVisible}
        onClose={() => { setModalVisible(false); setSelectedAgent(null); }}
        title={selectedAgent ? '编辑Agent' : '创建Agent'}
      >
        <AgentForm
          initialData={selectedAgent || undefined}
          onSubmit={handleCreate}
          onCancel={() => { setModalVisible(false); setSelectedAgent(null); }}
        />
      </Modal>
    </div>
  );
};
```

## 8. Agent API文档页面

### 8.1 Agent API文档

```tsx
interface AgentApiDocPageProps {}

const AgentApiDocPage: React.FC<AgentApiDocPageProps> = () => {
  const [selectedApi, setSelectedApi] = useState<ApiDoc | null>(null);
  const { enterprise } = useCurrentEnterprise();
  
  const apiDocs: ApiDoc[] = [
    {
      title: '获取公开Skill列表',
      method: 'GET',
      path: '/api/agent/skills',
      description: '获取所有公开的Skill列表',
      permissions: ['canReadPublic'],
      response: {
        skills: [],
        pagination: {},
      },
    },
    {
      title: '获取企业Skill列表',
      method: 'GET',
      path: '/api/agent/enterprise/skills',
      description: '获取企业内部的Skill列表',
      permissions: ['canReadEnterprise'],
      response: {
        skills: [],
        pagination: {},
      },
    },
    {
      title: '下载Skill',
      method: 'GET',
      path: '/api/agent/skills/:id/download',
      description: '下载指定Skill的文件',
      permissions: ['canDownload'],
      response: 'file binary',
    },
    {
      title: '上传Skill',
      method: 'POST',
      path: '/api/agent/skills',
      description: '上传新的Skill到企业市场',
      permissions: ['canUpload'],
      request: {
        name: 'string',
        description: 'string',
        files: 'file[]',
      },
      response: {
        skill: {},
      },
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Agent API 文档</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>API列表</CardHeader>
            <CardContent>
              <div className="space-y-2">
                {apiDocs.map((api) => (
                  <div
                    key={api.path}
                    className={cn(
                      'p-3 rounded-lg cursor-pointer transition-colors',
                      selectedApi?.path === api.path 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-gray-50'
                    )}
                    onClick={() => setSelectedApi(api)}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant={api.method === 'GET' ? 'info' : 'success'}>
                        {api.method}
                      </Badge>
                      <span className="text-sm truncate">{api.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          {selectedApi ? (
            <ApiDocViewer api={selectedApi} />
          ) : (
            <div className="text-center text-gray-500 py-12">
              请选择一个API查看详情
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```
