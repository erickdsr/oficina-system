import {
    BarChart3,
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
import logo from "../../assets/logo-transaparente -2.0.png";
import { useAuth } from "../../context/auth.context";
import { canManage, getRoleLabel, type AppRole } from "../../utils/permissions";

type MenuIcon = ComponentType<SVGProps<SVGSVGElement>>;

interface MenuItem {
    to: string;
    label: string;
    roles: AppRole[];
    icon: MenuIcon;
    section: "GERAL" | "CADASTROS" | "MOVIMENTACOES" | "RELATORIOS" | "SISTEMA";
}

const menuItems: MenuItem[] = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, section: "GERAL", roles: ["ADMIN", "MANAGER", "SALESPERSON", "STOCK"] },
    { to: "/clients", label: "Clientes", icon: UserCheck, section: "CADASTROS", roles: ["ADMIN", "MANAGER", "SALESPERSON"] },
    { to: "/suppliers", label: "Fornecedores", icon: Truck, section: "CADASTROS", roles: ["ADMIN", "MANAGER", "STOCK"] },
    { to: "/employees", label: "Funcionarios", icon: Users, section: "CADASTROS", roles: ["ADMIN"] },
    { to: "/categories", label: "Categorias", icon: Tag, section: "CADASTROS", roles: ["ADMIN", "MANAGER"] },
    { to: "/products", label: "Produtos", icon: Package, section: "CADASTROS", roles: ["ADMIN", "MANAGER", "SALESPERSON", "STOCK"] },
    { to: "/stock", label: "Estoque", icon: Warehouse, section: "MOVIMENTACOES", roles: ["ADMIN", "MANAGER", "STOCK"] },
    { to: "/purchases", label: "Compras", icon: ShoppingCart, section: "MOVIMENTACOES", roles: ["ADMIN", "MANAGER", "STOCK"] },
    { to: "/sales", label: "Vendas", icon: Receipt, section: "MOVIMENTACOES", roles: ["ADMIN", "MANAGER", "SALESPERSON"] },
    { to: "/stock/movements", label: "Movimentacoes", icon: BarChart3, section: "RELATORIOS", roles: ["ADMIN", "MANAGER", "STOCK"] },
];

interface SidebarProps {
    collapsed?: boolean;
    onNavigate?: () => void;
}

const sections: MenuItem["section"][] = ["GERAL", "CADASTROS", "MOVIMENTACOES", "RELATORIOS", "SISTEMA"];

export function Sidebar({ collapsed = false, onNavigate }: SidebarProps) {
    const { user } = useAuth();

    const visibleItems = menuItems.filter((item) => canManage(user?.role, item.roles));

    return (
        <aside className={`app-sidebar${collapsed ? " app-sidebar--collapsed" : ""}`}>
            <div className="app-sidebar__brand">
                <img className="app-sidebar__brand-logo" src={logo} alt="GarageOS" />
                <div className="app-sidebar__brand-copy">
                    <strong>GarageOS</strong>
                    <span>ERP automotivo</span>
                </div>
            </div>

            <nav className="app-sidebar__nav" aria-label="Menu principal">
                {sections.map((section) => {
                    const sectionItems = visibleItems.filter((item) => item.section === section);

                    if (sectionItems.length === 0 && section !== "SISTEMA") {
                        return null;
                    }

                    return (
                        <div className="app-sidebar__group" key={section}>
                            <span className="app-sidebar__group-title">{section}</span>
                            {section === "SISTEMA" ? (
                                <div className="app-sidebar__system-card">
                                    <strong>{user?.name ?? "Usuario"}</strong>
                                    <span>{getRoleLabel(user?.role)}</span>
                                </div>
                            ) : sectionItems.map((item) => (
                                <NavLink
                                    key={`${item.section}-${item.to}-${item.label}`}
                                    to={item.to}
                                    end={item.to === "/"}
                                    className={({ isActive }: { isActive: boolean }) => (isActive ? "active" : undefined)}
                                    onClick={onNavigate}
                                    title={collapsed ? item.label : undefined}
                                >
                                    <item.icon width={22} height={22} aria-hidden="true" />
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
}

export default Sidebar;
