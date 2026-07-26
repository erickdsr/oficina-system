import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import authService from "../services/auth.service";
import { authStorage } from "../services/auth-storage";
import type { LoginRequest, LoginResponse } from "../types/auth.types";

type AuthUser = Omit<LoginResponse, "accessToken" | "tokenType" | "expiresIn">;

interface AuthContextValue {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isInitializing: boolean;
    login: (credentials: LoginRequest) => Promise<LoginResponse>;
    logout: () => void;
}

interface AuthProviderProps {
    children: ReactNode;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function createAuthUser(response: LoginResponse): AuthUser {
    return {
        employeeId: response.employeeId,
        role: response.role,
        name: response.name,
    };
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [token, setToken] = useState<string | null>(() => authStorage.getToken());
    const [user, setUser] = useState<AuthUser | null>(() => authStorage.getUser<AuthUser>());
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        const storedToken = authStorage.getToken();
        const storedUser = authStorage.getUser<AuthUser>();

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(storedUser);
        } else {
            authStorage.clear();
            setToken(null);
            setUser(null);
        }

        setIsInitializing(false);
    }, []);

    const login = useCallback(async (credentials: LoginRequest) => {
        const response = await authService.login(credentials);
        const authUser = createAuthUser(response);

        authStorage.setUser(authUser);
        setToken(response.accessToken);
        setUser(authUser);

        return response;
    }, []);

    const logout = useCallback(() => {
        authService.logout();
        setToken(null);
        setUser(null);
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            token,
            isAuthenticated: Boolean(token && user),
            isInitializing,
            login,
            logout,
        }),
        [isInitializing, login, logout, token, user],
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
