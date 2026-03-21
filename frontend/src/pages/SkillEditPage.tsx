import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Layout from '../components/Layout';
import { skillApi } from '../api/market';
import { useAuthStore } from '../stores/authStore';

interface Skill {
  _id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  tags: string[];
  visibility: string;
  status: string;
  files: Array<{
    filename: string;
    originalName: string;
    path: string;
    size: number;
    mimetype: string;
  }>;
}

const SkillEditPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [skillFile, setSkillFile] = useState<File | undefined>(undefined);

  const [form, setForm] = useState({
    name: '',
    description: '',
    updateDescription: '',
    category: 'coding',
    tags: '',
    visibility: 'private',
    status: 'draft',
  });

  useEffect(() => {
    const fetchSkill = async () => {
      if (!id) return;
      try {
        const response = await skillApi.getSkillById(id);
        const skill = response as unknown as Skill;
        setForm({
          name: skill.name,
          description: skill.description,
          updateDescription: '',
          category: skill.category,
          tags: skill.tags.join(', '),
          visibility: skill.visibility,
          status: skill.status,
        });
      } catch (err) {
        setError(t('edit.error.loadFailed'));
      } finally {
        setLoading(false);
      }
    };
    fetchSkill();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await skillApi.updateSkill(id, {
        name: form.name,
        description: form.description,
        updateDescription: form.updateDescription,
        category: form.category,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        visibility: form.visibility,
        status: form.status,
        file: skillFile,
      });
      setSuccess(t('edit.success'));
      setTimeout(() => navigate(`/skills/${id}`), 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; message?: string } } };
      const errorCode = error.response?.data?.error;
      if (errorCode === 'PUBLIC_SKILL_REQUIRES_FILE') {
        setError(t('errors.publicSkillRequiresFile'));
      } else if (errorCode === 'INVALID_FILE_TYPE') {
        setError(t('errors.invalidFileType') || 'Only ZIP files are allowed');
      } else if (errorCode === 'INVALID_SKILL_STRUCTURE') {
        setError(t('errors.invalidSkillStructure') || 'Invalid skill structure');
      } else {
        setError(error.response?.data?.message || t('edit.error.updateFailed'));
      }
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
        <Button variant="outline" onClick={() => navigate(`/skills/${id}`)} className="mb-6 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('skills.backToSkills')}
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <h1 className="text-3xl font-bold text-black">{t('skills.editSkill')}</h1>
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
              {t('skills.skillName')}
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
              {t('skills.description')}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('upload.updateDescription')}
              </label>
              <Input
                value={form.updateDescription}
                onChange={(e) => setForm({ ...form, updateDescription: e.target.value })}
                placeholder={t('upload.placeholder.updateDescription')}
                required
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                {t('skills.category')}
              </label>
              <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('skills.allCategories')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coding">{t('upload.categories.coding')}</SelectItem>
                  <SelectItem value="writing">{t('upload.categories.writing')}</SelectItem>
                  <SelectItem value="design">{t('upload.categories.design')}</SelectItem>
                  <SelectItem value="marketing">{t('upload.categories.marketing')}</SelectItem>
                  <SelectItem value="data-analysis">{t('upload.categories.dataAnalysis')}</SelectItem>
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
              {t('skills.visibility')}
            </label>
            <Select value={form.visibility} onValueChange={(value) => setForm({ ...form, visibility: value })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select visibility" />
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
                <SelectValue placeholder="Select status" />
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
              {t('skills.tags')}
            </label>
            <Input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder={t('upload.placeholder.tags')}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {t('upload.skillFile')} (ZIP)
            </label>
            <Input
              type="file"
              accept=".zip"
              onChange={(e) => setSkillFile(e.target.files?.[0])}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('upload.skillFileOptional')}
            </p>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={saving} className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {saving ? t('common.loading') : t('edit.save')}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(`/skills/${id}`)}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default SkillEditPage;
