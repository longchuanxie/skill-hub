import express from 'express';
import { likeController } from '../controllers/likeController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.post('/:type/:id/toggle', likeController.toggleLike);
router.get('/:type/:id/check', likeController.checkLike);
router.get('/:type', likeController.getLikes);

export default router;
