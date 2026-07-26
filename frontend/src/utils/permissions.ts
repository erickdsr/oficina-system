export type AppRole = "ADMIN" | "MANAGER" | "SALESPERSON" | "STOCK";

export function normalizeRole(role?: string): AppRole | null {
    const normalizedRole = role
        ?.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase()
        .replace(/^role[_\s-]*/, "")
        .replace(/[_\s-]+/g, " ")
        .trim();

    const roleAliases: Record<string, AppRole> = {
        admin: "ADMIN",
        administrador: "ADMIN",
        "administrador do sistema": "ADMIN",
        manager: "MANAGER",
        gerente: "MANAGER",
        salesperson: "SALESPERSON",
        "sales person": "SALESPERSON",
        seller: "SALESPERSON",
        vendedor: "SALESPERSON",
        stock: "STOCK",
        stockkeeper: "STOCK",
        estoque: "STOCK",
        estoquista: "STOCK",
    };

    return normalizedRole ? roleAliases[normalizedRole] ?? null : null;
}

export function canManage(role?: string, allowedRoles: AppRole[] = ["ADMIN", "MANAGER"]) {
    const normalizedRole = normalizeRole(role);
    return normalizedRole ? normalizedRole === "ADMIN" || allowedRoles.includes(normalizedRole) : false;
}

export function canDelete(role?: string, allowedRoles: AppRole[] = ["ADMIN", "MANAGER"]) {
    return canManage(role, allowedRoles);
}

export function getRoleLabel(role?: string) {
    const normalizedRole = normalizeRole(role);
    const roleLabels: Record<AppRole, string> = {
        ADMIN: "Admin",
        MANAGER: "Gerente",
        SALESPERSON: "Vendedor",
        STOCK: "Estoquista",
    };

    return normalizedRole ? roleLabels[normalizedRole] : role ?? "Sem perfil";
}
