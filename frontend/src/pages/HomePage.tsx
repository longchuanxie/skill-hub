import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { homeApi, HomeStats } from '../api/market';
import CommunityTrends from '../components/CommunityTrends';
import { RecommendationSection } from '../components/recommendation/RecommendationSection';

const HomePage = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<HomeStats>({
    skills: 1000,
    prompts: 5000,
    users: 10000,
    downloads: 50000
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await homeApi.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch home stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(0)}万+`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}千+`;
    }
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-12 sm:mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-black rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black">
              SkillHub
            </h1>
          </div>
          <p className="text-base sm:text-xl text-gray-600 mb-6 sm:mb-8 px-4">
            {t('home.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link to="/skills" className="w-full sm:w-auto">
              <Button size="lg" className="w-full flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                {t('home.browseSkills')}
              </Button>
            </Link>
            <Link to="/prompts" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {t('home.browsePrompts')}
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          <Card className="hover:border-black transition-colors hover:shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-black mb-3">{t('home.discoverResources')}</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                {t('home.discoverResourcesDesc')}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-black transition-colors hover:shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-black mb-3">{t('home.shareKnowledge')}</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                {t('home.shareKnowledgeDesc')}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-black transition-colors hover:shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7m0 0v7l9-11h-7" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-black mb-3">{t('home.collaborate')}</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                {t('home.collaborateDesc')}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-12 sm:mb-16">
          <CommunityTrends />
        </div>

        <div className="mb-12 sm:mb-16">
          <RecommendationSection
            title="热门技能"
            type="popular"
            resourceType="skill"
            limit={4}
          />
        </div>

        <div className="mb-12 sm:mb-16">
          <RecommendationSection
            title="热门提示词"
            type="popular"
            resourceType="prompt"
            limit={4}
          />
        </div>

        <div className="mb-12 sm:mb-16">
          <RecommendationSection
            title="新品推荐"
            type="new"
            resourceType="skill"
            limit={4}
          />
        </div>

        <div className="bg-gradient-to-r from-black to-gray-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-12 mb-12 sm:mb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-6 text-center px-4">
              {t('home.whyChooseUs')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-white mb-2">{t('home.highQuality')}</h4>
                  <p className="text-sm sm:text-base text-gray-300">
                    {t('home.highQualityDesc')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-white mb-2">{t('home.activeCommunity')}</h4>
                  <p className="text-sm sm:text-base text-gray-300">
                    {t('home.activeCommunityDesc')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-white mb-2">{t('home.easyToUse')}</h4>
                  <p className="text-sm sm:text-base text-gray-300">
                    {t('home.easyToUseDesc')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-white mb-2">{t('home.freeAndOpen')}</h4>
                  <p className="text-sm sm:text-base text-gray-300">
                    {t('home.freeAndOpenDesc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-4">
            {t('home.getStarted')}
          </h2>
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 px-4">
            {t('home.joinCommunity')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                {t('home.freeRegister')}
              </Button>
            </Link>
            <Link to="/skills" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7m0 0v7l9-11h-7" />
                </svg>
                {t('home.browseResources')}
              </Button>
            </Link>
          </div>
        </div>

        <div className="border-t-2 border-gray-200 pt-8 sm:pt-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-black mb-2">
                {loading ? '...' : formatNumber(stats.skills)}
              </div>
              <div className="text-gray-600">{t('home.stats.skills')}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-black mb-2">
                {loading ? '...' : formatNumber(stats.prompts)}
              </div>
              <div className="text-gray-600">{t('home.stats.prompts')}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-black mb-2">
                {loading ? '...' : formatNumber(stats.users)}
              </div>
              <div className="text-gray-600">{t('home.stats.users')}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-black mb-2">
                {loading ? '...' : formatNumber(stats.downloads)}
              </div>
              <div className="text-gray-600">{t('home.stats.downloads')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;