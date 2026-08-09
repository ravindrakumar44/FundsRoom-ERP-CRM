import { apiFetch } from './api';
import { Product, PaginatedResponse } from '../types';

export interface ProductQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  lowStockOnly?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ProductService {
  static async getAll(filters: ProductQueryFilters = {}): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.lowStockOnly) params.append('lowStockOnly', filters.lowStockOnly);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch<PaginatedResponse<Product>>(`/products${query}`);
  }

  static async getLowStock(): Promise<Product[]> {
    return apiFetch<Product[]>('/products/low-stock');
  }

  static async getById(id: string): Promise<Product> {
    return apiFetch<Product>(`/products/${id}`);
  }

  static async create(data: Partial<Product>): Promise<Product> {
    return apiFetch<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async update(id: string, data: Partial<Product>): Promise<Product> {
    return apiFetch<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async delete(id: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/products/${id}`, {
      method: 'DELETE',
    });
  }
}
