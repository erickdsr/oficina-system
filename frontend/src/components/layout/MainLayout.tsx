import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./SideBar";

export function MainLayout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    return (
        <div className={`app-shell${sidebarCollapsed ? " app-shell--collapsed" : ""}${mobileSidebarOpen ? " app-shell--sidebar-open" : ""}`}>
            <button
                type="button"
                className="sidebar-backdrop"
                aria-label="Fechar menu"
                onClick={() => setMobileSidebarOpen(false)}
            />
            <Sidebar collapsed={sidebarCollapsed} onNavigate={() => setMobileSidebarOpen(false)} />
            <div className="app-shell__main">
                <Header
                    sidebarCollapsed={sidebarCollapsed}
                    onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
                    onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
                />
                <main className="app-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default MainLayout;
