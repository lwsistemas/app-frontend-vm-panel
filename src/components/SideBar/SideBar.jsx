import SidebarGroup from "./SidebarGroup";
import SidebarItem from "./SidebarItem";
import { SIDEBAR_MENU } from "./sidebar.config";

export default function Sidebar() {
    return (
        <aside className="w-64 h-screen border-r border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col">
            {/* Header fixo */}
            <div className="p-4 border-b border-white/10 shrink-0">
                <div className="text-lg font-semibold text-white">VM Panel</div>
                <div className="text-xs text-slate-400">
                    Controle de Máquinas Virtuais
                </div>
            </div>

            {/* ✅ Área rolável */}
            <nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden">
                {SIDEBAR_MENU.map((entry, idx) => {
                    // Item direto
                    if (entry?.to && entry?.label) {
                        return (
                            <div
                                key={entry.to || `${entry.label}-${idx}`}
                                className="mb-3"
                            >
                                <SidebarItem {...entry} />
                            </div>
                        );
                    }

                    // Grupo
                    if (entry?.group && Array.isArray(entry.items)) {
                        return (
                            <SidebarGroup
                                key={entry.group}
                                title={entry.group}
                                items={entry.items}
                            />
                        );
                    }

                    return null;
                })}
            </nav>

            {/* Rodapé opcional (se quiser) */}
            {/* <div className="p-3 border-t border-white/10 text-xs text-slate-500 shrink-0">
                v0.1
            </div> */}
        </aside>
    );
}
