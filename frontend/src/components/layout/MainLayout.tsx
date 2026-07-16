import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./SideBar";

export function MainLayout() {
    return (
        <div className="app-shell">
            <Sidebar />
            <div className="app-shell__main">
                <Header />
                <main className="app-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default MainLayout;
