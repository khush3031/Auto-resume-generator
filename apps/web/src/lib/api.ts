import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { ApiResponse } from '@resumeforge/shared';

const storageKey = 'resumeforge-auth';
const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type ResumeExportFormat = 'pdf' | 'doc' | 'docx';

function getCookieAttributes(maxAgeSeconds: number) {
  const attributes = [`path=/`, `max-age=${maxAgeSeconds}`, `samesite=strict`];
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    attributes.push('secure');
  }
  return attributes.join('; ');
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
  document.cookie = `accessToken=${tokens.accessToken}; ${getCookieAttributes(900)}`;
  document.cookie = `refreshToken=${tokens.refreshToken}; ${getCookieAttributes(7 * 24 * 60 * 60)}`;
}

function clearTokens() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(storageKey);
  document.cookie = `accessToken=; ${getCookieAttributes(0)}`;
  document.cookie = `refreshToken=; ${getCookieAttributes(0)}`;
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

export async function register(fullName: string, email: string, password: string, agreedToTerms = false) {
  const response = await api.post<ApiResponse<{ accessToken: string; refreshToken: string; user: any }>>('/auth/register', {
    fullName,
    email,
    password,
    agreedToTerms,
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

/**
 * Fetch the saved form-data profile for the logged-in user.
 * Returns an empty object if the user has no saved profile yet.
 */
export async function fetchUserResumeDetails(): Promise<Record<string, string>> {
  const response = await api.get<ApiResponse<Record<string, string>>>('/resumes/my-details');
  return response.data.data ?? {};
}

/**
 * Save (upsert) the form-data profile for the logged-in user.
 * Called debounced from BuilderShell whenever the user edits any field.
 */
export async function saveUserResumeDetails(formData: Record<string, string>): Promise<Record<string, string>> {
  const response = await api.patch<ApiResponse<Record<string, string>>>('/resumes/my-details', { formData });
  return response.data.data ?? {};
}

export async function exportResumePdf(resumeId: string, formData?: Record<string, string>) {
  return exportResumeFile(resumeId, 'pdf', formData);
}

export async function exportResumeFile(
  resumeId: string,
  format: ResumeExportFormat,
  formData?: Record<string, string>,
) {
  const mimeTypes: Record<ResumeExportFormat, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };

  const response = await api.post(
    `/resumes/${resumeId}/export`,
    formData ? { format, formData } : { format },
    { responseType: 'blob' },
  );
  const contentDisposition = response.headers['content-disposition'] as string | undefined;
  const fileNameMatch = contentDisposition?.match(/filename="([^"]+)"/i);
  return {
    blob: response.data,
    fileName: fileNameMatch?.[1] ?? `resume-${resumeId}.${format}`,
    mimeType: mimeTypes[format],
  };
}

export { api };

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
  exportResumeFile,
  exportResumePdf,
  fetchUserResumeDetails,
  saveUserResumeDetails,
};
