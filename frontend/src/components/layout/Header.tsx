import { Bell, ChevronDown, Home, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Plus, RefreshCcw, Shuffle } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/auth.context";
import { canManage, getRoleLabel } from "../../utils/permissions";

function formatRole(role?: string) {
    if (!role) {
        return "Sem perfil";
    }

    return getRoleLabel(role);
}

interface HeaderProps {
    sidebarCollapsed: boolean;
    onToggleSidebar: () => void;
    onOpenMobileSidebar: () => void;
}

const routeLabels: Record<string, string> = {
    "/": "Home",
    "/home": "Home",
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

const routeSubtitles: Record<string, string> = {
    "/": "Visao geral do sistema",
    "/home": "Visao geral do sistema",
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

function getRouteSubtitle(pathname: string) {
    return routeSubtitles[pathname] ?? "";
}

function getBreadcrumbItems(pathname: string, currentLabel: string) {
    if (pathname === "/" || pathname === "/home") {
        return [];
    }

    if (pathname === "/sales/new") {
        return ["Vendas", currentLabel];
    }

    if (pathname === "/purchases/new") {
        return ["Compras", currentLabel];
    }

    if (pathname.startsWith("/sales/")) {
        return ["Vendas", currentLabel];
    }

    if (pathname.startsWith("/purchases/")) {
        return ["Compras", currentLabel];
    }

    return [];
}

export function Header({ sidebarCollapsed, onToggleSidebar, onOpenMobileSidebar }: HeaderProps) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const currentLabel = getRouteLabel(location.pathname);
    const currentSubtitle = getRouteSubtitle(location.pathname);
    const breadcrumbItems = getBreadcrumbItems(location.pathname, currentLabel);
    const isHome = location.pathname === "/" || location.pathname === "/home";
    const canCreateSales = canManage(user?.role, ["ADMIN", "MANAGER", "SALESPERSON"]);
    const canViewStockMovements = canManage(user?.role, ["ADMIN", "MANAGER", "STOCK", "BUYER"]);
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
                {isHome && (
                    <span className="app-header__page-icon" aria-hidden="true">
                        <Home size={19} />
                    </span>
                )}
                <div className="app-header__title">
                    {breadcrumbItems.length > 0 && (
                        <nav className="breadcrumb" aria-label="Breadcrumb">
                            {breadcrumbItems.map((item, index) => (
                                <span key={`${item}-${index}`}>
                                    {index > 0 && <i aria-hidden="true">/</i>}
                                    {index === breadcrumbItems.length - 1 ? <strong>{item}</strong> : item}
                                </span>
                            ))}
                        </nav>
                    )}
                    <h1>{currentLabel}</h1>
                    {currentSubtitle && <p>{currentSubtitle}</p>}
                </div>
            </div>

            <div className="app-header__tools">
                {canCreateSales && (
                    <Link className="quick-action" to="/sales/new">
                        <Plus size={18} aria-hidden="true" />
                        <span>Nova Venda</span>
                    </Link>
                )}

                {canViewStockMovements && (
                    <Link className="quick-action quick-action--ghost" to="/stock/movements">
                        <Shuffle size={18} aria-hidden="true" />
                        <span>Movimentos</span>
                    </Link>
                )}

                {isHome && (
                    <button type="button" className="quick-action quick-action--ghost" onClick={() => window.dispatchEvent(new CustomEvent("garageos:refresh-dashboard"))}>
                        <RefreshCcw size={18} aria-hidden="true" />
                        <span>Atualizar dados</span>
                    </button>
                )}

                <button type="button" className="header-icon-button header-icon-button--notification" aria-label="Notificacoes">
                    <Bell size={19} aria-hidden="true" />
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
