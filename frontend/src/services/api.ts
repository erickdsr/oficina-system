import axios, { AxiosError } from "axios";
import { buildAuthorizationHeader, shouldClearAuthenticationForStatus } from "./auth-token";
import { authStorage, AUTH_STORAGE_KEYS as STORAGE_KEYS } from "./auth-storage";
import type { ApiError } from "../types/api.types";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export const AUTH_STORAGE_KEYS = {
    ACCESS_TOKEN: STORAGE_KEYS.ACCESS_TOKEN,
    USER: STORAGE_KEYS.USER,
};

export interface ApiRequestError {
    status: number | null;
    code: string | null;
    message: string;
    details: Record<string, unknown> | null;
    data: unknown;
    method: string | null;
    url: string | null;
    authorizationSent: boolean;
    originalError: unknown;
}

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const authorizationHeader = buildAuthorizationHeader(authStorage.getToken());

    if (authorizationHeader) {
        config.headers.Authorization = authorizationHeader;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        if (axios.isAxiosError<ApiError>(error)) {
            const normalizedError: ApiRequestError = {
                status: error.response?.status ?? null,
                code: error.response?.data?.code ?? null,
                message: error.response?.data?.message ?? error.response?.data?.error ?? "Erro ao comunicar com o servidor.",
                details: error.response?.data?.details ?? null,
                data: error.response?.data ?? null,
                method: error.config?.method ?? null,
                url: error.config?.url ?? null,
                authorizationSent: Boolean(error.config?.headers?.Authorization),
                originalError: error,
            };

            console.error("[HTTP ERROR]", normalizedError);

            if (shouldClearAuthenticationForStatus(normalizedError.status) && normalizedError.url !== "/auth/login") {
                clearAuthSession();
                if (window.location.pathname !== "/login") {
                    window.location.replace("/login");
                }
            }

            return Promise.reject(normalizedError);
        }

        return Promise.reject(error);
    },
);

export function setAuthToken(token: string) {
    authStorage.setToken(token);
}

export function getAuthToken() {
    return authStorage.getToken();
}

export function clearAuthToken() {
    authStorage.removeToken();
}

export function clearAuthSession() {
    authStorage.clear();
}

export function getApiErrorMessage(error: unknown, fallback = "Erro ao comunicar com o servidor") {
    if (isApiRequestError(error)) {
        return error.message || fallback;
    }

    if (axios.isAxiosError<ApiError>(error)) {
        const axiosError = error as AxiosError<ApiError>;
        if (axiosError.response?.status === 403) {
            return axiosError.response.data?.message ?? "Sem permissao para executar esta acao.";
        }
        return axiosError.response?.data?.message ?? axiosError.response?.data?.error ?? fallback;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return fallback;
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
    return typeof error === "object" && error !== null && "status" in error && "message" in error;
}

export default api;
