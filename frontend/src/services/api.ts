import axios, { AxiosError } from "axios";
import type { ApiError } from "../types/api.types";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
const TOKEN_STORAGE_KEY = "authToken";

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        if (axios.isAxiosError<ApiError>(error) && error.response?.status === 401) {
            clearAuthToken();

            if (window.location.pathname !== "/login") {
                window.location.assign("/login");
            }
        }

        return Promise.reject(error);
    },
);

export function setAuthToken(token: string) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function getAuthToken() {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function clearAuthToken() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function getApiErrorMessage(error: unknown, fallback = "Erro ao comunicar com o servidor") {
    if (axios.isAxiosError<ApiError>(error)) {
        const axiosError = error as AxiosError<ApiError>;
        return axiosError.response?.data?.message ?? axiosError.response?.data?.error ?? fallback;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return fallback;
}

export default api;
