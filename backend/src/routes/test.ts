import express from 'express';
import { testHome } from '../controllers/testController';

const router = express.Router();

router.get('/test', testHome);

export default router;