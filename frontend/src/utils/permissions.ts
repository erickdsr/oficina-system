export type AppRole = "admin" | "gerente" | "vendedor" | "estoquista";

export function normalizeRole(role?: string): AppRole | null {
    const normalizedRole = role?.toLowerCase();

    if (
        normalizedRole === "admin" ||
        normalizedRole === "gerente" ||
        normalizedRole === "vendedor" ||
        normalizedRole === "estoquista"
    ) {
        return normalizedRole;
    }

    return null;
}

export function canManage(role?: string, allowedRoles: AppRole[] = ["admin", "gerente"]) {
    const normalizedRole = normalizeRole(role);
    return normalizedRole ? allowedRoles.includes(normalizedRole) : false;
}

export function canDelete(role?: string) {
    return canManage(role, ["admin", "gerente"]);
}
