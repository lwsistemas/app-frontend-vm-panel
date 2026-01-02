import SidebarGroup from "./SidebarGroup";
import { SIDEBAR_MENU } from "./sidebar.config";

export default function Sidebar() {
    return (
        <aside className="w-64 h-screen border-r border-white/10 bg-gradient-to-b from-slate-950 to-slate-900">
            <div className="p-4 border-b border-white/10">
                <div className="text-lg font-semibold text-white">VM Panel</div>
                <div className="text-xs text-slate-400">
                    Controle de Máquinas Virtuais
                </div>
            </div>

            <nav className="p-3 overflow-y-auto">
                {SIDEBAR_MENU.map((group) => (
                    <SidebarGroup
                        key={group.group}
                        title={group.group}
                        items={group.items}
                    />
                ))}
            </nav>
        </aside>
    );
}
