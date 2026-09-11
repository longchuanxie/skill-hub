import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getProfile, updateProfile, getUserById, getUserList, uploadAvatar, searchUsers } from '../controllers/UserController';
import { updateProfileValidation } from '../validations/userValidation';
import { avatarUpload } from '../middleware/upload';

const router = Router();

router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, updateProfileValidation, updateProfile);
router.post('/me/avatar', authenticate, avatarUpload, uploadAvatar);
router.get('/search', authenticate, searchUsers);
router.get('/:id', getUserById);
router.get('/', authenticate, getUserList);

export default router;
