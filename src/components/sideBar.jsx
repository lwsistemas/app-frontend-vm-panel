import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    Server,
    FileText,
    Network,
    Database,
    Users,
} from "lucide-react";

const Item = ({ to, icon: Icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition
            ${isActive
                ? "bg-white/10 text-white"
                : "text-slate-300 hover:bg-white/5 hover:text-white"}`
        }
    >
        <Icon size={18} />
        <span>{label}</span>
    </NavLink>
);

export default function SideBar() {
    return (
        <aside className="w-64 min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 border-r border-white/5">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/5">
                <div className="text-lg font-bold text-white">VM PANEL</div>
                <div className="text-xs text-slate-400">
                    Controle de Máquinas Virtuais
                </div>
            </div>

            {/* Menu */}
            <div className="px-3 py-4 space-y-6">

                {/* COMPUTE */}
                <div>
                    <div className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Compute
                    </div>
                    <div className="space-y-1">
                        <Item
                            to="/dashboard"
                            icon={LayoutDashboard}
                            label="Dashboard"
                        />
                        <Item
                            to="/vms"
                            icon={Server}
                            label="VMs"
                        />
                    </div>
                </div>

                {/* FINANCEIRO */}
                <div>
                    <div className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Financeiro
                    </div>
                    <div className="space-y-1">
                        <Item
                            to="/invoices"
                            icon={FileText}
                            label="Invoices"
                        />
                    </div>
                </div>

                {/* PROVIDERS / NETWORK */}
                <div>
                    <div className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Providers / Network
                    </div>
                    <div className="space-y-1">
                        <Item
                            to="/public-ips"
                            icon={Network}
                            label="Public IPs"
                        />
                        <Item
                            to="/inventory"
                            icon={Database}
                            label="Inventory"
                        />
                    </div>
                </div>

                {/* ADMIN */}
                <div>
                    <div className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Admin
                    </div>
                    <div className="space-y-1">
                        <Item
                            to="/users"
                            icon={Users}
                            label="Users"
                        />
                    </div>
                </div>

            </div>
        </aside>
    );
}
