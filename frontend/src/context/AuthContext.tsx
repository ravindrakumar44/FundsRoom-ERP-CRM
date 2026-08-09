import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { AuthService } from '../services/auth.service';
import { mockUsers } from '../services/mockData';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  switchRoleUser: (email: string) => void;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('nexora_token');
        const storedUser = localStorage.getItem('nexora_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } else {
          // Default to Admin demo user for frictionless immediate exploration
          const defaultAdmin = mockUsers['admin@nexora.demo'];
          const defaultToken = 'mock_jwt_token_admin';
          localStorage.setItem('nexora_token', defaultToken);
          localStorage.setItem('nexora_user', JSON.stringify(defaultAdmin));
          setToken(defaultToken);
          setUser(defaultAdmin);
        }
      } catch (err) {
        console.error('Failed to restore auth session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password = 'Password@123') => {
    setIsLoading(true);
    try {
      const res = await AuthService.login(email, password);
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('nexora_token', res.token);
      localStorage.setItem('nexora_user', JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  const switchRoleUser = (email: string) => {
    const selected = mockUsers[email] || {
      id: 'usr-' + Date.now(),
      name: email.split('@')[0],
      email,
      role: 'ADMIN',
    };
    const mockToken = 'mock_token_' + btoa(JSON.stringify(selected));
    setUser(selected);
    setToken(mockToken);
    localStorage.setItem('nexora_token', mockToken);
    localStorage.setItem('nexora_user', JSON.stringify(selected));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('nexora_token');
    localStorage.removeItem('nexora_user');
  };

  const hasRole = (...roles: Role[]): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true; // Admin has universal access
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchRoleUser,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
