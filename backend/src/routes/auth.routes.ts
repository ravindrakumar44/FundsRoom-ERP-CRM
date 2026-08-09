import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate';
import { loginSchema } from '../validators/auth.validator';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', validateBody(loginSchema), AuthController.login);
router.get('/me', authenticate, AuthController.getMe);

export default router;
