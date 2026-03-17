import express from 'express';
import { getTrends } from '../controllers/trendsController';

const router = express.Router();

router.get('/', getTrends);

export default router;