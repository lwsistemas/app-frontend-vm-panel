import { useEffect, useState } from 'react';
import { Bell, CheckCircle2, XCircle, RefreshCcw } from 'lucide-react';
import { fetchAlerts, markAlertRead, resolveAlert } from '../../services/alerts';

export default function AlertsDropdown() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    async function loadAlerts() {
        setLoading(true);
        try {
            const res = await fetchAlerts({ unread: 0, limit: 10, status: 'open' });
            if (res?.success) {
                setAlerts(res.rows || []);
                setUnreadCount(res.unreadCount || 0);
            }
        } finally {
            setLoading(false);
        }
    }

    async function onRead(id) {
        await markAlertRead(id);
        await loadAlerts();
    }

    async function onResolve(id) {
        await resolveAlert(id);
        await loadAlerts();
    }

    useEffect(() => {
        loadAlerts();

        const t = setInterval(() => {
            loadAlerts();
        }, 15000);

        return () => clearInterval(t);
    }, []);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(v => !v)}
                className="relative p-2 rounded-xl hover:bg-slate-800 transition"
                title="Alertas"
            >
                <Bell className="w-5 h-5 text-slate-200" />

                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-bold
                                     bg-red-600 text-white flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div
                    className="absolute right-0 mt-2 w-96 max-w-[92vw] rounded-2xl border border-slate-800 bg-slate-950 shadow-xl overflow-hidden z-50"
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                        <div>
                            <p className="text-sm font-semibold">Alertas do Sistema</p>
                            <p className="text-xs text-slate-400">
                                {unreadCount} não lido(s)
                            </p>
                        </div>

                        <button
                            onClick={loadAlerts}
                            className="p-2 rounded-xl hover:bg-slate-900 transition"
                            title="Atualizar"
                        >
                            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="max-h-[420px] overflow-y-auto">
                        {loading && (
                            <div className="px-4 py-6 text-sm text-slate-400">
                                Carregando...
                            </div>
                        )}

                        {!loading && alerts.length === 0 && (
                            <div className="px-4 py-6 text-sm text-slate-400">
                                Nenhum alerta pendente.
                            </div>
                        )}

                        {!loading && alerts.map(a => (
                            <div
                                key={a.id}
                                className={`px-4 py-3 border-b border-slate-900 hover:bg-slate-900/40 transition
                                           ${a.is_read ? '' : 'bg-slate-900/20'}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold truncate">
                                            {a.title}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {a.message}
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-2">
                                            {new Date(a.createdAt).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        {!a.is_read && (
                                            <button
                                                onClick={() => onRead(a.id)}
                                                className="p-2 rounded-xl hover:bg-slate-800 transition"
                                                title="Marcar como lido"
                                            >
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => onResolve(a.id)}
                                            className="p-2 rounded-xl hover:bg-slate-800 transition"
                                            title="Resolver"
                                        >
                                            <XCircle className="w-4 h-4 text-red-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-500">
                        Atualiza automaticamente a cada 15s.
                    </div>
                </div>
            )}
        </div>
    );
}
