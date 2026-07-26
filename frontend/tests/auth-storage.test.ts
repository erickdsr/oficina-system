import assert from "node:assert/strict";
import test from "node:test";

class MemoryStorage {
    private readonly values = new Map<string, string>();

    getItem(key: string) {
        return this.values.get(key) ?? null;
    }

    setItem(key: string, value: string) {
        this.values.set(key, value);
    }

    removeItem(key: string) {
        this.values.delete(key);
    }

    clear() {
        this.values.clear();
    }
}

Object.defineProperty(globalThis, "localStorage", {
    value: new MemoryStorage(),
    configurable: true,
});

const { authStorage, AUTH_STORAGE_KEYS } = await import("../src/services/auth-storage.ts");

test("stores the login session with the canonical accessToken key", () => {
    localStorage.clear();

    authStorage.setToken("jwt-token");
    authStorage.setUser({ employeeId: 1, role: "ROLE_ADMIN", name: "Admin" });

    assert.equal(localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN), "jwt-token");
    assert.deepEqual(authStorage.getUser(), { employeeId: 1, role: "ROLE_ADMIN", name: "Admin" });
});

test("removes legacy token keys when saving a fresh session", () => {
    localStorage.clear();
    localStorage.setItem("authToken", "old");
    localStorage.setItem("token", "old");
    localStorage.setItem("jwt", "old");
    localStorage.setItem("jwtToken", "old");

    authStorage.setToken("fresh-token");
    authStorage.setUser({ employeeId: 1, role: "ROLE_ADMIN", name: "Admin" });

    assert.equal(localStorage.getItem("authToken"), null);
    assert.equal(localStorage.getItem("token"), null);
    assert.equal(localStorage.getItem("jwt"), null);
    assert.equal(localStorage.getItem("jwtToken"), null);
    assert.equal(authStorage.getToken(), "fresh-token");
});

test("clears token and user together on logout or unauthorized session", () => {
    authStorage.setToken("jwt-token");
    authStorage.setUser({ employeeId: 1, role: "ROLE_ADMIN", name: "Admin" });

    authStorage.clear();

    assert.equal(authStorage.getToken(), null);
    assert.equal(authStorage.getUser(), null);
});

test("returns null for corrupted user payloads instead of authenticating partially", () => {
    localStorage.clear();
    localStorage.setItem(AUTH_STORAGE_KEYS.USER, "{invalid-json");

    assert.equal(authStorage.getUser(), null);
});
