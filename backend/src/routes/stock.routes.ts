import { Router } from 'express';
import { StockController } from '../controllers/stock.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createStockMovementSchema,
  stockMovementQuerySchema,
} from '../validators/stock.validator';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// List stock movements: accessible to ADMIN, WAREHOUSE
router.get(
  '/',
  authorize(Role.ADMIN, Role.WAREHOUSE),
  validateQuery(stockMovementQuerySchema),
  StockController.getAll
);

// Record manual stock adjustment (IN/OUT): accessible to ADMIN, WAREHOUSE
router.post(
  '/',
  authorize(Role.ADMIN, Role.WAREHOUSE),
  validateBody(createStockMovementSchema),
  StockController.recordMovement
);

export default router;
