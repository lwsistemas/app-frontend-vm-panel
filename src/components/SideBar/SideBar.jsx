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

    return (
        <aside className="w-64 h-screen flex flex-col border-r border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 fixed z-50 top-0 ">
            <div className="p-4 border-b border-white/10 shrink-0">
                <div className="text-lg font-semibold text-white">VM Panel</div>
                <div className="text-xs text-slate-400">Controle de Máquinas Virtuais</div>
            </div>

            <nav className="p-3 flex-1 vm-sidebar-scroll fix">
                {menu.map((group) => (
                    <SidebarGroup key={group.group} group={group.group} items={group.items} />
                ))}
            </nav>
        </aside>
    );
}
