import {
    LayoutDashboard,
    Package,
    Receipt,
    ShoppingCart,
    Tag,
    Truck,
    UserCheck,
    Users,
    Warehouse,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/auth.context";
import { normalizeRole, type AppRole } from "../../utils/permissions";

type MenuIcon = ComponentType<SVGProps<SVGSVGElement>>;

interface MenuItem {
    to: string;
    label: string;
    roles: AppRole[];
    icon: MenuIcon;
}

const menuItems: MenuItem[] = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "gerente", "vendedor", "estoquista"] },
    { to: "/employees", label: "Funcionarios", icon: Users, roles: ["admin", "gerente"] },
    { to: "/clients", label: "Clientes", icon: UserCheck, roles: ["admin", "gerente", "vendedor"] },
    { to: "/suppliers", label: "Fornecedores", icon: Truck, roles: ["admin", "gerente", "estoquista"] },
    { to: "/categories", label: "Categorias", icon: Tag, roles: ["admin", "gerente", "estoquista"] },
    { to: "/products", label: "Produtos", icon: Package, roles: ["admin", "gerente", "vendedor", "estoquista"] },
    { to: "/stock", label: "Estoque", icon: Warehouse, roles: ["admin", "gerente", "estoquista"] },
    { to: "/purchases", label: "Compras", icon: ShoppingCart, roles: ["admin", "gerente", "estoquista"] },
    { to: "/sales", label: "Vendas", icon: Receipt, roles: ["admin", "gerente", "vendedor"] },
];

export function Sidebar() {
    const { user } = useAuth();
    const role = normalizeRole(user?.role);

    const visibleItems = role ? menuItems.filter((item) => item.roles.includes(role)) : [];

    return (
        <aside className="app-sidebar">
            <div className="app-sidebar__brand">
                <strong>Oficina</strong>
                <span>Autopecas</span>
            </div>

            <nav className="app-sidebar__nav" aria-label="Menu principal">
                {visibleItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === "/"}
                        className={({ isActive }: { isActive: boolean }) => (isActive ? "active" : undefined)}
                    >
                        <item.icon width={18} height={18} aria-hidden="true" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}

export default Sidebar;
