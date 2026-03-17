import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Layout from '../components/Layout';
import { promptApi } from '../api/market';
import { useAuthStore } from '../stores/authStore';

interface Prompt {
  _id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  tags: string[];
  visibility: string;
  status: string;
  version: string;
  variables: Array<{
    name: string;
    type: string;
    required: boolean;
    defaultValue?: string;
    description?: string;
  }>;
}

const PromptEditPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    content: '',
    version: '',
    category: 'creative',
    tags: '',
    visibility: 'private',
    status: 'draft',
  });

  useEffect(() => {
    const fetchPrompt = async () => {
      if (!id) return;
      try {
        const response = await promptApi.getPromptById(id);
        const prompt = response as unknown as Prompt;
        setForm({
          name: prompt.name,
          description: prompt.description,
          content: prompt.content,
          version: prompt.version,
          category: prompt.category,
          tags: prompt.tags.join(', '),
          visibility: prompt.visibility,
          status: prompt.status,
        });
      } catch (err) {
        setError(t('prompts.error.loadFailed'));
      } finally {
        setLoading(false);
      }
    };
    fetchPrompt();
  }, [id, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await fetch(`/api/prompts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          content: form.content,
          version: form.version,
          category: form.category,
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
          visibility: form.visibility,
          status: form.status,
        }),
      });
      setSuccess(t('edit.success'));
      setTimeout(() => navigate(`/prompts/${id}`), 1500);
    } catch (err) {
      setError(t('edit.error.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => navigate(`/prompts/${id}`)} className="mb-6 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('prompts.backToPrompts')}
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <h1 className="text-3xl font-bold text-black">{t('prompts.editPrompt')}</h1>
        </div>

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

        <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {t('prompts.promptName')}
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t('upload.placeholder.name')}
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t('prompts.description')}
            </label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t('upload.placeholder.description')}
              required
              rows={3}
              className="border-2 border-gray-200 focus:border-black"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t('prompts.promptContent')}
            </label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder={t('upload.placeholder.content')}
              required
              rows={6}
              className="border-2 border-gray-200 focus:border-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {t('upload.version')}
              </label>
              <Input
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                placeholder={t('upload.placeholder.version')}
                required
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                {t('upload.category')}
              </label>
              <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('upload.placeholder.category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="creative">{t('prompts.categories.creative')}</SelectItem>
                  <SelectItem value="technical">{t('prompts.categories.technical')}</SelectItem>
                  <SelectItem value="business">{t('prompts.categories.business')}</SelectItem>
                  <SelectItem value="education">{t('prompts.categories.education')}</SelectItem>
                  <SelectItem value="entertainment">{t('prompts.categories.entertainment')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {t('upload.visibility')}
            </label>
            <Select value={form.visibility} onValueChange={(value) => setForm({ ...form, visibility: value })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('upload.placeholder.visibility')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">{t('upload.visibilityOptions.private')}</SelectItem>
                <SelectItem value="public">{t('upload.visibilityOptions.public')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('upload.status')}
            </label>
            <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('upload.placeholder.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{t('upload.statusOptions.draft')}</SelectItem>
                <SelectItem value="pending">{t('upload.statusOptions.pending')}</SelectItem>
                <SelectItem value="approved">{t('upload.statusOptions.approved')}</SelectItem>
                <SelectItem value="rejected">{t('upload.statusOptions.rejected')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {t('upload.tags')}
            </label>
            <Input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder={t('upload.placeholder.tags')}
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={saving} className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {saving ? t('edit.saving') : t('edit.save')}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(`/prompts/${id}`)}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default PromptEditPage;