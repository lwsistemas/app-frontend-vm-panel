// src/layouts/MainLayout.jsx
import Header from './components/Header.jsx';
import Sidebar from './components/SideBar/SideBar.jsx';
import { Outlet } from 'react-router-dom';
import ConnectionFooter from "./components/ConnectionFooter.jsx";

export default function MainLayout() {
    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100">
            <Sidebar />

            <div className="flex flex-col flex-1 min-h-screen">
                <Header />

                {/* ✅ main cresce, mas respeita footer */}
                <main className="flex-1 overflow-auto p-6">
                    <Outlet />
                </main>

                <ConnectionFooter
                    api="vmotion.lwsistemas.com.br"
                    ip="104.243.45.21"
                    timezone={Intl.DateTimeFormat().resolvedOptions().timeZone}
                />
            </div>
        </div>
    );
}
