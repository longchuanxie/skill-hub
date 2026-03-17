import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationEllipsis } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import Layout from '../components/Layout';
import ViewToggle from '../components/ViewToggle';
import SkillCard from '../components/SkillCard';
import SkillList from '../components/SkillList';
import { skillApi, Skill, SkillsResponse } from '../api/market';

const SkillsMarketPage: React.FC = () => {
  const { t } = useTranslation();
  const [skills, setSkills] = useState<Skill[]>([]);
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
    fetchSkills();
  }, [page, category, sort]);

  const fetchSkills = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, unknown> = { page, pageSize, sort };
      if (category && category !== 'all') params.category = category;
      if (search) params.search = search;
      
      const data: SkillsResponse = await skillApi.getSkills(params);
      setSkills(data.skills);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.pages);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSkills();
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <h1 className="text-3xl font-bold text-black">{t('skills.marketplace')}</h1>
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
                placeholder={t('skills.searchPlaceholder')}
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder={t('skills.allCategories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('skills.categories.all')}</SelectItem>
                <SelectItem value="coding">{t('skills.categories.coding')}</SelectItem>
                <SelectItem value="writing">{t('skills.categories.writing')}</SelectItem>
                <SelectItem value="design">{t('skills.categories.design')}</SelectItem>
                <SelectItem value="marketing">{t('skills.categories.marketing')}</SelectItem>
                <SelectItem value="data-analysis">{t('skills.categories.dataAnalysis')}</SelectItem>
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
              <SelectValue placeholder={t('skills.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">{t('skills.latest')}</SelectItem>
              <SelectItem value="popular">{t('skills.popular')}</SelectItem>
              <SelectItem value="rating">{t('skills.highestRated')}</SelectItem>
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
        ) : skills.length === 0 ? (
          <div className="text-center py-12 text-gray-500 flex flex-col items-center gap-3">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium">{t('skills.noSkillsFound')}</p>
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

        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            {renderPagination()}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SkillsMarketPage;
