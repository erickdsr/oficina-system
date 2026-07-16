import { useAuth } from "../../context/auth.context";

function formatRole(role?: string) {
    if (!role) {
        return "Sem perfil";
    }

    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

export function Header() {
    const { user, logout } = useAuth();

    return (
        <header className="app-header">
            <div>
                <span className="app-header__eyebrow">System Oficina</span>
                <h1>Gestao da distribuidora</h1>
            </div>

            <div className="app-header__user">
                <div>
                    <strong>{user?.name ?? "Usuario"}</strong>
                    <span>{formatRole(user?.role)}</span>
                </div>
                <button type="button" onClick={logout}>
                    Sair
                </button>
            </div>
        </header>
    );
}

export default Header;
