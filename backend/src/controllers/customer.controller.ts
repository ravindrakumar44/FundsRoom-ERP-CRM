import { Response, NextFunction } from 'express';
import { CustomerService } from '../services/customer.service';
import { sendSuccess, sendPaginated } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { CustomerQueryParams } from '../validators/customer.validator';

export class CustomerController {
  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await CustomerService.getAll(req.query as unknown as CustomerQueryParams);
      sendPaginated(res, result, 'Customers fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await CustomerService.getById(req.params.id);
      sendSuccess(res, customer, 'Customer details fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await CustomerService.create(req.body);
      sendSuccess(res, customer, 'Customer created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await CustomerService.update(req.params.id, req.body);
      sendSuccess(res, customer, 'Customer updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await CustomerService.delete(req.params.id);
      sendSuccess(res, result, 'Customer deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getFollowUps(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const followUps = await CustomerService.getFollowUps(req.params.id);
      sendSuccess(res, followUps, 'Follow-up logs fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  static async createFollowUp(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const followUp = await CustomerService.createFollowUp(
        req.params.id,
        req.body,
        req.user!.userId
      );
      sendSuccess(res, followUp, 'Follow-up log added successfully', 201);
    } catch (error) {
      next(error);
    }
  }
}
