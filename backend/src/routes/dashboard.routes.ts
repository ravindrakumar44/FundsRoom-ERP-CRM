import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All authenticated roles can access dashboard stats (the dashboard adjusts cards/widgets)
router.use(authenticate);

router.get('/', DashboardController.getStats);

export default router;
