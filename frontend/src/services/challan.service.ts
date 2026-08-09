import { apiFetch } from './api';
import { Challan, ChallanStatus, PaginatedResponse } from '../types';

export interface ChallanQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: ChallanStatus;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateChallanItemInput {
  productId: string;
  quantity: number;
}

export interface CreateChallanInput {
  customerId: string;
  status?: ChallanStatus;
  notes?: string;
  items: CreateChallanItemInput[];
}

export interface UpdateChallanInput {
  customerId?: string;
  notes?: string;
  items?: CreateChallanItemInput[];
}

export class ChallanService {
  static async getAll(filters: ChallanQueryFilters = {}): Promise<PaginatedResponse<Challan>> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.customerId) params.append('customerId', filters.customerId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch<PaginatedResponse<Challan>>(`/challans${query}`);
  }

  static async getById(id: string): Promise<Challan> {
    return apiFetch<Challan>(`/challans/${id}`);
  }

  static async create(data: CreateChallanInput): Promise<Challan> {
    return apiFetch<Challan>('/challans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateDraft(id: string, data: UpdateChallanInput): Promise<Challan> {
    return apiFetch<Challan>(`/challans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async confirm(id: string): Promise<Challan> {
    return apiFetch<Challan>(`/challans/${id}/confirm`, {
      method: 'POST',
    });
  }

  static async cancel(id: string): Promise<Challan> {
    return apiFetch<Challan>(`/challans/${id}/cancel`, {
      method: 'POST',
    });
  }
}
