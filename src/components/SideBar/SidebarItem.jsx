// src/components/SideBar/SidebarItem.jsx
import { NavLink } from "react-router-dom";

export default function SidebarItem({
                                        label,
                                        to,
                                        icon: Icon,
                                        disabled = false,
                                        tooltip,
                                    }) {
    const base =
        "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition border";

    const enabled =
        "border-transparent text-slate-200 hover:bg-white/5 hover:border-white/10";

    const active =
        "bg-white/10 border-white/15 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]";

    const disabledCls =
        "border-transparent text-slate-500 opacity-70 cursor-not-allowed";

    // ✅ Se disabled: aparece, mas não navega
    if (disabled) {
        return (
            <div
                title={tooltip || "Indisponível / sem permissão"}
                className={`${base} ${disabledCls}`}
            >
                {Icon ? <Icon size={18} /> : null}
                <span className="truncate">{label}</span>

                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-lg border border-white/10 bg-white/5 text-slate-400">
          LOCK
        </span>
            </div>
        );
    }

    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `${base} ${enabled} ${isActive ? active : ""}`
            }
            end={to === "/"}
        >
            {Icon ? <Icon size={18} /> : null}
            <span className="truncate">{label}</span>
        </NavLink>
    );
}
