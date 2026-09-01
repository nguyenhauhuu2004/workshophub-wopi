import axios, { type InternalAxiosRequestConfig } from "axios";

import { useAuthStore } from "@/stores/useAuthStore";

type RetryRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const api = axios.create({
  baseURL:
    // import.meta.env.VITE_API_URL,

    import.meta.env.MODE === "development"
      ? "http://localhost:5001/api"
      : "/api",

  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = async (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = api
      .post<{
        accessToken: string;
      }>("/auth/refresh")
      .then((response) => {
        const accessToken = response.data.accessToken;

        useAuthStore.getState().setAccessToken(accessToken);

        return accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config as RetryRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url ?? "";

    const isAuthRequest =
      requestUrl.includes("/auth/signin") ||
      requestUrl.includes("/auth/signup") ||
      requestUrl.includes("/auth/refresh") ||
      requestUrl.includes("/auth/google");

    if (isAuthRequest) {
      return Promise.reject(error);
    }

    const status = error.response?.status;

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().clearState();

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
