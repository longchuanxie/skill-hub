import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { trendsApi, TrendItem } from '../api/market';

type TrendType = 'skills' | 'prompts' | 'combined';
type SortOption = 'popular' | 'latest' | 'rating';

const CommunityTrends = () => {
  const [activeTab, setActiveTab] = useState<TrendType>('combined');
  const [sortOption, setSortOption] = useState<SortOption>('popular');
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrends();
  }, [activeTab, sortOption]);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[CommunityTrends] Fetching trends with params:', {
        type: activeTab,
        sort: sortOption,
        limit: 10,
        timeRange: 'week'
      });
      
      const response = await trendsApi.getTrends({
        type: activeTab,
        sort: sortOption,
        limit: 10,
        timeRange: 'week'
      });
      
      console.log('[CommunityTrends] Response received:', response);
      
      if (response.success) {
        console.log('[CommunityTrends] Setting trends data for tab:', activeTab, 'data:', response.data[activeTab]);
        setTrends(response.data[activeTab]);
      } else {
        console.error('[CommunityTrends] Response success is false');
        setError('加载趋势数据失败');
      }
    } catch (err) {
      console.error('[CommunityTrends] Failed to fetch trends:', err);
      setError('加载趋势数据失败');
    } finally {
      setLoading(false);
    }
  };

  const tabs: { key: TrendType; label: string }[] = [
    { key: 'combined', label: '综合' },
    { key: 'skills', label: '技能' },
    { key: 'prompts', label: '提示词' }
  ];

  const sortOptions: { key: SortOption; label: string }[] = [
    { key: 'popular', label: '热门' },
    { key: 'latest', label: '最新' },
    { key: 'rating', label: '评分最高' }
  ];

  const getItemLink = (item: TrendItem) => {
    return item.type === 'skill' ? `/skills/${item.id}` : `/prompts/${item.id}`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}万`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}千`;
    }
    return num.toString();
  };

  return (
    <Card className="bg-white rounded-2xl shadow-sm border border-gray-200">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-black">社区趋势</h2>
          <div className="flex gap-2">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                  ${activeTab === tab.key 
                    ? 'bg-black text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          {sortOptions.map(option => (
            <button
              key={option.key}
              onClick={() => setSortOption(option.key)}
              className={`
                px-3 py-1.5 rounded-md text-sm transition-all duration-300
                ${sortOption === option.key 
                  ? 'bg-black text-white' 
                  : 'text-gray-600 hover:text-black hover:bg-gray-100'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchTrends} variant="outline">重试</Button>
          </div>
        )}

        {!loading && !error && trends.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无趋势数据</p>
          </div>
        )}

        {!loading && !error && trends.length > 0 && (
          <div className="space-y-4">
            {trends.map((item) => (
              <Link
                key={item.id}
                to={getItemLink(item)}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-200"
              >
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {item.rank}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-black truncate">{item.title}</h3>
                    {item.trendPercentage > 0 && (
                      <div className="flex items-center gap-1 text-green-600 flex-shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        <span className="text-sm font-medium">{item.trendPercentage}%</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-1">{item.description}</p>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-600 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>{formatNumber(item.downloads)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <span>{item.rating.toFixed(1)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <Link to={activeTab === 'skills' ? '/skills' : activeTab === 'prompts' ? '/prompts' : '/skills'}>
            <Button variant="outline">查看更多</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunityTrends;