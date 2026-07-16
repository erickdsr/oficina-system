import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/auth.context";
import { normalizeRole, type AppRole } from "../../utils/permissions";

interface MenuItem {
    to: string;
    label: string;
    roles: AppRole[];
}

const menuItems: MenuItem[] = [
    { to: "/", label: "Dashboard", roles: ["admin", "gerente", "vendedor", "estoquista"] },
    { to: "/categories", label: "Categorias", roles: ["admin", "gerente", "estoquista"] },
    { to: "/suppliers", label: "Fornecedores", roles: ["admin", "gerente", "estoquista"] },
    { to: "/clients", label: "Clientes", roles: ["admin", "gerente", "vendedor"] },
    { to: "/employees", label: "Funcionarios", roles: ["admin", "gerente"] },
    { to: "/products", label: "Produtos", roles: ["admin", "gerente", "vendedor", "estoquista"] },
    { to: "/stock", label: "Estoque", roles: ["admin", "gerente", "estoquista"] },
    { to: "/stock/movements", label: "Movimentacoes", roles: ["admin", "gerente", "estoquista"] },
    { to: "/purchases", label: "Compras", roles: ["admin", "gerente", "estoquista"] },
    { to: "/sales", label: "Vendas", roles: ["admin", "gerente", "vendedor"] },
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
                        {item.label}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}

export default Sidebar;
