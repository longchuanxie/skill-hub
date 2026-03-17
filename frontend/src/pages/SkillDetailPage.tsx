import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';

import { Separator } from '@/components/ui/separator';
import Layout from '../components/Layout';
import { skillApi } from '../api/market';
import { commentApi } from '../api/interactions';
import { useAuthStore } from '../stores/authStore';

interface User {
  _id: string;
  username: string;
  avatar?: string;
}

interface Comment {
  _id: string;
  content: string;
  user: User;
  resourceType: 'skill' | 'prompt';
  resourceId: string;
  parentId?: string;
  replies: Comment[];
  createdAt: string;
  updatedAt: string;
}

interface Skill {
  _id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  tags: string[];
  owner: User;
  downloads: number;
  averageRating: number;
  status: string;
  visibility: string;
  files: Array<{
    filename: string;
    originalName: string;
    path: string;
    size: number;
    mimetype: string;
  }>;
  createdAt: string;
}

const SkillDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [rating, setRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState('');

  useEffect(() => {
    const fetchSkill = async () => {
      if (!id) return;
      try {
        const response = await skillApi.getSkillById(id);
        setSkill(response as unknown as Skill);
      } catch (err) {
        setError('Failed to load skill');
      } finally {
        setLoading(false);
      }
    };
    fetchSkill();
  }, [id]);

  useEffect(() => {
    const fetchComments = async () => {
      if (!id) return;
      setCommentLoading(true);
      try {
        const response = await commentApi.getComments('skill', id);
        setComments(response as unknown as Comment[]);
      } catch (err) {
        setCommentError('Failed to load comments');
      } finally {
        setCommentLoading(false);
      }
    };
    fetchComments();
  }, [id]);

  const handleCommentSubmit = async () => {
    if (!id || !newComment.trim() || !user) return;
    setSubmittingComment(true);
    try {
      const response = await commentApi.createComment('skill', id, newComment.trim());
      setComments([response as unknown as Comment, ...comments]);
      setNewComment('');
    } catch (err) {
      setCommentError('Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (!id || !rating || !user) return;
    setSubmittingRating(true);
    try {
      const response = await skillApi.rateSkill(id, rating);
      if (skill) {
        setSkill({ ...skill, averageRating: response.averageRating });
      }
      setRating(0);
    } catch (err) {
      setRatingError('Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    try {
      await commentApi.deleteComment(commentId);
      setComments(comments.filter(comment => comment._id !== commentId));
    } catch (err) {
      setCommentError('Failed to delete comment');
    }
  };

  const handleDownload = async () => {
    if (!id) return;
    setDownloading(true);
    try {
      const response = await skillApi.downloadSkill(id);
      const blob = new Blob([response], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${skill?.name || 'skill'}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      if (skill) {
        setSkill({ ...skill, downloads: skill.downloads + 1 });
      }
    } catch (err) {
      setError('Failed to download skill');
    } finally {
      setDownloading(false);
    }
  };

  const isOwner = user && skill && user.id === skill.owner?._id;

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

  if (error || !skill) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-red-600 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-lg font-medium">{error || 'Skill not found'}</span>
            </div>
          </div>
          <div className="text-center mt-4">
            <Button onClick={() => navigate('/skills')} className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Skills
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => navigate('/skills')} className="mb-6 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Skills
        </Button>

        <Card className="border-2 border-gray-200">
          <CardHeader className="border-b-2 border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <CardTitle className="text-2xl text-black">{skill.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-black text-white">v{skill.version}</Badge>
                  <Badge variant="outline" className="border-2 border-gray-300">{skill.category}</Badge>
                  <Badge variant={skill.status === 'approved' ? 'default' : 'secondary'} className={skill.status === 'approved' ? 'bg-green-600' : ''}>
                    {skill.status}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                {isOwner && (
                  <Button variant="outline" onClick={() => navigate(`/skills/${skill._id}/edit`)} className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </Button>
                )}
                <Button onClick={handleDownload} disabled={downloading} className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {downloading ? 'Downloading...' : 'Download'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <Avatar className="h-10 w-10 border-2 border-gray-200">
                {skill.owner?.avatar ? (
                  <img src={skill.owner.avatar} alt={skill.owner?.username || ''} className="w-full h-full object-cover" />
                ) : null}
                <AvatarFallback className="bg-black text-white">{skill.owner?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-black">{skill.owner?.username || 'Unknown'}</span>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {skill.downloads} downloads
              </span>
              {skill.averageRating > 0 && (
                <>
                  <span className="text-gray-300">|</span>
                  <div className="flex items-center gap-1">
                    <div className="flex">{renderStars(skill.averageRating)}</div>
                    <span className="text-sm text-gray-600 font-medium">({skill.averageRating.toFixed(1)})</span>
                  </div>
                </>
              )}
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(skill.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Description
              </h3>
              <p className="text-gray-600 leading-relaxed">{skill.description}</p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {skill.tags.map((tag, index) => (
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

            {skill.files && skill.files.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Files
                </h3>
                <div className="space-y-2">
                  {skill.files.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-medium text-black">{file.originalName || file.filename}</span>
                      <span className="text-gray-400">({(file.size / 1024).toFixed(2)} KB)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rating Section */}
            <div className="mb-6">
              <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Rate this Skill
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-2xl ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <Button
                  onClick={handleRatingSubmit}
                  disabled={!rating || submittingRating || !user}
                  className="ml-4"
                >
                  {submittingRating ? 'Submitting...' : 'Submit Rating'}
                </Button>
              </div>
              {ratingError && (
                <p className="mt-2 text-sm text-red-600">{ratingError}</p>
              )}
            </div>

            <Separator className="my-6" />

            {/* Comments Section */}
            <div>
              <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Comments ({comments.length})
              </h3>

              {/* Comment Form */}
              {user && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <h4 className="font-medium text-black mb-2">Add a comment</h4>
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write your comment here..."
                    className="mb-3"
                    maxLength={1000}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{newComment.length}/1000</span>
                    <Button
                      onClick={handleCommentSubmit}
                      disabled={!newComment.trim() || submittingComment}
                    >
                      {submittingComment ? 'Submitting...' : 'Post Comment'}
                    </Button>
                  </div>
                  {commentError && (
                    <p className="mt-2 text-sm text-red-600">{commentError}</p>
                  )}
                </div>
              )}

              {/* Comments List */}
              {commentLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                </div>
              ) : comments.length === 0 ? (
                <p className="text-gray-500">No comments yet. Be the first to comment!</p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment._id} className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border-2 border-gray-200">
                            {comment.user.avatar ? (
                              <img src={comment.user.avatar} alt={comment.user.username} className="w-full h-full object-cover" />
                            ) : null}
                            <AvatarFallback className="bg-black text-white">{comment.user.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium text-black">{comment.user.username}</h4>
                            <p className="text-sm text-gray-500">{new Date(comment.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        {user && user.id === comment.user._id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteComment(comment._id)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                      <p className="mt-2 text-gray-700">{comment.content}</p>
                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 space-y-3 pl-6 border-l-2 border-gray-200">
                          {comment.replies.map((reply) => (
                            <div key={reply._id} className="p-3 bg-white rounded-lg border border-gray-200">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6 border border-gray-200">
                                    {reply.user.avatar ? (
                                      <img src={reply.user.avatar} alt={reply.user.username} className="w-full h-full object-cover" />
                                    ) : null}
                                    <AvatarFallback className="bg-black text-white text-xs">{reply.user.username[0].toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h5 className="font-medium text-black text-sm">{reply.user.username}</h5>
                                    <p className="text-xs text-gray-500">{new Date(reply.createdAt).toLocaleString()}</p>
                                  </div>
                                </div>
                                {user && user.id === reply.user._id && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteComment(reply._id)}
                                    className="h-6 px-2"
                                  >
                                    Delete
                                  </Button>
                                )}
                              </div>
                              <p className="mt-1 text-gray-700 text-sm">{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SkillDetailPage;
