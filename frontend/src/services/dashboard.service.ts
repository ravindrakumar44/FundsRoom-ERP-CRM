import { apiFetch } from './api';
import { DashboardStats } from '../types';

export class DashboardService {
  static async getStats(): Promise<DashboardStats> {
    return apiFetch<DashboardStats>('/dashboard');
  }
}
