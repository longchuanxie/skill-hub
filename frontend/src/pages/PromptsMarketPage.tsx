import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationEllipsis } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import ViewToggle from '../components/ViewToggle';
import PromptCard from '../components/PromptCard';
import PromptList from '../components/PromptList';
import { promptApi, Prompt, PromptsResponse } from '../api/market';

const PromptsMarketPage: React.FC = () => {
  const { t } = useTranslation();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('latest');

  useEffect(() => {
    fetchPrompts();
  }, [page, category, sort]);

  const fetchPrompts = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, unknown> = { page, pageSize, sort };
      if (category && category !== 'all') params.category = category;
      if (search) params.search = search;
      
      const data: PromptsResponse = await promptApi.getPrompts(params);
      setPrompts(data.prompts);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.pages);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPrompts();
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return (
      <Pagination>
        <PaginationContent>
          {page > 1 && (
            <PaginationItem>
              <PaginationLink onClick={() => handlePageChange(page - 1)} className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('common.previous')}
              </PaginationLink>
            </PaginationItem>
          )}
          
          {start > 1 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
              </PaginationItem>
              {start > 2 && <PaginationEllipsis />}
            </>
          )}
          
          {pages.map((p) => (
            <PaginationItem key={p}>
              <PaginationLink 
                isActive={p === page} 
                onClick={() => handlePageChange(p)}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ))}
          
          {end < totalPages && (
            <>
              {end < totalPages - 1 && <PaginationEllipsis />}
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(totalPages)}>
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}
          
          {page < totalPages && (
            <PaginationItem>
              <PaginationLink onClick={() => handlePageChange(page + 1)} className="flex items-center gap-1">
                {t('common.next')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </PaginationLink>
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <h1 className="text-3xl font-bold text-black">{t('prompts.marketplace')}</h1>
          </div>
          <ViewToggle viewMode={viewMode} onChange={setViewMode} />
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <form onSubmit={handleSearch} className="flex-1 flex gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <Input
                placeholder={t('prompts.searchPlaceholder')}
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder={t('prompts.allCategories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('prompts.categories.all')}</SelectItem>
                <SelectItem value="creative">{t('prompts.categories.creative')}</SelectItem>
                <SelectItem value="technical">{t('prompts.categories.technical')}</SelectItem>
                <SelectItem value="business">{t('prompts.categories.business')}</SelectItem>
                <SelectItem value="education">{t('prompts.categories.education')}</SelectItem>
                <SelectItem value="entertainment">{t('prompts.categories.entertainment')}</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {t('common.search')}
            </Button>
          </form>
          
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t('prompts.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">{t('prompts.latest')}</SelectItem>
              <SelectItem value="popular">{t('prompts.popular')}</SelectItem>
              <SelectItem value="rating">{t('prompts.highestRated')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black"></div>
          </div>
        ) : prompts.length === 0 ? (
          <div className="text-center py-12 text-gray-500 flex flex-col items-center gap-3">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium">{t('prompts.noPromptsFound')}</p>
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

        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            {renderPagination()}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PromptsMarketPage;
