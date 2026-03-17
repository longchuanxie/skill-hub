import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Layout from '../components/Layout';
import ViewToggle from '../components/ViewToggle';
import SkillCard from '../components/SkillCard';
import SkillList from '../components/SkillList';
import PromptCard from '../components/PromptCard';
import PromptList from '../components/PromptList';
import { skillApi, promptApi, Skill, Prompt } from '../api/market';
import { useAuthStore } from '../stores/authStore';

const MyResourcesPage: React.FC = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState('skills');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  useEffect(() => {
    fetchMyResources();
  }, [activeTab]);

  const fetchMyResources = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'skills') {
        const data = await skillApi.getSkills({ page: 1, pageSize: 50 });
        const mySkills = data.skills.filter((s) => s.owner?._id === user?.id);
        setSkills(mySkills);
      } else {
        const data = await promptApi.getPrompts({ page: 1, pageSize: 50 });
        const myPrompts = data.prompts.filter((p) => p.owner?._id === user?.id);
        setPrompts(myPrompts);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || t('myResources.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <h1 className="text-3xl font-bold text-black">{t('myResources.title')}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <ViewToggle viewMode={viewMode} onChange={setViewMode} />
            <Link to="/upload">
              <Button className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {t('myResources.uploadNew')}
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 border-2 border-red-200 bg-red-50">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </div>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-100 p-1 rounded-lg">
            <TabsTrigger
              value="skills"
              className="flex items-center gap-2 data-[state=active]:bg-black data-[state=active]:text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              {t('myResources.skills')} ({skills.length})
            </TabsTrigger>
            <TabsTrigger
              value="prompts"
              className="flex items-center gap-2 data-[state=active]:bg-black data-[state=active]:text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {t('myResources.prompts')} ({prompts.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="skills" className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black"></div>
              </div>
            ) : skills.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-gray-200">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <p className="text-gray-600 text-lg mb-2">{t('myResources.noSkills')}</p>
                <p className="text-gray-400 mb-6">{t('myResources.shareSkills')}</p>
              </div>
            ) : (
              <>
                {viewMode === 'card' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {skills.map((skill) => (
                      <SkillCard key={skill._id} skill={skill} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {skills.map((skill) => (
                      <SkillList key={skill._id} skill={skill} />
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="prompts" className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black"></div>
              </div>
            ) : prompts.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-gray-200">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-gray-600 text-lg mb-2">{t('myResources.noPrompts')}</p>
                <p className="text-gray-400 mb-6">{t('myResources.sharePrompts')}</p>
              </div>
            ) : (
              <>
                {viewMode === 'card' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {prompts.map((prompt) => (
                      <PromptCard key={prompt._id} prompt={prompt} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {prompts.map((prompt) => (
                      <PromptList key={prompt._id} prompt={prompt} />
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default MyResourcesPage;
