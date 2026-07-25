export type AppRole = "admin" | "gerente" | "vendedor" | "estoquista";

export function normalizeRole(role?: string): AppRole | null {
    const normalizedRole = role
        ?.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase()
        .replace(/^role[_\s-]*/, "");

    const roleAliases: Record<string, AppRole> = {
        admin: "admin",
        administrador: "admin",
        gerente: "gerente",
        manager: "gerente",
        vendedor: "vendedor",
        estoquista: "estoquista",
    };

    return normalizedRole ? roleAliases[normalizedRole] ?? null : null;
}

export function canManage(role?: string, allowedRoles: AppRole[] = ["admin", "gerente"]) {
    const normalizedRole = normalizeRole(role);
    return normalizedRole ? allowedRoles.includes(normalizedRole) : false;
}

export function canDelete(role?: string) {
    return canManage(role, ["admin", "gerente"]);
}
