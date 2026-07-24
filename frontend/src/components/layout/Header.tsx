import { Bell, ChevronDown, LogOut, Menu, MonitorCog, Moon, PanelLeftClose, PanelLeftOpen, Plus, Search, Settings, UserCircle, Zap } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/auth.context";

function formatRole(role?: string) {
    if (!role) {
        return "Sem perfil";
    }

    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

interface HeaderProps {
    sidebarCollapsed: boolean;
    onToggleSidebar: () => void;
    onOpenMobileSidebar: () => void;
}

const routeLabels: Record<string, string> = {
    "/": "Dashboard",
    "/categories": "Categorias",
    "/suppliers": "Fornecedores",
    "/clients": "Clientes",
    "/employees": "Funcionarios",
    "/products": "Produtos",
    "/stock": "Estoque",
    "/stock/movements": "Movimentacoes",
    "/purchases": "Compras",
    "/purchases/new": "Nova compra",
    "/sales": "Vendas",
    "/sales/new": "Nova venda",
};

function getRouteLabel(pathname: string) {
    if (routeLabels[pathname]) {
        return routeLabels[pathname];
    }

    if (pathname.startsWith("/purchases/")) {
        return "Detalhe da compra";
    }

    if (pathname.startsWith("/sales/")) {
        return "Detalhe da venda";
    }

    return "GarageOS";
}

export function Header({ sidebarCollapsed, onToggleSidebar, onOpenMobileSidebar }: HeaderProps) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const currentLabel = getRouteLabel(location.pathname);
    const initials = (user?.name ?? "Usuario")
        .split(" ")
        .map((namePart) => namePart[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <header className="app-header">
            <div className="app-header__leading">
                <button type="button" className="header-icon-button header-icon-button--mobile" aria-label="Abrir menu" onClick={onOpenMobileSidebar}>
                    <Menu size={21} aria-hidden="true" />
                </button>
                <button type="button" className="header-icon-button header-icon-button--desktop" aria-label="Recolher menu" onClick={onToggleSidebar}>
                    {sidebarCollapsed ? <PanelLeftOpen size={21} aria-hidden="true" /> : <PanelLeftClose size={21} aria-hidden="true" />}
                </button>
                <div className="app-header__title">
                    <nav className="breadcrumb" aria-label="Breadcrumb">
                        <span>GarageOS</span>
                        <span>/</span>
                        <strong>{currentLabel}</strong>
                    </nav>
                    <h1>{currentLabel}</h1>
                </div>
            </div>

            <div className="app-header__tools">
                <label className="global-search">
                    <Search size={20} aria-hidden="true" />
                    <input type="search" placeholder="Pesquisar no ERP..." aria-label="Pesquisa global" />
                </label>

                <Link className="quick-action" to="/sales/new">
                    <Plus size={18} aria-hidden="true" />
                    <span>Venda</span>
                </Link>

                <Link className="quick-action quick-action--ghost" to="/stock/movements">
                    <Zap size={18} aria-hidden="true" />
                    <span>Movimentos</span>
                </Link>

                <button type="button" className="header-icon-button" aria-label="Notificacoes">
                    <Bell size={20} aria-hidden="true" />
                    <span className="notification-dot" aria-hidden="true" />
                </button>

                <button type="button" className="header-icon-button" aria-label="Alternar tema">
                    <Moon size={20} aria-hidden="true" />
                </button>

                <div className="user-menu">
                    <button
                        type="button"
                        className="user-menu__trigger"
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((current) => !current)}
                    >
                        <span className="user-avatar" aria-hidden="true">{initials}</span>
                        <span className="user-menu__identity">
                            <strong>{user?.name ?? "Usuario"}</strong>
                            <span>{formatRole(user?.role)}</span>
                        </span>
                        <ChevronDown size={20} aria-hidden="true" />
                    </button>

                    {menuOpen && (
                        <div className="user-menu__dropdown" role="menu">
                            <div className="user-menu__summary">
                                <span className="user-avatar user-avatar--large" aria-hidden="true">{initials}</span>
                                <div>
                                    <strong>{user?.name ?? "Usuario"}</strong>
                                    <span>{formatRole(user?.role)}</span>
                                </div>
                            </div>
                            <button type="button" role="menuitem">
                                <UserCircle size={20} aria-hidden="true" />
                                Perfil
                            </button>
                            <button type="button" role="menuitem">
                                <Settings size={20} aria-hidden="true" />
                                Configuracoes
                            </button>
                            <button type="button" role="menuitem">
                                <MonitorCog size={20} aria-hidden="true" />
                                Tema
                            </button>
                            <button type="button" role="menuitem" className="user-menu__danger" onClick={logout}>
                                <LogOut size={20} aria-hidden="true" />
                                Sair
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;
