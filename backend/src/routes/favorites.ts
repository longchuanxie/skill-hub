import express from 'express';
import { favoriteController } from '../controllers/favoriteController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.post('/:type/:id', favoriteController.addFavorite);
router.delete('/:type/:id', favoriteController.removeFavorite);
router.get('/:type/:id/check', favoriteController.checkFavorite);
router.get('/:type', favoriteController.getFavorites);

export default router;
