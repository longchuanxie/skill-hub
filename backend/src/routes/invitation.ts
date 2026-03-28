import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { 
  acceptInvitation,
  declineInvitation
} from '../controllers/enterpriseController';

const router = Router();

router.post('/:token/accept', authenticate, acceptInvitation);
router.post('/:token/decline', authenticate, declineInvitation);

export default router;
