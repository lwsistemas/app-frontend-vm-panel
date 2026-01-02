import SidebarGroup from "./SidebarGroup";
import SidebarItem from "./SidebarItem";
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
                {SIDEBAR_MENU.map((entry, idx) => {
                    // ✅ Caso 1: item direto (ex: Dashboard)
                    if (entry?.to && entry?.label) {
                        return (
                            <div key={entry.to || `${entry.label}-${idx}`} className="mb-4">
                                <SidebarItem {...entry} />
                            </div>
                        );
                    }

                    // ✅ Caso 2: grupo com items
                    if (entry?.group && Array.isArray(entry.items)) {
                        return (
                            <SidebarGroup
                                key={entry.group}
                                title={entry.group}
                                items={entry.items}
                            />
                        );
                    }

                    // ✅ Entrada inválida (evita render lixo)
                    return null;
                })}
            </nav>
        </aside>
    );
}
