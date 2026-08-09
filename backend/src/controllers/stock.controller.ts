import { Response, NextFunction } from 'express';
import { StockService } from '../services/stock.service';
import { sendSuccess, sendPaginated } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { StockMovementQueryParams } from '../validators/stock.validator';

export class StockController {
  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await StockService.getAll(req.query as unknown as StockMovementQueryParams);
      sendPaginated(res, result, 'Stock movements fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  static async recordMovement(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await StockService.recordMovement(req.body, req.user!.userId);
      sendSuccess(res, result, 'Stock movement recorded successfully', 201);
    } catch (error) {
      next(error);
    }
  }
}
