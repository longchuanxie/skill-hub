import express from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin, requireRole, requireSuperAdmin } from '../middleware/rbac';
import {
  getDashboardStats,
  getUserList,
  getUserById,
  updateUserRole,
  updateUserStatus,
  getEnterpriseList,
  getEnterpriseById,
  getAuditLogs,
  updateEnterprisePlan,
} from '../controllers/adminController';
import {
  createInvitation,
  getInvitations,
  cancelInvitation,
  verifyInvitation,
} from '../controllers/adminInvitationController';

const router = express.Router();

// requireRole reads req.user, so authenticate must run first (the admin
// routes were silently always-401 without it).
router.use(authenticate);

router.get('/dashboard/stats', requireAdmin, getDashboardStats);

router.get('/users', requireAdmin, getUserList);
router.get('/users/:id', requireAdmin, getUserById);
// Role/status changes are too sensitive for audit-only admins.
router.put('/users/:id/role', requireRole('super_admin', 'admin'), updateUserRole);
router.put('/users/:id/status', requireRole('super_admin', 'admin'), updateUserStatus);

router.get('/enterprises', requireAdmin, getEnterpriseList);
router.get('/enterprises/:id', requireAdmin, getEnterpriseById);
router.put('/enterprises/:id/plan', requireRole('super_admin', 'admin'), updateEnterprisePlan);

router.get('/audit-logs', requireAdmin, getAuditLogs);

// 管理员邀请路由
router.post('/invitations', requireSuperAdmin, createInvitation);
router.get('/invitations', requireAdmin, getInvitations);
router.delete('/invitations/:id', requireSuperAdmin, cancelInvitation);
router.get('/invitations/verify', verifyInvitation);

export default router;
