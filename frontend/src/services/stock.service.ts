import { apiFetch } from './api';
import { StockMovement, MovementType, PaginatedResponse } from '../types';

export interface StockMovementQueryFilters {
  page?: number;
  limit?: number;
  productId?: string;
  movementType?: MovementType;
  startDate?: string;
  endDate?: string;
}

export interface CreateStockMovementInput {
  productId: string;
  quantity: number;
  movementType: MovementType;
  reason: string;
}

export class StockService {
  static async getAll(filters: StockMovementQueryFilters = {}): Promise<PaginatedResponse<StockMovement>> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.productId) params.append('productId', filters.productId);
    if (filters.movementType) params.append('type', filters.movementType);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch<PaginatedResponse<StockMovement>>(`/stock-movements${query}`);
  }

  static async recordMovement(data: CreateStockMovementInput): Promise<StockMovement> {
    return apiFetch<StockMovement>('/stock-movements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}
