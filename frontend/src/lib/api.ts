import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const token = Cookies.get('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      cache: 'no-store',
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (response.status === 401) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        const retryResponse = await fetch(url, {
          ...options,
          cache: 'no-store',
          headers: {
            ...this.getHeaders(),
            ...options.headers,
          },
        });
        if (!retryResponse.ok) {
          const error = await retryResponse.json().catch(() => ({}));
          const msg = typeof error.message === 'string' ? error.message : 'Ошибка запроса';
          throw new Error(msg);
        }
        const retryText = await retryResponse.text();
        if (!retryText) return {} as T;
        return JSON.parse(retryText);
      }

      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      const error = await response.json().catch(() => ({}));
      const msg = typeof error.message === 'string' ? error.message : 'Сессия истекла';
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      throw new Error(msg);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const msg = typeof error.message === 'string' ? error.message : 'Ошибка запроса';
      throw new Error(msg);
    }

    const text = await response.text();
    if (!text) return {} as T;
    return JSON.parse(text);
  }

  private async tryRefreshToken(): Promise<boolean> {
    const refreshToken = Cookies.get('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      Cookies.set('accessToken', data.accessToken, { sameSite: 'lax' });
      Cookies.set('refreshToken', data.refreshToken, { sameSite: 'lax' });
      return true;
    } catch {
      return false;
    }
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint);
  }

  post<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_URL);
