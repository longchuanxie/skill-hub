import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import {
  searchResources,
  getSuggestions,
  logSearch,
  getSearchHistory,
  clearSearchHistory,
} from '../controllers/searchController';

const router = Router();

router.get('/', optionalAuth, searchResources);

router.get('/suggestions', optionalAuth, getSuggestions);

router.post('/log', logSearch);

router.get('/history', authenticate, getSearchHistory);

router.delete('/history', authenticate, clearSearchHistory);

export default router;
