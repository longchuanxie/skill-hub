import express from 'express';
import {
  getSkillVersions,
  getSkillVersion,
  deleteSkillVersion,
} from '../controllers/SkillVersionController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/skills/:skillId/versions', authenticate, getSkillVersions);
router.get('/skills/:skillId/versions/:versionId', authenticate, getSkillVersion);
router.delete('/skills/:skillId/versions/:versionId', authenticate, deleteSkillVersion);

export default router;