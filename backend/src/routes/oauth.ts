import { Router } from 'express';
import { 
  getAuthUrl, 
  handleCallback, 
  getProviders, 
  linkAccount,
  createProvider,
  updateProvider,
  deleteProvider,
  getEnterpriseProviders
} from '../controllers/oauthController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/providers', getProviders);
router.get('/providers/enterprise', authenticate, getEnterpriseProviders);
router.post('/providers', authenticate, createProvider);
router.put('/providers/:id', authenticate, updateProvider);
router.delete('/providers/:id', authenticate, deleteProvider);
router.get('/authorize/:provider', getAuthUrl);
router.get('/callback/:provider', handleCallback);
router.get('/callback/custom/*', handleCallback);
router.post('/link/:provider', authenticate, linkAccount);

export default router;
