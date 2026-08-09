import { Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class DashboardController {
  static async getStats(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await DashboardService.getStats();
      sendSuccess(res, stats, 'Dashboard statistics fetched successfully');
    } catch (error) {
      next(error);
    }
  }
}
