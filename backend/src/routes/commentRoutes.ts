import { Router } from 'express';
import { commentController } from '../controllers/commentController';
import { authenticate } from '../middleware/auth';

const router = Router();

// 获取资源的评论列表（不需要登录）
router.get('/:type/:id', commentController.getComments);

// 创建评论（需要登录）
router.post('/:type/:id', authenticate, commentController.createComment);

// 删除评论（需要登录）
router.delete('/:commentId', authenticate, commentController.deleteComment);

export default router;
