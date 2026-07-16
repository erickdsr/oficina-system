import api, { clearAuthToken, setAuthToken } from "./api";
import type { LoginRequest, LoginResponse } from "../types/auth.types";

export const authService = {
    async login(credentials: LoginRequest) {
        const { data } = await api.post<LoginResponse>("/auth/login", credentials);
        setAuthToken(data.token);
        return data;
    },

    logout() {
        clearAuthToken();
    },
};

export default authService;
