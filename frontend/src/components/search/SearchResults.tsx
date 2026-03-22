import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchApi, SearchResult } from '../../api/search';
import { SearchBar } from './SearchBar';
import SkillCard from '../SkillCard';
import PromptCard from '../PromptCard';

export function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';
  const category = searchParams.get('category') || '';
  const sort = (searchParams.get('sort') as 'relevance' | 'latest' | 'popular') || 'relevance';
  const page = parseInt(searchParams.get('page') || '1');

  const [skills, setSkills] = useState<SearchResult[]>([]);
  const [prompts, setPrompts] = useState<SearchResult[]>([]);
  const [skillsTotal, setSkillsTotal] = useState(0);
  const [promptsTotal, setPromptsTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [took, setTook] = useState(0);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setSkills([]);
        setPrompts([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await searchApi.search({
          q: query,
          type: type as 'skill' | 'prompt' | 'all',
          category,
          sort,
          page,
          limit: 20
        });

        setSkills(response.data.skills.items as any);
        setPrompts(response.data.prompts.items as any);
        setSkillsTotal(response.data.skills.total);
        setPromptsTotal(response.data.prompts.total);
        setTotalPages(Math.max(response.data.skills.totalPages, response.data.prompts.totalPages));
        setTook(response.meta.took);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query, type, category, sort, page]);

  const handleSearch = (newQuery: string) => {
    setSearchParams({ q: newQuery, type, category, sort, page: '1' });
  };

  const handleSortChange = (newSort: string) => {
    setSearchParams({ q: query, type, category, sort: newSort, page: '1' });
  };

  const handleTypeChange = (newType: string) => {
    setSearchParams({ q: query, type: newType, category, sort, page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ q: query, type, category, sort, page: String(newPage) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showSkills = type === 'all' || type === 'skill';
  const showPrompts = type === 'all' || type === 'prompt';

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <SearchBar onSearch={handleSearch} />
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex gap-2">
          {['all', 'skill', 'prompt'].map((t) => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                type === t
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t === 'all' ? '全部' : t === 'skill' ? '技能' : '提示词'}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {(['relevance', 'latest', 'popular'] as const).map((s) => (
            <button
              key={s}
              onClick={() => handleSortChange(s)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                sort === s
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s === 'relevance' ? '相关性' : s === 'latest' ? '最新' : '热门'}
            </button>
          ))}
        </div>

        {took > 0 && (
          <span className="text-sm text-gray-500 ml-auto">
            找到 {skillsTotal + promptsTotal} 个结果 ({took}ms)
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {showSkills && skills.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">技能 ({skillsTotal})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {skills.map((skill) => (
                  <SkillCard key={skill._id} skill={skill as any} />
                ))}
              </div>
            </div>
          )}

          {showPrompts && prompts.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">提示词 ({promptsTotal})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {prompts.map((prompt) => (
                  <PromptCard key={prompt._id} prompt={prompt as any} />
                ))}
              </div>
            </div>
          )}

          {skills.length === 0 && prompts.length === 0 && query && (
            <div className="text-center py-20">
              <p className="text-gray-500">未找到与 "{query}" 相关的资源</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-10 h-10 rounded-full transition-colors ${
                    page === p
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
