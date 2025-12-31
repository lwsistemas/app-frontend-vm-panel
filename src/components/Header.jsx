import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Bell,
    AlertTriangle,
    CheckCircle,
    XCircle,
    User,
    LogOut
} from "lucide-react";

import api from "../services";

export default function Header() {
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role;

    const isAdmin = ["root", "admin", "support"].includes(role);

    const [openUser, setOpenUser] = useState(false);
    const [openAlerts, setOpenAlerts] = useState(false);

    const [alerts, setAlerts] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingAlerts, setLoadingAlerts] = useState(false);

    const alertsRef = useRef(null);
    const userRef = useRef(null);

    /* =============================
     * LOGOUT
     * ============================= */
    function logout() {
        localStorage.clear();
        navigate("/login");
    }

    /* =============================
     * LOAD ALERTS
     * ============================= */
    async function loadAlerts() {
        if (!isAdmin) return;

        try {
            setLoadingAlerts(true);

            const { data } = await api.get("/alerts", {
                params: {
                    limit: 10,
                    status: "open",
                }
            });

            if (data?.success) {
                setAlerts(data.rows || []);
                setUnreadCount(data.unreadCount || 0);
            } else {
                // fallback caso backend retorne lista pura
                if (Array.isArray(data)) {
                    setAlerts(data);
                    setUnreadCount(data.length);
                }
            }
        } catch (e) {
            console.log("[ALERTS][LOAD]", e.message);
        } finally {
            setLoadingAlerts(false);
        }
    }

    useEffect(() => {
        if (!isAdmin) return;

        loadAlerts();
        const t = setInterval(loadAlerts, 20000);
        return () => clearInterval(t);
    }, [isAdmin]);

    /* =============================
     * CLICK OUTSIDE (close dropdowns)
     * ============================= */
    useEffect(() => {
        function handleClick(e) {
            if (openAlerts && alertsRef.current && !alertsRef.current.contains(e.target)) {
                setOpenAlerts(false);
            }
            if (openUser && userRef.current && !userRef.current.contains(e.target)) {
                setOpenUser(false);
            }
        }

        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [openAlerts, openUser]);

    /* =============================
     * ACTIONS
     * ============================= */
    async function markRead(id) {
        try {
            await api.post(`/alerts/${id}/read`);
            await loadAlerts();
        } catch (e) {
            console.log("[ALERT][READ]", e.message);
        }
    }

    async function resolveAlert(id) {
        try {
            await api.post(`/alerts/${id}/resolve`);
            await loadAlerts();
        } catch (e) {
            console.log("[ALERT][RESOLVE]", e.message);
        }
    }

    function iconByType(type) {
        if (type === "error") return <XCircle size={16} className="text-red-400" />;
        if (type === "warning") return <AlertTriangle size={16} className="text-yellow-400" />;
        if (type === "success") return <CheckCircle size={16} className="text-emerald-400" />;
        return <CheckCircle size={16} className="text-sky-400" />;
    }

    function formatDate(dt) {
        try {
            return new Date(dt).toLocaleString();
        } catch {
            return "";
        }
    }

    return (
        <header className="bg-slate-900 border-b border-slate-800">
            <div className="px-6 h-16 flex items-center justify-between">

                {/* BRAND */}
                <div
                    onClick={() => navigate("/")}
                    className="cursor-pointer select-none"
                >
                    {/* opcional */}
                </div>

                {/* RIGHT */}
                <div className="flex items-center gap-4">

                    {/* ALERTS */}
                    {isAdmin && (
                        <div className="relative" ref={alertsRef}>
                            <button
                                onClick={() => {
                                    setOpenAlerts(!openAlerts);
                                    setOpenUser(false);
                                    loadAlerts();
                                }}
                                className="relative p-2 rounded-lg hover:bg-slate-800"
                                title="Alertas"
                            >
                                <Bell size={18} />

                                {unreadCount > 0 && (
                                    <span
                                        className="absolute top-1 right-1 min-w-[18px] h-[18px]
                                        px-1 rounded-full bg-red-600 text-[10px]
                                        flex items-center justify-center"
                                    >
                                        {unreadCount > 99 ? "99+" : unreadCount}
                                    </span>
                                )}
                            </button>

                            {openAlerts && (
                                <div
                                    className="absolute right-0 top-12 w-96
                                    bg-slate-900 border border-slate-800
                                    rounded-lg shadow-lg z-50 overflow-hidden"
                                >
                                    <div
                                        className="px-4 py-3 text-xs text-slate-400
                                        border-b border-slate-800 flex justify-between"
                                    >
                                        <span>Alertas do sistema</span>
                                        <button
                                            onClick={() => setOpenAlerts(false)}
                                            className="hover:text-slate-200"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {loadingAlerts ? (
                                        <div className="px-4 py-4 text-sm text-slate-400">
                                            Carregando alertas...
                                        </div>
                                    ) : alerts.length === 0 ? (
                                        <div className="px-4 py-4 text-sm text-slate-400">
                                            Nenhum alerta pendente 🎉
                                        </div>
                                    ) : (
                                        <div className="max-h-[360px] overflow-auto">
                                            {alerts.map(a => (
                                                <div
                                                    key={a.id}
                                                    className="px-4 py-3 border-b border-slate-800
                                                    hover:bg-slate-800 transition"
                                                >
                                                    <div className="flex gap-3">
                                                        {iconByType(a.type)}

                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium">
                                                                {a.title}
                                                            </div>

                                                            <div className="text-xs text-slate-400 mt-1">
                                                                {a.message}
                                                            </div>

                                                            <div className="text-[11px] text-slate-500 mt-2">
                                                                {formatDate(a.createdAt)}
                                                            </div>

                                                            <div className="flex gap-2 mt-3">
                                                                {!a.is_read && (
                                                                    <button
                                                                        onClick={() => markRead(a.id)}
                                                                        className="px-2 py-1 text-xs
                                                                        rounded bg-slate-700 hover:bg-slate-600"
                                                                    >
                                                                        Marcar lido
                                                                    </button>
                                                                )}

                                                                <button
                                                                    onClick={() => resolveAlert(a.id)}
                                                                    className="px-2 py-1 text-xs
                                                                    rounded bg-emerald-700 hover:bg-emerald-600"
                                                                >
                                                                    Resolver
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* USER INFO */}
                    <div className="hidden sm:block text-right">
                        <div className="text-sm">{user?.name}</div>
                        <div className="text-xs text-slate-400">{user?.email}</div>
                    </div>

                    {/* AVATAR */}
                    <div className="relative" ref={userRef}>
                        <button
                            onClick={() => {
                                setOpenUser(!openUser);
                                setOpenAlerts(false);
                            }}
                            className="w-9 h-9 rounded-full bg-slate-700
                            flex items-center justify-center font-semibold"
                            title="Conta"
                        >
                            {user?.login?.slice(0, 2)?.toUpperCase() || "US"}
                        </button>

                        {openUser && (
                            <div
                                className="absolute right-0 top-14 w-44
                                bg-slate-900 border border-slate-800
                                rounded-lg shadow-lg z-50"
                            >
                                <button
                                    onClick={() => {
                                        setOpenUser(false);
                                        navigate("/profile");
                                    }}
                                    className="flex gap-2 w-full px-4 py-2 text-sm hover:bg-slate-800"
                                >
                                    <User size={14} /> Perfil
                                </button>

                                <div className="border-t border-slate-800 my-1" />

                                <button
                                    onClick={logout}
                                    className="flex gap-2 w-full px-4 py-2 text-sm
                                    text-red-400 hover:bg-slate-800"
                                >
                                    <LogOut size={14} /> Sair
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </header>
    );
}
