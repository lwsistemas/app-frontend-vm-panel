// src/components/SideBar/SideBar.jsx
import SidebarGroup from "./SidebarGroup";
import { SIDEBAR_MENU } from "./sidebar.config";
import { getRoleFromStorage, isPrivilegedRole } from "./getUserFromStorage";
import "./sidebar.scroll.css";

function shouldLockGroup(groupName, isPrivileged) {
    const lockedGroups = ["Datacenter", "Admin", "System"];
    if (isPrivileged) return false;
    return lockedGroups.includes(groupName);
}

export default function SideBar() {
    const role = getRoleFromStorage();
    const privileged = isPrivilegedRole(role);

    const menu = SIDEBAR_MENU.map((group) => {
        const lockGroup = shouldLockGroup(group.group, privileged);

        const items = (group.items || []).map((item) => {
            if (lockGroup) {
                return { ...item, disabled: true, tooltip: "Somente suporte / admin" };
            }
            return { ...item, disabled: !!item.disabled };
        });

        return { ...group, items };
    });
//
    return (
        <aside className="fixed left-0 top-0 z-40 w-64 h-screen flex flex-col border-r border-white/10 bg-gradient-to-b from-slate-950 to-slate-900">
            {/* Header / Logo */}
            <div className="px-4 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-slate-100">VM</span>
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-100 truncate">VM Panel</div>
                        <div className="text-[11px] text-slate-400 truncate">Infra • Cloud • Billing</div>
                    </div>
                </div>
            </div>

            {/* Menu (scroll) */}
            <div className="flex-1 overflow-y-auto px-2 py-3">
                {menu.map((group) => (
                    <SidebarGroup key={group.group} group={group.group} items={group.items} />
                ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-white/10">
                <div className="text-[11px] text-slate-400">© LW SOLUÇÕES</div>
            </div>
        </aside>

    );
}
