import express from 'express';
import {
  getVersions,
  getVersion,
  createVersion,
  rollbackVersion
} from '../controllers/versionController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/:resourceType/:resourceId', getVersions);
router.get('/:resourceType/:resourceId/:version', getVersion);
router.post('/:resourceType/:resourceId', authenticate, createVersion);
router.post('/:resourceType/:resourceId/:version/rollback', authenticate, rollbackVersion);

export default router;
