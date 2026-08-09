import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerQuerySchema,
  createFollowUpSchema,
} from '../validators/customer.validator';
import { Role } from '@prisma/client';

const router = Router();

// All customer routes require authentication
router.use(authenticate);

// List customers: accessible to ADMIN, SALES, ACCOUNTS
router.get(
  '/',
  authorize(Role.ADMIN, Role.SALES, Role.ACCOUNTS),
  validateQuery(customerQuerySchema),
  CustomerController.getAll
);

// Get single customer details: accessible to ADMIN, SALES, ACCOUNTS
router.get(
  '/:id',
  authorize(Role.ADMIN, Role.SALES, Role.ACCOUNTS),
  CustomerController.getById
);

// Create customer: accessible to ADMIN, SALES
router.post(
  '/',
  authorize(Role.ADMIN, Role.SALES),
  validateBody(createCustomerSchema),
  CustomerController.create
);

// Update customer: accessible to ADMIN, SALES
router.put(
  '/:id',
  authorize(Role.ADMIN, Role.SALES),
  validateBody(updateCustomerSchema),
  CustomerController.update
);

// Delete customer: ADMIN only
router.delete(
  '/:id',
  authorize(Role.ADMIN),
  CustomerController.delete
);

// Follow-ups:
router.get(
  '/:id/follow-ups',
  authorize(Role.ADMIN, Role.SALES, Role.ACCOUNTS),
  CustomerController.getFollowUps
);

router.post(
  '/:id/follow-ups',
  authorize(Role.ADMIN, Role.SALES),
  validateBody(createFollowUpSchema),
  CustomerController.createFollowUp
);

export default router;
