import express from 'express';
import {
  getPromptVersions,
  getPromptVersion,
  deletePromptVersion,
} from '../controllers/PromptVersionController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/prompts/:promptId/versions', authenticate, getPromptVersions);
router.get('/prompts/:promptId/versions/:versionId', authenticate, getPromptVersion);
router.delete('/prompts/:promptId/versions/:versionId', authenticate, deletePromptVersion);

export default router;