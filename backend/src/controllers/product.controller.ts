import { Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { sendSuccess, sendPaginated } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { ProductQueryParams } from '../validators/product.validator';

export class ProductController {
  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProductService.getAll(req.query as unknown as ProductQueryParams);
      sendPaginated(res, result, 'Products fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getLowStock(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const lowStock = await ProductService.getLowStockProducts();
      sendSuccess(res, lowStock, 'Low stock products fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.getById(req.params.id);
      sendSuccess(res, product, 'Product details fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.create(req.body);
      sendSuccess(res, product, 'Product created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.update(req.params.id, req.body);
      sendSuccess(res, product, 'Product updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProductService.delete(req.params.id);
      sendSuccess(res, result, 'Product deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
