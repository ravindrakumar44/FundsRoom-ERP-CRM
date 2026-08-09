import { Router } from 'express';
import { ChallanController } from '../controllers/challan.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createChallanSchema,
  updateChallanSchema,
  challanQuerySchema,
} from '../validators/challan.validator';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// List challans: accessible to ADMIN, SALES, ACCOUNTS, WAREHOUSE (dispatch view)
router.get(
  '/',
  authorize(Role.ADMIN, Role.SALES, Role.ACCOUNTS, Role.WAREHOUSE),
  validateQuery(challanQuerySchema),
  ChallanController.getAll
);

// Get single challan: accessible to all authenticated roles
router.get(
  '/:id',
  authorize(Role.ADMIN, Role.SALES, Role.ACCOUNTS, Role.WAREHOUSE),
  ChallanController.getById
);

// Create challan: accessible to ADMIN, SALES
router.post(
  '/',
  authorize(Role.ADMIN, Role.SALES),
  validateBody(createChallanSchema),
  ChallanController.create
);

// Update draft challan: accessible to ADMIN, SALES
router.put(
  '/:id',
  authorize(Role.ADMIN, Role.SALES),
  validateBody(updateChallanSchema),
  ChallanController.updateDraft
);

// Confirm challan (atomic stock check and deduction): accessible to ADMIN, SALES
router.post(
  '/:id/confirm',
  authorize(Role.ADMIN, Role.SALES),
  ChallanController.confirm
);

// Cancel challan (atomic stock restoration if confirmed): accessible to ADMIN, SALES
router.post(
  '/:id/cancel',
  authorize(Role.ADMIN, Role.SALES),
  ChallanController.cancel
);

export default router;
