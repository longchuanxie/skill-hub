import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import Layout from '../components/Layout';
import { skillApi, promptApi } from '../api/market';

const UploadPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('skill');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [skillForm, setSkillForm] = useState({
    name: '',
    description: '',
    version: '1.0.0',
    category: 'coding',
    visibility: 'private',
    status: 'draft',
    content: '',
    tags: '',
  });
  const [skillFile, setSkillFile] = useState<File | undefined>(undefined);

  const [promptForm, setPromptForm] = useState({
    name: '',
    description: '',
    category: 'general',
    visibility: 'private',
    status: 'draft',
    content: '',
    tags: '',
  });

  const handleSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!skillForm.name.trim() || !skillForm.description.trim() || !skillForm.content.trim()) {
      setError(t('upload.error.requiredFields'));
      return;
    }

    // 如果设置为 public，必须有文件
    if (skillForm.visibility === 'public' && !skillFile) {
      setError(t('errors.publicSkillRequiresFile'));
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await skillApi.createSkill({
        name: skillForm.name,
        description: skillForm.description,
        version: skillForm.version,
        category: skillForm.category,
        visibility: skillForm.visibility,
        status: skillForm.status,
        content: skillForm.content,
        tags: skillForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
        file: skillFile,
      });
      setSuccess(t('upload.success'));
      setSkillForm({
        name: '',
        description: '',
        version: '1.0.0',
        category: 'coding',
        visibility: 'private',
        status: 'draft',
        content: '',
        tags: '',
      });
      setSkillFile(undefined);
      setTimeout(() => navigate('/my/resources'), 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; message?: string } } };
      // 根据后端返回的错误码显示对应的国际化错误信息
      const errorCode = error.response?.data?.error;
      if (errorCode === 'PUBLIC_SKILL_REQUIRES_FILE') {
        setError(t('errors.publicSkillRequiresFile'));
      } else if (errorCode === 'INVALID_FILE_TYPE') {
        setError(t('errors.invalidFileType') || 'Only ZIP files are allowed');
      } else if (errorCode === 'INVALID_SKILL_STRUCTURE') {
        setError(t('errors.invalidSkillStructure') || 'Invalid skill structure');
      } else {
        setError(error.response?.data?.message || t('upload.error.uploadFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!promptForm.name.trim() || !promptForm.description.trim() || !promptForm.content.trim()) {
      setError(t('upload.error.requiredFields'));
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await promptApi.createPrompt({
        name: promptForm.name,
        description: promptForm.description,
        category: promptForm.category,
        visibility: promptForm.visibility,
        status: promptForm.status,
        content: promptForm.content,
        tags: promptForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      setSuccess(t('upload.success'));
      setPromptForm({
        name: '',
        description: '',
        category: 'general',
        visibility: 'private',
        status: 'draft',
        content: '',
        tags: '',
      });
      setTimeout(() => navigate('/my/resources'), 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || t('upload.error.uploadFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">


        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-2xl mx-auto mb-8">
          <TabsList className="flex flex-row gap-2 justify-center w-full bg-muted rounded-lg p-1">
            <TabsTrigger 
              value="skill" 
              className="flex items-center gap-2 px-4 py-2 text-sm data-[state=active]:bg-black data-[state=active]:text-white rounded-lg transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              {t('upload.skill')}
            </TabsTrigger>
            <TabsTrigger 
              value="prompt"
              className="flex items-center gap-2 px-4 py-2 text-sm data-[state=active]:bg-black data-[state=active]:text-white rounded-lg transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {t('upload.prompt')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="skill">
            <form onSubmit={handleSkillSubmit} className="space-y-6 max-w-2xl mx-auto" noValidate>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 text-green-700 rounded-lg flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {success}
                </div>
              )}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  {t('upload.skillDetails') || 'Skill Details'}
                </h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {t('upload.name')}
                    </label>
                    <Input
                      value={skillForm.name}
                      onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                      placeholder={t('upload.placeholder.name')}
                      required
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {t('upload.description') || 'Description'}
                    </label>
                    <Textarea
                      value={skillForm.description}
                      onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })}
                      placeholder={t('upload.placeholder.description') || 'Describe your skill'}
                      required
                      rows={3}
                      className="w-full border-2 border-gray-200 focus:border-black"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {t('upload.version') || 'Version'}
                      </label>
                      <Input
                        value={skillForm.version}
                        onChange={(e) => setSkillForm({ ...skillForm, version: e.target.value })}
                        placeholder={t('upload.placeholder.version') || '1.0.0'}
                        required
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        {t('upload.category') || 'Category'}
                      </label>
                      <Select value={skillForm.category} onValueChange={(value) => setSkillForm({ ...skillForm, category: value })}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t('upload.placeholder.category') || 'Select category'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="coding">{t('upload.categories.coding') || '编程开发'}</SelectItem>
                          <SelectItem value="writing">{t('upload.categories.writing') || '写作创作'}</SelectItem>
                          <SelectItem value="design">{t('upload.categories.design') || '设计创意'}</SelectItem>
                          <SelectItem value="marketing">{t('upload.categories.marketing') || '市场营销'}</SelectItem>
                          <SelectItem value="data-analysis">{t('upload.categories.dataAnalysis') || '数据分析'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {t('upload.visibility') || 'Visibility'}
                      </label>
                      <Select value={skillForm.visibility} onValueChange={(value) => setSkillForm({ ...skillForm, visibility: value })}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t('upload.placeholder.visibility') || 'Select visibility'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">{t('upload.visibilityOptions.private') || '私有'}</SelectItem>
                          <SelectItem value="public">{t('upload.visibilityOptions.public') || '公开'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t('upload.status') || 'Status'}
                      </label>
                      <Select value={skillForm.status} onValueChange={(value) => setSkillForm({ ...skillForm, status: value })}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t('upload.placeholder.status') || 'Select status'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">{t('upload.statusOptions.draft') || '草稿'}</SelectItem>
                          <SelectItem value="pending">{t('upload.statusOptions.pending') || '待审核'}</SelectItem>
                          <SelectItem value="approved">{t('upload.statusOptions.approved') || '已通过'}</SelectItem>
                          <SelectItem value="rejected">{t('upload.statusOptions.rejected') || '已拒绝'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  {t('upload.skillContent') || 'Skill Content'}
                </h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      {t('upload.content') || 'Content'}
                    </label>
                    <Textarea
                      value={skillForm.content}
                      onChange={(e) => setSkillForm({ ...skillForm, content: e.target.value })}
                      placeholder={t('upload.placeholder.content') || 'Skill content or code'}
                      required
                      rows={10}
                      className="w-full border-2 border-gray-200 focus:border-black font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {t('upload.tags') || 'Tags (comma separated)'}
                    </label>
                    <Input
                      value={skillForm.tags}
                      onChange={(e) => setSkillForm({ ...skillForm, tags: e.target.value })}
                      placeholder={t('upload.placeholder.tags') || 'tag1, tag2, tag3'}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      {t('upload.skillFile') || 'Skill File (ZIP)'} {skillForm.visibility === 'public' && <span className="text-red-500">*</span>}
                    </label>
                    <Input
                      type="file"
                      accept=".zip"
                      onChange={(e) => setSkillFile(e.target.files?.[0])}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {skillForm.visibility === 'public'
                        ? t('upload.skillFileRequiredForPublic') || 'Public skills must upload a ZIP file'
                        : t('upload.skillFileOptional') || 'Optional: Upload a ZIP file containing your skill package (required for public skills)'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-8">
                <Button type="submit" disabled={loading} className="flex items-center gap-2 px-8 py-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {loading ? (t('upload.uploading') || 'Uploading...') : (t('upload.uploadSkill') || 'Upload Skill')}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="prompt">
            <form onSubmit={handlePromptSubmit} className="space-y-6 max-w-2xl mx-auto" noValidate>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 text-green-700 rounded-lg flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {success}
                </div>
              )}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  {t('upload.promptDetails') || 'Prompt Details'}
                </h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {t('upload.name')}
                    </label>
                    <Input
                      value={promptForm.name}
                      onChange={(e) => setPromptForm({ ...promptForm, name: e.target.value })}
                      placeholder={t('upload.placeholder.name')}
                      required
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {t('upload.description') || 'Description'}
                    </label>
                    <Textarea
                      value={promptForm.description}
                      onChange={(e) => setPromptForm({ ...promptForm, description: e.target.value })}
                      placeholder={t('upload.placeholder.description') || 'Describe your prompt'}
                      required
                      rows={3}
                      className="w-full border-2 border-gray-200 focus:border-black"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        {t('upload.category') || 'Category'}
                      </label>
                      <Select value={promptForm.category} onValueChange={(value) => setPromptForm({ ...promptForm, category: value })}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t('upload.placeholder.category') || 'Select category'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">{t('upload.categories.general') || '通用'}</SelectItem>
                          <SelectItem value="coding">{t('upload.categories.coding') || '编程开发'}</SelectItem>
                          <SelectItem value="writing">{t('upload.categories.writing') || '写作创作'}</SelectItem>
                          <SelectItem value="creative">{t('upload.categories.creative') || '创意设计'}</SelectItem>
                          <SelectItem value="analysis">{t('upload.categories.analysis') || '分析'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {t('upload.visibility') || 'Visibility'}
                      </label>
                      <Select value={promptForm.visibility} onValueChange={(value) => setPromptForm({ ...promptForm, visibility: value })}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t('upload.placeholder.visibility') || 'Select visibility'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">{t('upload.visibilityOptions.private') || '私有'}</SelectItem>
                          <SelectItem value="public">{t('upload.visibilityOptions.public') || '公开'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t('upload.status') || 'Status'}
                    </label>
                    <Select value={promptForm.status} onValueChange={(value) => setPromptForm({ ...promptForm, status: value })}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('upload.placeholder.status') || 'Select status'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">{t('upload.statusOptions.draft') || '草稿'}</SelectItem>
                        <SelectItem value="pending">{t('upload.statusOptions.pending') || '待审核'}</SelectItem>
                        <SelectItem value="approved">{t('upload.statusOptions.approved') || '已通过'}</SelectItem>
                        <SelectItem value="rejected">{t('upload.statusOptions.rejected') || '已拒绝'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  {t('upload.promptContent') || 'Prompt Content'}
                </h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      {t('upload.content') || 'Content'}
                    </label>
                    <Textarea
                      value={promptForm.content}
                      onChange={(e) => setPromptForm({ ...promptForm, content: e.target.value })}
                      placeholder={t('upload.placeholder.content') || 'Prompt content'}
                      required
                      rows={10}
                      className="w-full border-2 border-gray-200 focus:border-black font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {t('upload.tags') || 'Tags (comma separated)'}
                    </label>
                    <Input
                      value={promptForm.tags}
                      onChange={(e) => setPromptForm({ ...promptForm, tags: e.target.value })}
                      placeholder={t('upload.placeholder.tags') || 'tag1, tag2, tag3'}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-8">
                <Button type="submit" disabled={loading} className="flex items-center gap-2 px-8 py-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {loading ? (t('upload.uploading') || 'Uploading...') : (t('upload.uploadPrompt') || 'Upload Prompt')}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default UploadPage;
