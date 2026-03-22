import { useState, useEffect } from 'react';
import { recommendationApi, ResourceItem } from '../../api/recommendations';
import SkillCard from '../SkillCard';
import PromptCard from '../PromptCard';

interface SimilarResourcesProps {
  resourceType: 'skill' | 'prompt';
  resourceId: string;
  title?: string;
  limit?: number;
  className?: string;
}

export function SimilarResources({
  resourceType,
  resourceId,
  title = '相似资源',
  limit = 8,
  className = ''
}: SimilarResourcesProps) {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSimilar = async () => {
      if (!resourceId) return;

      setIsLoading(true);
      setError(null);
      try {
        const data = await recommendationApi.getSimilar(resourceType, resourceId, limit);
        setResources(data);
      } catch (err) {
        console.error('Failed to fetch similar resources:', err);
        setError('加载相似资源失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSimilar();
  }, [resourceType, resourceId, limit]);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-40 rounded-lg mb-2" />
              <div className="bg-gray-200 h-4 w-3/4 rounded mb-1" />
              <div className="bg-gray-200 h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-gray-500 text-center py-4">{error}</p>
      </div>
    );
  }

  if (resources.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
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
