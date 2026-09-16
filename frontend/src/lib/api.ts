/**
 * API client for UrbanCore backend.
 */
import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token: newRefreshToken } = response.data;
          
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API functions

// Auth
export const auth = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  
  register: (data: {
    email: string;
    password: string;
    full_name: string;
    role: string;
  }) => apiClient.post('/auth/register', data),
  
  getMe: () => apiClient.get('/auth/me'),
  
  logout: () => apiClient.post('/auth/logout'),
};

// Projects
export const projects = {
  list: (skip = 0, limit = 100) =>
    apiClient.get(`/projects?skip=${skip}&limit=${limit}`),
  
  get: (id: number) => apiClient.get(`/projects/${id}`),
  
  create: (data: { name: string; description?: string; start_year?: number; end_year?: number }) =>
    apiClient.post('/projects', data),
  
  update: (id: number, data: Partial<{ name: string; description: string }>) =>
    apiClient.put(`/projects/${id}`, data),
  
  delete: (id: number) => apiClient.delete(`/projects/${id}`),
};

// Satellite
export const satellite = {
  download: (data: { project_id: number; bbox: number[]; years: number[] }) =>
    apiClient.post('/satellite/download', data),
  
  listImages: (projectId: number) =>
    apiClient.get(`/satellite/images/${projectId}`),
};

// Detection
export const detection = {
  run: (data: { project_id: number; image_id: number }) =>
    apiClient.post('/detection/run', data),
  
  getResults: (projectId: number) =>
    apiClient.get(`/detection/results/${projectId}`),
  
  runChangeDetection: (data: { project_id: number; year1: number; year2: number }) =>
    apiClient.post('/detection/change-detection', data),
};

// Violations
export const violations = {
  check: (projectId: number) =>
    apiClient.post('/violations/check', { project_id: projectId }),
  
  list: (projectId: number) =>
    apiClient.get(`/violations/${projectId}`),
  
  confirm: (violationId: number) =>
    apiClient.put(`/violations/${violationId}/confirm`),
  
  resolve: (violationId: number) =>
    apiClient.put(`/violations/${violationId}/resolve`),
};

// Terrain
export const terrain = {
  analyze: (data: { project_id: number; aoi_geometry: any }) =>
    apiClient.post('/terrain/analyze', data),
  
  getResults: (projectId: number) =>
    apiClient.get(`/terrain/${projectId}`),
  
  getSuitability: (projectId: number) =>
    apiClient.get(`/terrain/suitability/${projectId}`),
};

// Reports
export const reports = {
  generate: (data: { project_id: number; report_type: string; title: string }) =>
    apiClient.post('/reports', data),
  
  get: (reportId: number) =>
    apiClient.get(`/reports/${reportId}`),
  
  download: (reportId: number) =>
    apiClient.get(`/reports/${reportId}/download`, { responseType: 'blob' }),
  
  list: (projectId: number) =>
    apiClient.get(`/reports/project/${projectId}`),
};

// Complaints
export const complaints = {
  generate: (data: {
    project_id: number;
    violation_ids: number[];
    addressed_to: string;
    department: string;
  }) => apiClient.post('/complaints', data),
  
  get: (complaintId: number) =>
    apiClient.get(`/complaints/${complaintId}`),
  
  download: (complaintId: number) =>
    apiClient.get(`/complaints/${complaintId}/download`, { responseType: 'blob' }),
  
  send: (complaintId: number) =>
    apiClient.put(`/complaints/${complaintId}/send`),
  
  list: (projectId: number) =>
    apiClient.get(`/complaints/project/${projectId}`),
};

// Notifications
export const notifications = {
  list: () => apiClient.get('/notifications'),
  
  markAsRead: (notificationId: number) =>
    apiClient.put(`/notifications/${notificationId}/read`),
  
  markAllAsRead: () =>
    apiClient.put('/notifications/read-all'),
  
  delete: (notificationId: number) =>
    apiClient.delete(`/notifications/${notificationId}`),
};

// Users (admin)
export const users = {
  list: (skip = 0, limit = 100) =>
    apiClient.get(`/users?skip=${skip}&limit=${limit}`),
  
  get: (userId: number) =>
    apiClient.get(`/users/${userId}`),
  
  update: (userId: number, data: Partial<{ email: string; full_name: string; is_active: boolean }>) =>
    apiClient.put(`/users/${userId}`, data),
  
  delete: (userId: number) =>
    apiClient.delete(`/users/${userId}`),
  
  changePassword: (userId: number, data: { old_password: string; new_password: string }) =>
    apiClient.post(`/users/${userId}/change-password`, data),
};

export default apiClient;
