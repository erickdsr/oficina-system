import { Bell, ChevronDown, LogOut, MonitorCog, Moon, Search, Settings, UserCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/auth.context";

function formatRole(role?: string) {
    if (!role) {
        return "Sem perfil";
    }

    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

export function Header() {
    const { user, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const initials = (user?.name ?? "Usuario")
        .split(" ")
        .map((namePart) => namePart[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <header className="app-header">
            <div className="app-header__title">
                <span className="app-header__eyebrow">System Oficina</span>
                <h1>Gestao da distribuidora</h1>
            </div>

            <div className="app-header__tools">
                <label className="global-search">
                    <Search size={20} aria-hidden="true" />
                    <input type="search" placeholder="Pesquisar no ERP..." aria-label="Pesquisa global" />
                </label>

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
