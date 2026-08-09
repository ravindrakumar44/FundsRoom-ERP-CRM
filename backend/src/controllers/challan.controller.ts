import { Response, NextFunction } from 'express';
import { ChallanService } from '../services/challan.service';
import { sendSuccess, sendPaginated } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { ChallanQueryParams } from '../validators/challan.validator';

export class ChallanController {
  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ChallanService.getAll(req.query as unknown as ChallanQueryParams);
      sendPaginated(res, result, 'Challans fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const challan = await ChallanService.getById(req.params.id);
      sendSuccess(res, challan, 'Challan details fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const challan = await ChallanService.create(req.body, req.user!.userId);
      sendSuccess(res, challan, 'Challan created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateDraft(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const challan = await ChallanService.updateDraft(req.params.id, req.body);
      sendSuccess(res, challan, 'Draft challan updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async confirm(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const challan = await ChallanService.confirm(req.params.id, req.user!.userId);
      sendSuccess(res, challan, 'Challan confirmed and stock successfully deducted');
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const challan = await ChallanService.cancel(req.params.id, req.user!.userId);
      sendSuccess(res, challan, 'Challan cancelled successfully');
    } catch (error) {
      next(error);
    }
  }
}
