import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import {
  getProfile,
  updateProfile,
  getUserById,
  getUserList,
  uploadAvatar,
  searchUsers,
} from '../controllers/UserController';
import { updateProfileValidation } from '../validations/userValidation';
import { avatarUpload } from '../middleware/upload';

const router = Router();

router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, updateProfileValidation, updateProfile);
router.post('/me/avatar', authenticate, avatarUpload, uploadAvatar);
router.get('/search', authenticate, searchUsers);
router.get('/:id', getUserById);
// Full user list is admin-only; no frontend feature consumes it as a normal user.
router.get('/', authenticate, requireAdmin, getUserList);

export default router;
