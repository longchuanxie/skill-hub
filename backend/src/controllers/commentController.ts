import { Request, Response } from 'express';
import { Comment } from '../models/Comment';

export const commentController = {
  // 获取资源的评论列表（支持嵌套回复）
  getComments: async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, id } = req.params;

      const comments = await Comment.find({
        resourceType: type,
        resourceId: id,
        parentId: { $exists: false } // 只获取顶级评论
      })
      .populate('user', 'username avatar')
      .populate({ 
        path: 'replies',
        populate: { path: 'user', select: 'username avatar' },
        options: { sort: { createdAt: 1 } }
      })
      .sort({ createdAt: -1 });

      res.json(comments);
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // 创建评论（支持回复）
  createComment: async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, id } = req.params;
      const { content, parentId } = req.body;
      const userId = (req as any).user.userId;

      if (!content || content.trim() === '') {
        res.status(400).json({ message: 'Content is required' });
        return;
      }

      const comment = new Comment({
        content,
        user: userId,
        resourceType: type,
        resourceId: id,
        parentId: parentId || undefined
      });

      await comment.save();

      // 填充用户信息后返回
      const populatedComment = await Comment.findById(comment._id)
        .populate('user', 'username avatar');

      res.status(201).json(populatedComment);
    } catch (error) {
      console.error('Create comment error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // 删除评论
  deleteComment: async (req: Request, res: Response): Promise<void> => {
    try {
      const { commentId } = req.params;
      const userId = (req as any).user.userId;

      const comment = await Comment.findById(commentId);
      if (!comment) {
        res.status(404).json({ message: 'Comment not found' });
        return;
      }

      // 检查是否是评论的创建者
      if (comment.user.toString() !== userId) {
        res.status(403).json({ message: 'Not authorized to delete this comment' });
        return;
      }

      await comment.deleteOne();
      res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};
