import { useMemo, useState } from 'react';
import {
    LayoutDashboard,
    Server,
    Users,
    FileText,
    ClipboardList,
    Settings,
    LogOut,
    ChevronDown,
    ChevronRight,
    Layers,
    HardDrive,
    Activity,
    DollarSign,
    Receipt,
    CreditCard,
    LineChart,
    Database,
    LucideServerCog,
    Network,

} from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';

// ✅ IMPORT LOGO (coloque em src/assets/img/logo/logo.png)
import logo from '../assets/img/logo.png';

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user'));

    function logout() {
        localStorage.clear();
        navigate('/login');
    }

    const role = user?.role;
    const isAdmin = ['root', 'admin', 'support'].includes(role);
    const isFinance = ['root', 'admin', 'finance'].includes(role);

    const groups = useMemo(() => {
        return [
            {
                key: 'compute',
                label: 'Compute',
                icon: <Layers size={16} />,
                items: [
                    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
                    { to: '/vms', label: 'VMs', icon: <Server size={16} /> },
                ],
            },

            {
                key: 'providers',
                label: 'Providers/Servers',
                icon: <Server size={16} />,
                items: [
                    { to: '/public-ips', label: 'Public IPs', icon: <Activity size={16} /> },
                    { to: '/infra-ips', label: 'Infra IPs', icon: <Network size={16} /> },
                    { to: '/inventory', label: 'Inventory DC', icon: <Database size={16} /> },
                    { to: '/templates', label: 'Templates', icon: <FileText size={16} /> },


                ],
                adminOnly: true,
            },


            // ✅ FINANCEIRO
            {
                key: 'finance',
                label: 'Financeiro',
                icon: <DollarSign size={16} />,
                items: [
                    { to: '/finance/dashboard', label: 'Resumo', icon: <LineChart size={16} /> },
                    { to: '/finance/invoices', label: 'Faturas', icon: <Receipt size={16} /> },
                    { to: '/finance/payments', label: 'Pagamentos', icon: <CreditCard size={16} /> },
                ],
                financeOnly: true,
            },

            {
                key: 'admin',
                label: 'Admin',
                icon: <Settings size={16} />,
                items: [
                    { to: '/users', label: 'Usuários', icon: <Users size={16} /> },
                    { to: '/logs', label: 'Logs', icon: <FileText size={16} /> },
                    { to: '/tasks', label: 'Tasks', icon: <ClipboardList size={16} /> },
                    { to: '/settings', label: 'Configurações', icon: <Settings size={16} /> },
                ],
                adminOnly: true,
            },
        ];
    }, []);

    // ✅ abre automaticamente o grupo que contém a rota atual
    const initialOpen = useMemo(() => {
        const open = {};
        for (const g of groups) {
            const match = g.items?.some(i =>
                location.pathname === i.to || location.pathname.startsWith(i.to + '/')
            );
            open[g.key] = !!match;
        }
        if (!Object.values(open).some(Boolean)) open.compute = true;
        return open;
    }, [location.pathname, groups]);

    const [openGroups, setOpenGroups] = useState(initialOpen);

    function toggleGroup(key) {
        setOpenGroups(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    }

    return (
        <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col">

            {/* BRAND */}
            <div className="px-6 py-5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <img
                        src={logo}
                        alt="LW Sistemas"
                        className="h-10 w-auto object-contain"
                    />

                    <div className="leading-tight">
                        <h1 className="text-lg font-semibold text-sky-400">
                            VM Panel
                        </h1>
                        <p className="text-xs text-slate-400">
                            Controle de Máquinas Virtuais
                        </p>
                    </div>
                </div>
            </div>

            {/* MENU (scroll) */}
            <div className="flex-1 overflow-y-auto">
                <nav className="px-3 py-4 space-y-4 text-sm">

                    {groups.map(group => {
                        if (group.adminOnly && !isAdmin) return null;
                        if (group.financeOnly && !isFinance) return null;

                        const isOpen = openGroups[group.key];

                        return (
                            <div key={group.key}>
                                {/* GROUP HEADER */}
                                <button
                                    onClick={() => toggleGroup(group.key)}
                                    className="w-full flex items-center justify-between
                                               px-3 py-2 text-xs uppercase tracking-wide
                                               text-slate-400 hover:text-slate-200 transition"
                                >
                                    <span className="flex items-center gap-2">
                                        {group.icon}
                                        {group.label}
                                    </span>

                                    {isOpen ? (
                                        <ChevronDown size={16} className="text-slate-500" />
                                    ) : (
                                        <ChevronRight size={16} className="text-slate-500" />
                                    )}
                                </button>

                                {/* GROUP ITEMS */}
                                {isOpen && (
                                    <div className="mt-1 space-y-1 pl-2">
                                        {group.items.map(item => (
                                            <MenuItem
                                                key={item.to}
                                                to={item.to}
                                                icon={item.icon}
                                                label={item.label}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                </nav>
            </div>

            {/* USER FOOTER */}
            <div className="border-t border-slate-800 p-4">
                <div className="mb-3">
                    <p className="text-sm font-medium">{user?.name || 'Usuário'}</p>
                    <p className="text-xs text-slate-400">{user?.email}</p>
                </div>

                <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 text-sm text-red-400 hover:text-red-300"
                >
                    <LogOut size={16} />
                    Sair
                </button>
            </div>
        </aside>
    );
}

/* ===================== MENU ITEM ===================== */

function MenuItem({ to, icon, label }) {
    return (
        <NavLink
            to={to}
            end
            className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md transition
                 ${isActive
                    ? 'bg-slate-800 text-sky-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-sky-300'}`
            }
        >
            <span className="opacity-90">{icon}</span>
            {label}
        </NavLink>
    );
}
