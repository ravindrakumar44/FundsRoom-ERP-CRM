const RAW_BASE_URL = import.meta.env.VITE_API_URL || 'https://nexora-backend-4kk0.onrender.com';
export const BASE_URL = RAW_BASE_URL.endsWith('/api') ? RAW_BASE_URL : `${RAW_BASE_URL.replace(/\/$/, '')}/api`;

/**
 * Production API Client Fetch Wrapper
 * Connects directly to the live Render Backend & Neon PostgreSQL Database
 */
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('nexora_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  // Parse JSON response safely
  let resData: any = {};
  try {
    resData = await response.json();
  } catch {
    resData = {};
  }

  if (!response.ok) {
    const errorMessage =
      resData?.error ||
      resData?.message ||
      (Array.isArray(resData?.errors)
        ? resData.errors.map((e: any) => e.message || JSON.stringify(e)).join(', ')
        : `Request failed with status ${response.status}`);
    throw new Error(errorMessage);
  }

  // Handle paginated envelope from Express backend ({ success: true, data: [...], pagination: {...} })
  if (resData && resData.pagination !== undefined && resData.data !== undefined) {
    return {
      data: resData.data,
      pagination: resData.pagination,
    } as unknown as T;
  }

  return (resData && resData.data !== undefined ? resData.data : resData) as unknown as T;
}
