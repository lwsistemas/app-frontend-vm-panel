import SidebarGroup from "./SidebarGroup";
import { SIDEBAR_GROUPS } from "./sidebar.config";
import { useAuth } from "../../context/AuthContext";

export default function SideBar() {
    const { role } = useAuth();

    const menu = SIDEBAR_GROUPS.map((group) => {
        const items = (group.items || []).map((item) => {
            const roles = item.roles || [];
            const allowed = roles.length === 0 ? true : roles.includes(role);

            // mostra sempre se showForAll
            const showForAll = item.showForAll === true;

            if (!allowed && showForAll) {
                return {
                    ...item,
                    disabled: true,
                    tooltip: "Somente suporte / admin",
                };
            }

            // se não for showForAll, esconde de fato
            if (!allowed && !showForAll) return null;

            return { ...item, disabled: false };
        }).filter(Boolean);

        return { ...group, items };
    });

    return (
        <aside className="w-64 h-screen border-r border-white/10 bg-gradient-to-b from-slate-950 to-slate-900">
            <div className="p-4 border-b border-white/10">
                <div className="text-lg font-semibold text-white">VM Panel</div>
                <div className="text-xs text-slate-400">Infra · Cloud · Billing</div>
            </div>

            <nav className="p-3 overflow-y-auto">
                {menu.map((group) => (
                    <SidebarGroup key={group.group} group={group.group} items={group.items} />
                ))}
            </nav>
        </aside>
    );
}
