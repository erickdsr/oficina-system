export const AUTH_STORAGE_KEYS = {
    ACCESS_TOKEN: "accessToken",
    USER: "authenticatedUser",
} as const;

const LEGACY_AUTH_STORAGE_KEYS = ["authToken", "authUser", "token", "jwt", "jwtToken"] as const;

function removeLegacyStorageKeys() {
    LEGACY_AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}

export const authStorage = {
    getToken(): string | null {
        return localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
    },

    setToken(token: string): void {
        localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, token);
        removeLegacyStorageKeys();
    },

    removeToken(): void {
        localStorage.removeItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
    },

    getUser<T>(): T | null {
        const storedUser = localStorage.getItem(AUTH_STORAGE_KEYS.USER);

        if (!storedUser) {
            return null;
        }

        try {
            return JSON.parse(storedUser) as T;
        } catch {
            return null;
        }
    },

    setUser(user: unknown): void {
        localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
        removeLegacyStorageKeys();
    },

    removeUser(): void {
        localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
    },

    clear(): void {
        localStorage.removeItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
        removeLegacyStorageKeys();
    },
};
