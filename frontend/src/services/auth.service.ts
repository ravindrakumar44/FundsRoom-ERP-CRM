import { apiFetch } from './api';
import { User } from '../types';

export interface LoginResponse {
  token: string;
  user: User;
}

export class AuthService {
  static async login(email: string, password: string): Promise<LoginResponse> {
    return apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  static async getMe(): Promise<User> {
    return apiFetch<User>('/auth/me');
  }
}
