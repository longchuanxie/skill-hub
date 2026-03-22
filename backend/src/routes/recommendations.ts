import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import {
  getResourceRecommendations,
  logUserBehavior
} from '../controllers/recommendationController';

const router = Router();

router.get('/', optionalAuth, getResourceRecommendations);

router.post('/behavior', authenticate, logUserBehavior);

export default router;
