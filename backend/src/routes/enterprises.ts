import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { 
  createEnterprise, 
  getEnterprise, 
  getMyEnterprise, 
  updateEnterprise,
  inviteMember,
  removeMember,
  updateMemberRole,
  leaveEnterprise,
  updateAuthSettings,
  getAuthSettings,
  getAuthSettingsPublic,
  getResourceReviewSettings,
  updateResourceReviewSettings
} from '../controllers/enterpriseController';
import { body } from 'express-validator';
import { enterpriseLogoUpload } from '../middleware/upload';

const router = Router();

const enterpriseValidation = [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('description').optional().trim(),
];

router.post('/', authenticate, enterpriseValidation, createEnterprise);
router.get('/my', authenticate, getMyEnterprise);
router.get('/:id', authenticate, getEnterprise);
router.put('/:id', authenticate, enterpriseLogoUpload, updateEnterprise);
router.post('/:id/invite', authenticate, inviteMember);
router.delete('/:id/members/:memberId', authenticate, removeMember);
router.put('/:id/members/:memberId', authenticate, updateMemberRole);
router.post('/leave', authenticate, leaveEnterprise);
router.get('/:id/auth-settings', authenticate, getAuthSettings);
router.put('/:id/auth-settings', authenticate, updateAuthSettings);
router.get('/:id/auth-settings/public', getAuthSettingsPublic);
router.get('/:id/resource-review-settings', authenticate, getResourceReviewSettings);
router.put('/:id/resource-review-settings', authenticate, updateResourceReviewSettings);

export default router;
