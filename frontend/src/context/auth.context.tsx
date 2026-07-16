import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import authService from "../services/auth.service";
import { getAuthToken } from "../services/api";
import type { LoginRequest, LoginResponse } from "../types/auth.types";

type AuthUser = Omit<LoginResponse, "token" | "type">;

interface AuthContextValue {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (credentials: LoginRequest) => Promise<LoginResponse>;
    logout: () => void;
}

interface AuthProviderProps {
    children: ReactNode;
}

const AUTH_USER_STORAGE_KEY = "authUser";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getStoredUser() {
    const storedUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);

    if (!storedUser) {
        return null;
    }

    try {
        return JSON.parse(storedUser) as AuthUser;
    } catch {
        localStorage.removeItem(AUTH_USER_STORAGE_KEY);
        return null;
    }
}

function createAuthUser(response: LoginResponse): AuthUser {
    return {
        employeeId: response.employeeId,
        role: response.role,
        name: response.name,
    };
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
    const [token, setToken] = useState<string | null>(() => getAuthToken());

    const login = useCallback(async (credentials: LoginRequest) => {
        const response = await authService.login(credentials);
        const authUser = createAuthUser(response);

        localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(authUser));
        setUser(authUser);
        setToken(response.token);

        return response;
    }, []);

    const logout = useCallback(() => {
        authService.logout();
        localStorage.removeItem(AUTH_USER_STORAGE_KEY);
        setUser(null);
        setToken(null);
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            token,
            isAuthenticated: Boolean(token),
            login,
            logout,
        }),
        [login, logout, token, user],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth deve ser usado dentro de AuthProvider");
    }

    return context;
}
