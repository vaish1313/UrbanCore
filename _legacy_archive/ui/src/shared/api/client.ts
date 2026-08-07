/**
 * Typed API Client
 *
 * Wraps axios with:
 * - Automatic JWT injection from auth store
 * - Consistent error handling
 * - TypeScript return types
 *
 * All API calls go through this client — never raw fetch/axios.
 */

import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { useAuthStore } from '@features/auth/store/authStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30_000,
  });

  // ─── Request Interceptor: Inject JWT ───────────────────────
  client.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // ─── Response Interceptor: Handle Auth Errors ──────────────
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    },
  );

  return client;
}

export const apiClient = createApiClient();

// ─── Auth API ────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ user: any; token: string }>('/auth/login', { email, password }),

  register: (data: { email: string; password: string; fullName: string; role?: string }) =>
    apiClient.post<{ user: any; token: string }>('/auth/register', data),

  me: () => apiClient.get<{ user: any }>('/auth/me'),
};

// ─── Jobs API ────────────────────────────────────────────────
export const jobsApi = {
  create: (data: { name: string; aoi: object; epochs: string[]; description?: string }) =>
    apiClient.post<{ job: any; websocketUrl: string }>('/jobs', data),

  list: (params?: { page?: number; pageSize?: number; status?: string }) =>
    apiClient.get<{ items: any[]; total: number; totalPages: number }>('/jobs', { params }),

  get: (jobId: string) =>
    apiClient.get<{ job: any }>(`/jobs/${jobId}`),

  cancel: (jobId: string) =>
    apiClient.delete(`/jobs/${jobId}`),
};

// ─── Projects API ────────────────────────────────────────────
export const projectsApi = {
  list: () => apiClient.get<{ projects: any[] }>('/projects'),
  create: (data: { name: string; description?: string; location?: string }) =>
    apiClient.post<{ project: any }>('/projects', data),
  delete: (projectId: string) => apiClient.delete(`/projects/${projectId}`),
};
