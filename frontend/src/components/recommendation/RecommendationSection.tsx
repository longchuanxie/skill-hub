import { useState, useEffect } from 'react';
import { recommendationApi, ResourceItem } from '../../api/recommendations';
import SkillCard from '../SkillCard';
import PromptCard from '../PromptCard';

interface RecommendationSectionProps {
  title?: string;
  type?: 'popular' | 'new' | 'personalized';
  resourceType?: 'skill' | 'prompt';
  limit?: number;
  category?: string;
  className?: string;
}

export function RecommendationSection({
  title = '推荐资源',
  type = 'popular',
  resourceType = 'skill',
  limit = 8,
  category,
  className = ''
}: RecommendationSectionProps) {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await recommendationApi.getRecommendations({
          type,
          resourceType,
          limit,
          category
        });
        setResources(data);
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
        setError('加载推荐失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [type, resourceType, limit, category]);

  const getTitle = () => {
    switch (type) {
      case 'popular':
        return '热门推荐';
      case 'new':
        return '新品推荐';
      case 'personalized':
        return '为你推荐';
      default:
        return title;
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h3 className="text-lg font-semibold mb-4">{getTitle()}</h3>
        <div className="flex justify-center items-center py-8">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h3 className="text-lg font-semibold mb-4">{getTitle()}</h3>
        <p className="text-gray-500 text-center py-4">{error}</p>
      </div>
    );
  }

  if (resources.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{getTitle()}</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {resources.map((resource) => (
          resourceType === 'skill' ? (
            <SkillCard key={resource._id} skill={resource as any} />
          ) : (
            <PromptCard key={resource._id} prompt={resource as any} />
          )
        ))}
      </div>
    </div>
  );
}
