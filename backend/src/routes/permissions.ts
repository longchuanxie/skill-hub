import express from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import {
  getPermissions,
  updatePermissions,
  addCollaborator,
  updateCollaboratorPermission,
  removeCollaborator,
  getPermissionAuditLogs,
  checkPermission
} from '../controllers/permissionController';

const router = express.Router();

router.get('/skills/:skillId/permissions', authenticate, getPermissions);
router.put('/skills/:skillId/permissions', authenticate, updatePermissions);
router.post('/skills/:skillId/collaborators', authenticate, addCollaborator);
router.put('/skills/:skillId/collaborators/:userId', authenticate, updateCollaboratorPermission);
router.delete('/skills/:skillId/collaborators/:userId', authenticate, removeCollaborator);
router.get('/skills/:skillId/permissions/audit-logs', authenticate, getPermissionAuditLogs);
router.get('/skills/:skillId/permissions/check', optionalAuth, checkPermission);

export default router;
