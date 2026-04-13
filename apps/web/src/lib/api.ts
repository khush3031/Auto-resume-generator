import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { ApiResponse } from '@resumeforge/shared';

const storageKey = 'resumeforge-auth';
const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

function getStoredTokens(): AuthTokens | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthTokens;
  } catch {
    return null;
  }
}

function saveTokens(tokens: AuthTokens) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, JSON.stringify(tokens));
  document.cookie = `accessToken=${tokens.accessToken}; path=/; max-age=900; samesite=lax`;
  document.cookie = `refreshToken=${tokens.refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
}

function clearTokens() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(storageKey);
  document.cookie = 'accessToken=; path=/; max-age=0; samesite=lax';
  document.cookie = 'refreshToken=; path=/; max-age=0; samesite=lax';
}

function getAccessToken() {
  return getStoredTokens()?.accessToken || null;
}

function getRefreshToken() {
  return getStoredTokens()?.refreshToken || null;
}

const api = axios.create({
  baseURL: apiBase,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (!originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && getRefreshToken()) {
      originalRequest._retry = true;
      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const refreshResponse = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string; user: any }>>(
              `${apiBase}/auth/refresh`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${getRefreshToken()}`
                }
              }
            );
            const tokens = refreshResponse.data.data;
            saveTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
          } catch (refreshError) {
            clearTokens();
            throw refreshError;
          } finally {
            refreshPromise = null;
          }
        })();
      }

      await refreshPromise;
      const retryToken = getAccessToken();
      if (retryToken && originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${retryToken}`;
      }
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

export async function login(email: string, password: string) {
  const response = await api.post<ApiResponse<{ accessToken: string; refreshToken: string; user: any }>>('/auth/login', { email, password });
  saveTokens({ accessToken: response.data.data.accessToken, refreshToken: response.data.data.refreshToken });
  return response.data.data;
}

export async function register(fullName: string, email: string, password: string) {
  const response = await api.post<ApiResponse<{ accessToken: string; refreshToken: string; user: any }>>('/auth/register', {
    fullName,
    email,
    password
  });
  saveTokens({ accessToken: response.data.data.accessToken, refreshToken: response.data.data.refreshToken });
  return response.data.data;
}

export async function refreshTokens() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  const response = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string; user: any }>>(
    `${apiBase}/auth/refresh`,
    {},
    {
      headers: { Authorization: `Bearer ${refreshToken}` }
    }
  );
  saveTokens({ accessToken: response.data.data.accessToken, refreshToken: response.data.data.refreshToken });
  return response.data.data;
}

export async function logout() {
  await api.post<ApiResponse<null>>('/auth/logout');
  clearTokens();
}

export async function fetchMe() {
  const response = await api.get<ApiResponse<any>>('/auth/me');
  return response.data.data;
}

export async function fetchTemplates() {
  const response = await api.get<ApiResponse<any>>('/templates');
  return response.data.data;
}

export async function fetchTemplate(templateId: string) {
  const response = await api.get<ApiResponse<any>>(`/templates/${templateId}`);
  return response.data.data;
}

export async function createResume(payload: { templateId: string; formData: Record<string, string> }) {
  const response = await api.post<ApiResponse<any>>('/resumes', payload);
  return response.data.data;
}

export async function updateResume(resumeId: string, payload: { formData: Record<string, string>; title?: string; status?: 'draft' | 'published' }) {
  const response = await api.patch<ApiResponse<any>>(`/resumes/${resumeId}`, payload);
  return response.data.data;
}

export async function fetchResume(resumeId: string) {
  const response = await api.get<ApiResponse<any>>(`/resumes/${resumeId}`);
  return response.data.data;
}

export async function fetchMyResumes() {
  const response = await api.get<ApiResponse<any>>('/resumes/my');
  return response.data.data;
}

export async function deleteResume(resumeId: string) {
  await api.delete(`/resumes/${resumeId}`);
}

export async function exportResumePdf(resumeId: string) {
  const response = await api.post(`/resumes/${resumeId}/export`, {}, { responseType: 'blob' });
  return response.data;
}

export default {
  login,
  register,
  refreshTokens,
  logout,
  fetchMe,
  fetchTemplates,
  fetchTemplate,
  createResume,
  updateResume,
  fetchResume,
  fetchMyResumes,
  deleteResume,
  exportResumePdf
};
