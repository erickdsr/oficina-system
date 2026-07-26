import api, { clearAuthSession, setAuthToken } from "./api";
import { normalizeAccessToken } from "./auth-token";
import type { LoginRequest, LoginResponse } from "../types/auth.types";

export const authService = {
    async login(credentials: LoginRequest) {
        const { data } = await api.post<LoginResponse>("/auth/login", credentials);
        const accessToken = normalizeAccessToken(data.accessToken);

        if (!accessToken) {
            throw new Error("Token nao retornado pelo servidor.");
        }

        setAuthToken(accessToken);
        data.accessToken = accessToken;
        return data;
    },

    logout() {
        clearAuthSession();
    },
};

export default authService;
