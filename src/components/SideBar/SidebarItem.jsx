import { NavLink } from "react-router-dom";

export default function SidebarItem({
                                        label,
                                        to,
                                        icon: Icon,
                                        disabled = false,
                                    }) {
    if (!label) return null;

    if (disabled) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md text-slate-500 opacity-60 cursor-not-allowed select-none">
                {Icon && <Icon size={18} />}
                <span className="text-sm">{label}</span>
            </div>
        );
    }

    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                [
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition",
                    isActive
                        ? "bg-white/10 text-white"
                        : "text-slate-300 hover:bg-white/5 hover:text-white",
                ].join(" ")
            }
        >
            {Icon && <Icon size={18} />}
            <span>{label}</span>
        </NavLink>
    );
}
