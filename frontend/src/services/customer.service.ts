import { apiFetch } from './api';
import { Customer, FollowUp, PaginatedResponse } from '../types';

export interface CustomerQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  customerType?: string;
  status?: string;
  hasFollowUp?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class CustomerService {
  static async getAll(filters: CustomerQueryFilters = {}): Promise<PaginatedResponse<Customer>> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.customerType) params.append('customerType', filters.customerType);
    if (filters.status) params.append('status', filters.status);
    if (filters.hasFollowUp) params.append('hasFollowUp', filters.hasFollowUp);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch<PaginatedResponse<Customer>>(`/customers${query}`);
  }

  static async getById(id: string): Promise<Customer> {
    return apiFetch<Customer>(`/customers/${id}`);
  }

  static async create(data: Partial<Customer>): Promise<Customer> {
    return apiFetch<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async update(id: string, data: Partial<Customer>): Promise<Customer> {
    return apiFetch<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async delete(id: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  static async getFollowUps(customerId: string): Promise<FollowUp[]> {
    return apiFetch<FollowUp[]>(`/customers/${customerId}/follow-ups`);
  }

  static async createFollowUp(customerId: string, note: string, followUpDate: string): Promise<FollowUp> {
    return apiFetch<FollowUp>(`/customers/${customerId}/follow-ups`, {
      method: 'POST',
      body: JSON.stringify({ note, followUpDate }),
    });
  }
}
