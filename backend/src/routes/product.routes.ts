import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from '../validators/product.validator';
import { Role } from '@prisma/client';

const router = Router();

// All product routes require authentication
router.use(authenticate);

// Low stock products alert list: accessible to ADMIN, WAREHOUSE, SALES
router.get(
  '/low-stock',
  authorize(Role.ADMIN, Role.WAREHOUSE, Role.SALES),
  ProductController.getLowStock
);

// List products: accessible to all authenticated roles (SALES need product prices/stock for challans, WAREHOUSE manages, ACCOUNTS views)
router.get(
  '/',
  authorize(Role.ADMIN, Role.WAREHOUSE, Role.SALES, Role.ACCOUNTS),
  validateQuery(productQuerySchema),
  ProductController.getAll
);

// Get single product: accessible to all roles
router.get(
  '/:id',
  authorize(Role.ADMIN, Role.WAREHOUSE, Role.SALES, Role.ACCOUNTS),
  ProductController.getById
);

// Create product: accessible to ADMIN, WAREHOUSE
router.post(
  '/',
  authorize(Role.ADMIN, Role.WAREHOUSE),
  validateBody(createProductSchema),
  ProductController.create
);

// Update product: accessible to ADMIN, WAREHOUSE
router.put(
  '/:id',
  authorize(Role.ADMIN, Role.WAREHOUSE),
  validateBody(updateProductSchema),
  ProductController.update
);

// Delete product: ADMIN only
router.delete(
  '/:id',
  authorize(Role.ADMIN),
  ProductController.delete
);

export default router;
