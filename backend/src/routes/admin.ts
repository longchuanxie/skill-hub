import express from 'express';
import { requireAdmin, requireSuperAdmin } from '../middleware/rbac';
import {
  getDashboardStats,
  getUserList,
  getUserById,
  updateUserRole,
  updateUserStatus,
  getEnterpriseList,
  getEnterpriseById,
} from '../controllers/adminController';
import {
  createInvitation,
  getInvitations,
  cancelInvitation,
  verifyInvitation,
} from '../controllers/adminInvitationController';

const router = express.Router();

router.get('/dashboard/stats', requireAdmin, getDashboardStats);

router.get('/users', requireAdmin, getUserList);
router.get('/users/:id', requireAdmin, getUserById);
router.put('/users/:id/role', requireAdmin, updateUserRole);
router.put('/users/:id/status', requireAdmin, updateUserStatus);

router.get('/enterprises', requireAdmin, getEnterpriseList);
router.get('/enterprises/:id', requireAdmin, getEnterpriseById);

// 管理员邀请路由
router.post('/invitations', requireSuperAdmin, createInvitation);
router.get('/invitations', requireAdmin, getInvitations);
router.delete('/invitations/:id', requireSuperAdmin, cancelInvitation);
router.get('/invitations/verify', verifyInvitation);

export default router;
