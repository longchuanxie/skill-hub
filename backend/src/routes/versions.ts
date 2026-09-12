import express from 'express';
import {
  getVersions,
  getVersion,
  createVersion,
  rollbackVersion,
  addVersionTag,
  deleteVersionTag,
  compareVersions,
  compareVersionsDetailed,
  getVersionFileContent,
  downloadVersion,
} from '../controllers/versionController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = express.Router();

router.get('/:resourceType/:resourceId/compare', optionalAuth, compareVersions);
router.get('/:resourceType/:resourceId/compare/detailed', optionalAuth, compareVersionsDetailed);
router.get(
  '/:resourceType/:resourceId/:version/files/:filePath(*)',
  optionalAuth,
  getVersionFileContent,
);
router.get('/:resourceType/:resourceId/:version/download', optionalAuth, downloadVersion);
router.get('/:resourceType/:resourceId', optionalAuth, getVersions);
router.get('/:resourceType/:resourceId/:version', optionalAuth, getVersion);
router.post('/:resourceType/:resourceId', authenticate, createVersion);
router.post('/:resourceType/:resourceId/:version/rollback', authenticate, rollbackVersion);
router.post('/:resourceType/:resourceId/:version/tags', authenticate, addVersionTag);
router.delete('/:resourceType/:resourceId/:version/tags/:tag', authenticate, deleteVersionTag);

export default router;
