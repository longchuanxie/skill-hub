import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';
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
  owner: {
    _id: string;
    username: string;
    avatar?: string;
  };
  usageCount: number;
  averageRating: number;
  status: string;
  visibility: string;
  version: string;
  variables: Array<{
    name: string;
    type: string;
    required: boolean;
    defaultValue?: string;
    description?: string;
  }>;
  createdAt: string;
}

const PromptDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    const fetchPrompt = async () => {
      if (!id) return;
      try {
        const response = await promptApi.getPromptById(id);
        setPrompt(response as unknown as Prompt);
      } catch (err) {
        setError(t('prompts.error.loadFailed'));
      } finally {
        setLoading(false);
      }
    };
    fetchPrompt();
  }, [id]);

  const handleCopy = async () => {
    if (!prompt) return;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(prompt.content);
      if (prompt) {
        setPrompt({ ...prompt, usageCount: prompt.usageCount + 1 });
      }
    } catch (err) {
      setError('Failed to copy prompt');
    } finally {
      setCopying(false);
    }
  };

  const isOwner = user && prompt && user.id === prompt.owner?._id;

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <svg
          key={i}
          className={`w-4 h-4 ${i <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    return stars;
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

  if (error || !prompt) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-red-600 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-lg font-medium">{error || t('prompts.error.notFound')}</span>
            </div>
          </div>
          <div className="text-center mt-4">
            <Button onClick={() => navigate('/prompts')} className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t('prompts.backToPrompts')}
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => navigate('/prompts')} className="mb-6 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('prompts.backToPrompts')}
        </Button>

        <Card className="border-2 border-gray-200">
          <CardHeader className="border-b-2 border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <CardTitle className="text-2xl text-black">{prompt.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-black text-white">v{prompt.version}</Badge>
                  <Badge variant="outline" className="border-2 border-gray-300">{prompt.category}</Badge>
                  <Badge variant={prompt.status === 'approved' ? 'default' : 'secondary'} className={prompt.status === 'approved' ? 'bg-green-600' : ''}>
                    {prompt.status}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                {isOwner && (
                  <>
                    <Button variant="outline" onClick={() => navigate(`/prompts/${prompt._id}/edit`)} className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      {t('prompts.edit')}
                    </Button>
                    <Button variant="outline" onClick={() => navigate(`/prompts/${prompt._id}/versions`)} className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t('prompts.versionHistory')}
                    </Button>
                  </>
                )}
                <Button onClick={handleCopy} disabled={copying} className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {copying ? t('prompts.copying') : t('prompts.copyPrompt')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <Avatar className="h-10 w-10 border-2 border-gray-200">
                {prompt.owner?.avatar ? (
                  <img src={prompt.owner.avatar} alt={prompt.owner?.username || ''} className="w-full h-full object-cover" />
                ) : null}
                <AvatarFallback className="bg-black text-white">{prompt.owner?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-black">{prompt.owner?.username || 'Unknown'}</span>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {prompt.usageCount} {t('prompts.uses')}
              </span>
              {prompt.averageRating > 0 && (
                <>
                  <span className="text-gray-300">|</span>
                  <div className="flex items-center gap-1">
                    <div className="flex">{renderStars(prompt.averageRating)}</div>
                    <span className="text-sm text-gray-600 font-medium">({prompt.averageRating.toFixed(1)})</span>
                  </div>
                </>
              )}
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(prompt.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('prompts.description')}
              </h3>
              <p className="text-gray-600 leading-relaxed">{prompt.description}</p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {t('prompts.tags')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {prompt.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg border-2 border-gray-200"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {prompt.variables && prompt.variables.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                  {t('prompts.variables')}
                </h3>
                <div className="space-y-2">
                  {prompt.variables.map((variable, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                      <Badge variant="outline" className="border-2 border-gray-300">{variable.name}</Badge>
                      <span className="text-gray-500">({variable.type})</span>
                      {variable.required && (
                        <span className="text-red-500 font-medium">{t('prompts.required')}</span>
                      )}
                      {variable.defaultValue && (
                        <span className="text-gray-400">{t('prompts.default')}{variable.defaultValue}</span>
                      )}
                      {variable.description && (
                        <span className="text-gray-500">- {variable.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('prompts.promptContent')}
              </h3>
              <pre className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200 overflow-x-auto text-sm whitespace-pre-wrap text-gray-700">
                {prompt.content}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PromptDetailPage;
