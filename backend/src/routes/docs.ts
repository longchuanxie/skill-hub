import { Router } from 'express';
import { getApiDocs } from '../controllers/docsController';

const router = Router();

router.get('/', getApiDocs);

export default router;
