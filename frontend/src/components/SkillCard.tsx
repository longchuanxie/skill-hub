import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skill } from '../api/market';
import { favoriteApi, likeApi } from '../api/interactions';
import { useAuthStore } from '../stores/authStore';
import { skillApi } from '../api/market';
import { toast } from 'sonner';

interface SkillCardProps {
  skill: Skill;
  onFavoriteChange?: (skillId: string, favorited: boolean) => void;
  onLikeChange?: (skillId: string, liked: boolean) => void;
}

const SkillCard: React.FC<SkillCardProps> = ({ skill, onFavoriteChange, onLikeChange }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(skill.likeCount || 0);
  const [favoriteCount, setFavoriteCount] = useState(skill.favoriteCount || 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkFavoriteStatus();
      checkLikeStatus();
    }
  }, [user, skill._id]);

  const checkFavoriteStatus = async () => {
    try {
      const response = await favoriteApi.check('skill', skill._id);
      setIsFavorited(response.isFavorited);
    } catch (error) {
      console.error('Failed to check favorite status:', error);
    }
  };

  const checkLikeStatus = async () => {
    try {
      const response = await likeApi.check('skill', skill._id);
      setIsLiked(response.isLiked);
    } catch (error) {
      console.error('Failed to check like status:', error);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const blob = await skillApi.download(skill._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${skill.name}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Download failed:', error);
      // 根据错误码显示对应的国际化错误信息
      const errorCode = error.message;
      let errorMessage = t('errors.downloadFailed');
      switch (errorCode) {
        case 'NO_FILE_AVAILABLE':
          errorMessage = t('errors.noFileAvailable');
          break;
        case 'FILE_NOT_FOUND':
          errorMessage = t('errors.fileNotFound');
          break;
        case 'SKILL_NOT_FOUND':
          errorMessage = t('errors.skillNotFound');
          break;
        case 'ACCESS_DENIED':
          errorMessage = t('errors.accessDenied');
          break;
      }
      toast.error(errorMessage);
    }
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      return;
    }
    
    setLoading(true);
    try {
      if (isFavorited) {
        await favoriteApi.remove('skill', skill._id);
        setIsFavorited(false);
        setFavoriteCount(prev => prev - 1);
        onFavoriteChange?.(skill._id, false);
      } else {
        await favoriteApi.add('skill', skill._id);
        setIsFavorited(true);
        setFavoriteCount(prev => prev + 1);
        onFavoriteChange?.(skill._id, true);
      }
    } catch (error) {
      console.error('Favorite operation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await likeApi.toggle('skill', skill._id);
      setIsLiked(response.liked);
      setLikeCount(response.likeCount);
      onLikeChange?.(skill._id, response.liked);
    } catch (error) {
      console.error('Like operation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <defs>
              <linearGradient id="half">
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="#e5e7eb" />
              </linearGradient>
            </defs>
            <path fill="url(#half)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      } else {
        stars.push(
          <svg key={i} className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      }
    }
    return stars;
  };

  return (
    <Link to={`/skills/${skill._id}`}>
      <Card className="hover:shadow-lg transition-shadow duration-200 h-full group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-bold text-black line-clamp-1 flex items-center gap-2">
              <svg className="w-5 h-5 text-black flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              {skill.name}
            </h3>
            <Badge 
              variant="outline" 
              className="text-xs bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 transition-colors font-medium"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              v{skill.version}
            </Badge>
          </div>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {skill.description}
          </p>
          
          <div className="flex flex-wrap gap-1.5 mb-4">
            {skill.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded border border-gray-200"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {tag}
              </span>
            ))}
          </div>
          
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center space-x-2">
              <Avatar size="sm">
                {skill.owner?.avatar ? (
                  <AvatarImage src={skill.owner.avatar} alt={skill.owner.username} />
                ) : null}
                <AvatarFallback>{skill.owner?.username?.slice(0, 2).toUpperCase() || 'UK'}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-600 font-medium">{skill.owner?.username || 'Unknown'}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <div className="flex">{renderStars(skill.averageRating)}</div>
              <span className="text-xs text-gray-500 font-medium">({skill.ratingsCount})</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t-2 border-gray-200">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleDownload}
                className="flex items-center space-x-1 text-gray-500 hover:text-gray-800 transition-colors"
                title="Download"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="text-xs">{skill.downloads}</span>
              </button>
              
              <button
                onClick={handleFavorite}
                className={`flex items-center space-x-1 transition-colors ${
                  isFavorited ? "text-yellow-500" : "text-gray-500 hover:text-yellow-500"
                }`}
                disabled={loading}
                title={isFavorited ? "Remove from favorites" : "Add to favorites"}
              >
                {isFavorited ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                )}
                <span className="text-xs">{favoriteCount}</span>
              </button>
              
              <button
                onClick={handleLike}
                className={`flex items-center space-x-1 transition-colors ${
                  isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
                }`}
                disabled={loading}
                title={isLiked ? "Unlike" : "Like"}
              >
                {isLiked ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )}
                <span className="text-xs">{likeCount}</span>
              </button>
            </div>
            
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              {skill.category}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default SkillCard;
