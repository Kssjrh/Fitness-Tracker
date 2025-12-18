export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

export async function apiFetch<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => 'Request failed');
    throw new Error(message || `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

const api = {
  async get<T>(path: string, token?: string): Promise<T> {
    return apiFetch<T>(path, { method: 'GET' }, token);
  },

  async post<T>(path: string, data: any, token?: string): Promise<T> {
    return apiFetch<T>(path, {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  },

  async put<T>(path: string, data: any, token?: string): Promise<T> {
    return apiFetch<T>(path, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);
  },

  async delete<T>(path: string, token?: string): Promise<T> {
    return apiFetch<T>(path, { method: 'DELETE' }, token);
  }
};

export default api;
