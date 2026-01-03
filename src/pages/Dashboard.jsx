// src/pages/Dashboard.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    RefreshCw,
    AlertTriangle,
    ExternalLink,
    X,
    Activity,
    Play,
    Power,
    RotateCcw,
    Loader2,
    Radio,
} from "lucide-react";

import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";

import api from "../services";
import GlobalLoader from "../components/GlobalLoader";
import useLiveDashboardSummary from "../hooks/useLiveDashboardSummary";

// contrato visual de VM
import {
    getStatusMeta,
    badgeTone,
    glowTone,
    safeText,
    VM_UI,
} from "../components/dashboard/vm.ui";

function cls(...arr) {
    return arr.filter(Boolean).join(" ");
}

function timeAgo(date) {
    if (!date) return "—";
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
}

function hoursAgo(date) {
    if (!date) return null;
    return (Date.now() - new Date(date)) / 1000 / 3600;
}

const STATUS_ORDER = ["POWERED_ON", "POWERED_OFF", "SUSPENDED", "UNKNOWN", "DELETED"];
const CHART_COLORS = ["#22c55e", "#94a3b8", "#f97316", "#a1a1aa", "#ef4444"];

function Badge({ tone = "zinc", children, pulse = false }) {
    return (
        <span
            className={cls(
                "text-xs px-2 py-1 rounded-lg border",
                badgeTone(tone),
                pulse ? "ring-2 ring-white/10" : ""
            )}
        >
      {children}
    </span>
    );
}

function Chip({ active, children, onClick, tone = "zinc" }) {
    const map = {
        zinc: active
            ? "bg-white/10 border-white/20 text-white"
            : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-white/5",
        orange: active
            ? "bg-orange-500/15 border-orange-500/25 text-orange-100"
            : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-white/5",
        emerald: active
            ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-100"
            : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-white/5",
        blue: active
            ? "bg-blue-500/15 border-blue-500/25 text-blue-100"
            : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-white/5",
    };

    return (
        <button
            onClick={onClick}
            className={cls("px-3 py-1.5 rounded-xl border text-xs transition", map[tone] || map.zinc)}
        >
            {children}
        </button>
    );
}

function Panel({ title, subtitle, right, children }) {
    return (
        <section className={cls("rounded-2xl border border-slate-800/70 overflow-hidden", VM_UI.panelBg)}>
            <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-4 border-b border-slate-800/60">
                <div>
                    <div className="text-sm font-semibold text-slate-100">{title}</div>
                    {subtitle ? <div className="text-xs text-slate-400 mt-1">{subtitle}</div> : null}
                </div>
                {right ? <div className="shrink-0">{right}</div> : null}
            </div>
            <div className="px-4 py-4">{children}</div>
        </section>
    );
}

function Drawer({ open, title, subtitle, onClose, children }) {
    return (
        <>
            <div
                className={cls(
                    "fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity z-40",
                    open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />
            <aside
                className={cls(
                    "fixed top-0 right-0 h-full w-full sm:w-[520px] z-50 transition-transform",
                    open ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="h-full bg-slate-950 border-l border-slate-800 flex flex-col">
                    <div className="p-4 border-b border-slate-800 flex items-start justify-between gap-4">
                        <div>
                            <div className="text-sm font-semibold text-slate-100">{title}</div>
                            {subtitle ? <div className="text-xs text-slate-400 mt-1">{subtitle}</div> : null}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-white/5"
                            title="Fechar"
                        >
                            <X size={18} className="text-slate-300" />
                        </button>
                    </div>
                    <div className="p-4 overflow-auto flex-1">{children}</div>
                </div>
            </aside>
        </>
    );
}

function KpiCard({ label, count, pct, tone, onClick, highlight = false }) {
    return (
        <button
            onClick={onClick}
            className={cls(
                "text-left w-full rounded-2xl border border-slate-800/70 p-4 transition",
                VM_UI.cardBg,
                glowTone(tone),
                "hover:bg-slate-900/95",
                highlight ? "ring-2 ring-white/20" : ""
            )}
        >
            <div className="text-xs text-slate-400">{label}</div>
            <div className="mt-2 flex items-end justify-between gap-3">
                <div className="text-2xl font-semibold text-slate-100">{count}</div>
                <Badge tone={tone}>{pct}%</Badge>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-white/15" style={{ width: `${pct}%` }} />
            </div>
        </button>
    );
}

function ActionIcon({ title, tone = "zinc", onClick, disabled, children }) {
    const toneMap = {
        zinc: "border-slate-800/70 bg-slate-950/40 hover:bg-white/5",
        emerald: "border-emerald-500/25 bg-emerald-500/10 hover:bg-emerald-500/15",
        orange: "border-orange-500/25 bg-orange-500/10 hover:bg-orange-500/15",
        red: "border-red-500/25 bg-red-500/10 hover:bg-red-500/15",
        blue: "border-blue-500/25 bg-blue-500/10 hover:bg-blue-500/15",
    };

    return (
        <button
            title={title}
            onClick={onClick}
            disabled={disabled}
            className={cls(
                "p-2 rounded-xl border transition flex items-center justify-center",
                toneMap[tone] || toneMap.zinc,
                disabled ? "opacity-50 cursor-not-allowed" : ""
            )}
        >
            {children}
        </button>
    );
}

export default function Dashboard() {
    const navigate = useNavigate();

    const {
        summary,
        loading,
        isPrivileged,

        isLive,
        setIsLive,
        intervalMs,
        setIntervalMs,

        lastUpdatedAt,
        changedKeys,

        refresh,
    } = useLiveDashboardSummary({ defaultLive: false, defaultIntervalMs: 30000 });

    // hooks SEMPRE antes de qualquer return (fix hooks mismatch)
    const [drawerVm, setDrawerVm] = useState(null);
    const [actionLoadingKey, setActionLoadingKey] = useState(null);
    const [filter, setFilter] = useState({ status: null, staleSync: false, offlineOld: false });

    async function runVmAction(vm, action, e) {
        e?.stopPropagation?.();
        if (!vm?.id) return;

        const key = `${vm.id}:${action}`;
        if (actionLoadingKey) return;

        try {
            setActionLoadingKey(key);
            await api.post(`/vm/${vm.id}/${action}`);
            await refresh();
        } catch (err) {
            console.error(err);
            alert(`Erro ao executar ação: ${action}`);
        } finally {
            setActionLoadingKey(null);
        }
    }

    function isLoadingAction(vmId, action) {
        return actionLoadingKey === `${vmId}:${action}`;
    }

    function getActionsForVm(vm) {
        const st = vm?.status || "UNKNOWN";
        if (st === "POWERED_ON") {
            return [
                { action: "stop", title: "Stop", tone: "red", icon: Power },
                { action: "restart", title: "Restart", tone: "orange", icon: RotateCcw },
            ];
        }
        if (st === "POWERED_OFF") {
            return [{ action: "start", title: "Start", tone: "emerald", icon: Play }];
        }
        if (st === "SUSPENDED") {
            return [{ action: "restart", title: "Restart", tone: "orange", icon: RotateCcw }];
        }
        return [];
    }

    // Sempre calculamos os derivativos com fallbacks "seguros"
    const kpis = summary?.kpis || { total: 0, byStatus: {} };
    const alerts = summary?.alerts || {};
    const charts = summary?.charts || {};
    const recent = Array.isArray(summary?.recent) ? summary.recent : [];

    const inventory = summary?.inventory || null; // só vem pra privilegiado
    const clustersTop = charts?.clustersTop || [];
    const statusDistribution = charts?.statusDistribution || null;

    const beltAlertCount = (alerts.staleSyncCount || 0) + (alerts.offlineOldCount || 0);
    const beltTone = beltAlertCount > 0 ? "orange" : "emerald";

    const statusCards = useMemo(() => {
        const total = kpis.total || 0;
        return STATUS_ORDER.map((st) => {
            const meta = getStatusMeta(st);
            const count = kpis.byStatus?.[st] || 0;
            const pct = total ? Math.round((count / total) * 100) : 0;
            return { st, meta, count, pct };
        });
    }, [kpis]);

    const pieData = useMemo(() => {
        return STATUS_ORDER.map((st) => ({
            name: getStatusMeta(st).label,
            value: kpis.byStatus?.[st] || 0,
        })).filter((x) => x.value > 0);
    }, [kpis]);

    const filteredRecent = useMemo(() => {
        return recent.filter((vm) => {
            const st = vm?.status || "UNKNOWN";
            if (filter.status && st !== filter.status) return false;

            if (filter.staleSync) {
                if (st === "DELETED") return false; // regra do backend: deletada não vira alerta
                const h = hoursAgo(vm.last_sync_at);
                if (h === null) return false;
                if (!(h > (alerts.staleSyncHours || 6))) return false;
            }

            if (filter.offlineOld) {
                if (st !== "POWERED_OFF") return false;
                const h = hoursAgo(vm.updated_at || vm.updatedAt);
                if (h === null) return false;
                if (!(h > (alerts.offlineOldHours || 24))) return false;
            }

            return true;
        });
    }, [recent, filter, alerts.staleSyncHours, alerts.offlineOldHours]);

    const attentionList = useMemo(() => {
        const staleH = alerts.staleSyncHours || 6;
        const offH = alerts.offlineOldHours || 24;

        const items = recent
            .map((vm) => {
                const st = vm?.status || "UNKNOWN";
                if (st === "DELETED") return null; // regra

                const lastSyncH = hoursAgo(vm.last_sync_at);
                const updatedH = hoursAgo(vm.updated_at || vm.updatedAt);

                let reason = null;

                if (lastSyncH !== null && lastSyncH > staleH) {
                    reason = `Sync atrasado (${Math.floor(lastSyncH)}h)`;
                }

                if (st === "POWERED_OFF" && updatedH !== null && updatedH > offH) {
                    reason = reason
                        ? `${reason} · Offline antigo (${Math.floor(updatedH)}h)`
                        : `Offline antigo (${Math.floor(updatedH)}h)`;
                }

                if (st === "UNKNOWN") reason = "Status unknown";
                if (st === "SUSPENDED") reason = "VM suspensa";

                if (!reason) return null;
                return { vm, reason };
            })
            .filter(Boolean);

        return items.slice(0, 10);
    }, [recent, alerts.staleSyncHours, alerts.offlineOldHours]);

    function resetFilters() {
        setFilter({ status: null, staleSync: false, offlineOld: false });
    }

    // ✅ FIX: Sem return antecipado.
    const isReady = !loading && summary?.ok;

    return (
        <div className="flex flex-col gap-4">
            {!isReady ? (
                loading ? (
                    <GlobalLoader />
                ) : (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-slate-300">
                        Dashboard indisponível.
                    </div>
                )
            ) : (
                <>
                    {/* STATUS BELT + LIVE CONTROL */}
                    <div
                        className={cls(
                            "rounded-2xl border border-slate-800/70 px-4 py-3",
                            VM_UI.panelBg,
                            glowTone(beltTone)
                        )}
                    >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                            <div className="flex items-center gap-3 flex-wrap">
                                <Badge
                                    tone={beltTone}
                                    pulse={
                                        changedKeys.has("alerts.staleSyncCount") ||
                                        changedKeys.has("alerts.offlineOldCount")
                                    }
                                >
                                    {beltAlertCount > 0 ? "ATENÇÃO" : "OK"}
                                </Badge>

                                <div className="text-xs text-slate-400">
                                    Último sync:{" "}
                                    <span className="text-slate-200">{timeAgo(alerts.lastSyncAt)}</span>
                                    <span className="ml-2 text-slate-500">| Total VMs: {kpis.total}</span>
                                    {lastUpdatedAt ? (
                                        <span className="ml-2 text-slate-500">
                      | Atualizado: {timeAgo(lastUpdatedAt)}
                    </span>
                                    ) : null}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap justify-end">
                                <Badge tone={alerts.staleSyncCount > 0 ? "orange" : "slate"}>
                                    Sync &gt; {alerts.staleSyncHours || 6}h: {alerts.staleSyncCount || 0}
                                </Badge>
                                <Badge tone={alerts.offlineOldCount > 0 ? "orange" : "slate"}>
                                    Offline &gt; {alerts.offlineOldHours || 24}h: {alerts.offlineOldCount || 0}
                                </Badge>

                                {/* LIVE MODE: só privilegiado */}
                                {isPrivileged ? (
                                    <div className="flex items-center gap-2 ml-2">
                                        <button
                                            onClick={() => setIsLive(!isLive)}
                                            className={cls(
                                                "px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2",
                                                isLive
                                                    ? "border-emerald-500/25 bg-emerald-500/12 hover:bg-emerald-500/16"
                                                    : "border-slate-800 bg-slate-950/40 hover:bg-white/5"
                                            )}
                                            title="Live Mode (NOC)"
                                        >
                                            <Radio
                                                size={14}
                                                className={cls(
                                                    isLive ? "text-emerald-200" : "text-slate-300",
                                                    isLive ? "animate-pulse" : ""
                                                )}
                                            />
                                            Live
                                        </button>

                                        <select
                                            value={intervalMs}
                                            onChange={(e) => setIntervalMs(Number(e.target.value))}
                                            className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950/40 text-xs text-slate-200"
                                            title="Intervalo do Live Mode"
                                            disabled={!isLive}
                                        >
                                            <option value={10000}>10s</option>
                                            <option value={30000}>30s</option>
                                            <option value={60000}>60s</option>
                                        </select>
                                    </div>
                                ) : (
                                    <button
                                        className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950/40 text-xs text-slate-400 opacity-60 cursor-not-allowed ml-2"
                                        title="Live Mode somente suporte"
                                        disabled
                                    >
                                        Live (suporte)
                                    </button>
                                )}

                                <button
                                    onClick={refresh}
                                    className="ml-2 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950/50 text-xs flex items-center gap-2 hover:bg-white/5"
                                    title="Atualizar agora"
                                >
                                    <RefreshCw size={14} />
                                    Atualizar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* TOPBAR */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-xl font-semibold text-slate-100">
                                Dashboard {inventory ? "DC" : "Cliente"}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                                Renderiza por contrato do backend. Inventory/NOC só aparece quando existe no payload.
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigate("/vms")}
                                className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-white/5 text-sm"
                            >
                                VMs
                            </button>

                            {inventory ? (
                                <>
                                    <button
                                        onClick={() => navigate("/public-ips")}
                                        className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-white/5 text-sm"
                                    >
                                        Public IPs
                                    </button>
                                    <button
                                        onClick={() => navigate("/inventory")}
                                        className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-white/5 text-sm"
                                    >
                                        Inventory
                                    </button>
                                </>
                            ) : null}
                        </div>
                    </div>

                    {/* FILTER CHIPS */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {statusCards.map(({ st, meta, count }) => (
                            <Chip
                                key={st}
                                active={filter.status === st}
                                tone={meta.tone === "emerald" ? "emerald" : meta.tone === "orange" ? "orange" : "zinc"}
                                onClick={() =>
                                    setFilter((prev) => ({ ...prev, status: prev.status === st ? null : st }))
                                }
                            >
                                {meta.label} ({count})
                            </Chip>
                        ))}

                        <Chip
                            active={filter.staleSync}
                            tone="orange"
                            onClick={() => setFilter((p) => ({ ...p, staleSync: !p.staleSync }))}
                        >
                            Sync atrasado
                        </Chip>

                        <Chip
                            active={filter.offlineOld}
                            tone="orange"
                            onClick={() => setFilter((p) => ({ ...p, offlineOld: !p.offlineOld }))}
                        >
                            Offline antigo
                        </Chip>

                        {(filter.status || filter.staleSync || filter.offlineOld) ? (
                            <button
                                onClick={resetFilters}
                                className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-300 hover:bg-white/5"
                            >
                                Limpar filtros
                            </button>
                        ) : null}
                    </div>

                    {/* KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {statusCards.map(({ st, meta, count, pct }) => (
                            <KpiCard
                                key={st}
                                label={meta.label}
                                count={count}
                                pct={pct}
                                tone={meta.tone}
                                highlight={changedKeys.has(`kpis.byStatus.${st}`)}
                                onClick={() =>
                                    setFilter((prev) => ({ ...prev, status: prev.status === st ? null : st }))
                                }
                            />
                        ))}
                    </div>

                    {/* VM PANELS */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        <Panel
                            title="Atenção"
                            subtitle="Alertas operacionais + ação rápida"
                            right={<AlertTriangle size={18} className="text-orange-400" />}
                        >
                            <div className="space-y-2">
                                {attentionList.map(({ vm, reason }) => {
                                    const meta = getStatusMeta(vm.status || "UNKNOWN");
                                    const actions = getActionsForVm(vm);

                                    return (
                                        <div
                                            key={vm.id}
                                            className={cls(
                                                "w-full rounded-xl border border-slate-800/70 p-3 transition",
                                                "bg-gradient-to-b from-slate-950/70 to-slate-950/30 hover:bg-white/5"
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <button
                                                    className="text-left min-w-0 flex-1"
                                                    onClick={() => setDrawerVm(vm)}
                                                    title="Abrir detalhes"
                                                >
                                                    <div className="text-sm text-slate-200 font-medium truncate">
                                                        {safeText(vm.name, `VM #${vm.id}`)}
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-1 truncate">
                                                        {safeText(vm.cluster_name)} · {reason} · last sync {timeAgo(vm.last_sync_at)}
                                                    </div>
                                                </button>

                                                <div className="flex items-center gap-2">
                                                    <Badge tone={meta.tone}>{meta.label}</Badge>
                                                    <Badge tone="orange">{reason}</Badge>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <ActionIcon title="Abrir" tone="blue" onClick={() => navigate(`/vm/${vm.id}`)}>
                                                        <ExternalLink size={16} className="text-blue-200" />
                                                    </ActionIcon>

                                                    {actions.map((a) => {
                                                        const Icon = a.icon;
                                                        const loading = isLoadingAction(vm.id, a.action);
                                                        return (
                                                            <ActionIcon
                                                                key={a.action}
                                                                title={a.title}
                                                                tone={a.tone}
                                                                disabled={!!actionLoadingKey}
                                                                onClick={(e) => runVmAction(vm, a.action, e)}
                                                            >
                                                                {loading ? (
                                                                    <Loader2 size={16} className="animate-spin text-slate-200" />
                                                                ) : (
                                                                    <Icon size={16} className="text-slate-200" />
                                                                )}
                                                            </ActionIcon>
                                                        );
                                                    })}
                                                </div>

                                                <div className="text-xs text-slate-500">
                                                    {timeAgo(vm.updated_at || vm.updatedAt)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {attentionList.length === 0 ? (
                                    <div className="text-xs text-slate-500">Sem alertas relevantes.</div>
                                ) : null}
                            </div>
                        </Panel>

                        <Panel title="Status" subtitle="Distribuição" right={<Badge tone="blue">chart</Badge>}>
                            <div className="h-72">
                                {statusDistribution ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={statusDistribution}>
                                            <XAxis dataKey="label" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#60a5fa" radius={[10, 10, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : pieData.length === 0 ? (
                                    <div className="text-xs text-slate-500">Sem dados</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                dataKey="value"
                                                nameKey="name"
                                                innerRadius={55}
                                                outerRadius={95}
                                                paddingAngle={2}
                                            >
                                                {pieData.map((_, idx) => (
                                                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </Panel>

                        <Panel title="Clusters" subtitle="Top 10" right={<Badge tone="blue">chart</Badge>}>
                            <div className="h-72">
                                {clustersTop.length === 0 ? (
                                    <div className="text-xs text-slate-500">Sem dados</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={clustersTop}>
                                            <XAxis dataKey="name" hide />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#60a5fa" radius={[10, 10, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </Panel>
                    </div>

                    {/* INVENTORY: só aparece se vier no payload */}
                    {inventory ? (
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                            <Panel title="Inventory KPIs" subtitle="Servers + IPs + Providers" right={<Badge tone="blue">DC</Badge>}>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className={cls("rounded-xl border border-slate-800/70 p-3", VM_UI.cardBg)}>
                                        <div className="text-xs text-slate-500">Servers</div>
                                        <div className="text-xl font-semibold text-slate-100 mt-1">
                                            {inventory.kpis?.serversTotal || 0}
                                        </div>
                                    </div>
                                    <div className={cls("rounded-xl border border-slate-800/70 p-3", VM_UI.cardBg)}>
                                        <div className="text-xs text-slate-500">IPs</div>
                                        <div className="text-xl font-semibold text-slate-100 mt-1">
                                            {inventory.kpis?.ipsTotal || 0}
                                        </div>
                                    </div>

                                    <div
                                        className={cls(
                                            "rounded-xl border border-slate-800/70 p-3",
                                            VM_UI.cardBg,
                                            changedKeys.has("inventory.kpis.ipsByStatus.free") ? "ring-2 ring-white/20" : ""
                                        )}
                                    >
                                        <div className="text-xs text-slate-500">Free</div>
                                        <div className="text-xl font-semibold text-slate-100 mt-1">
                                            {inventory.kpis?.ipsByStatus?.free || 0}
                                        </div>
                                    </div>

                                    <div className={cls("rounded-xl border border-slate-800/70 p-3", VM_UI.cardBg)}>
                                        <div className="text-xs text-slate-500">Assigned</div>
                                        <div className="text-xl font-semibold text-slate-100 mt-1">
                                            {inventory.kpis?.ipsByStatus?.assigned || 0}
                                        </div>
                                    </div>
                                </div>
                            </Panel>

                            <Panel title="Inventory Alerts" subtitle="Qualidade do inventário" right={<Badge tone="orange">alert</Badge>}>
                                <div className="space-y-2 text-sm text-slate-300">
                                    <div className="flex items-center justify-between">
                                        <span>IP Sync &gt; {inventory.alerts?.staleIpSyncHours || 12}h</span>
                                        <Badge tone={(inventory.alerts?.staleIpSyncCount || 0) > 0 ? "orange" : "slate"}>
                                            {inventory.alerts?.staleIpSyncCount || 0}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Missing Gateway</span>
                                        <Badge tone={(inventory.alerts?.missingGatewayCount || 0) > 0 ? "orange" : "slate"}>
                                            {inventory.alerts?.missingGatewayCount || 0}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Missing Netmask</span>
                                        <Badge tone={(inventory.alerts?.missingNetmaskCount || 0) > 0 ? "orange" : "slate"}>
                                            {inventory.alerts?.missingNetmaskCount || 0}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Missing Subnet</span>
                                        <Badge tone={(inventory.alerts?.missingSubnetCount || 0) > 0 ? "orange" : "slate"}>
                                            {inventory.alerts?.missingSubnetCount || 0}
                                        </Badge>
                                    </div>
                                </div>
                            </Panel>

                            <Panel title="Recent IPs" subtitle="Últimos IPs sincronizados" right={<Badge tone="blue">list</Badge>}>
                                <div className="space-y-2">
                                    {(inventory.recentIps || []).slice(0, 6).map((ip) => (
                                        <div
                                            key={ip.id}
                                            className={cls(
                                                "rounded-xl border border-slate-800/70 p-3",
                                                "bg-gradient-to-b from-slate-950/70 to-slate-950/30"
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="min-w-0">
                                                    <div className="text-sm font-semibold text-slate-100 truncate">
                                                        {ip.ip_address}
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-1 truncate">
                                                        {ip.provider} · {ip.dc || "—"} · last sync {timeAgo(ip.last_sync_at)}
                                                    </div>
                                                </div>
                                                <Badge
                                                    tone={
                                                        ip.status === "free" ? "emerald" : ip.status === "assigned" ? "orange" : "slate"
                                                    }
                                                >
                                                    {ip.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}

                                    {(inventory.recentIps || []).length === 0 ? (
                                        <div className="text-xs text-slate-500">Sem IPs recentes.</div>
                                    ) : null}
                                </div>
                            </Panel>
                        </div>
                    ) : null}

                    {/* TABLE (DENSE) */}
                    <Panel
                        title="Recent (denso)"
                        subtitle={`Resultado: ${filteredRecent.length} VMs`}
                        right={
                            <button
                                onClick={() => navigate("/vms")}
                                className="text-xs text-slate-300 hover:text-white flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-white/5"
                                title="Abrir módulo VMs"
                            >
                                Abrir módulo VMs <ExternalLink size={14} />
                            </button>
                        }
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-slate-400">
                                <tr className="border-b border-slate-800">
                                    <th className="text-left py-2 pr-3">Nome</th>
                                    <th className="text-left py-2 pr-3">Status</th>
                                    <th className="text-left py-2 pr-3">Cluster</th>
                                    <th className="text-left py-2 pr-3">Último Sync</th>
                                    <th className="text-right py-2">Ações</th>
                                </tr>
                                </thead>

                                <tbody>
                                {filteredRecent.map((vm) => {
                                    const meta = getStatusMeta(vm.status || "UNKNOWN");
                                    const actions = getActionsForVm(vm);

                                    return (
                                        <tr key={vm.id} className="border-b border-slate-800/60 hover:bg-white/5 transition">
                                            <td className="py-3 pr-3 text-slate-200 font-medium truncate max-w-[380px]">
                                                {safeText(vm.name, `VM #${vm.id}`)}
                                            </td>
                                            <td className="py-3 pr-3">
                                                <Badge tone={meta.tone}>{meta.label}</Badge>
                                            </td>
                                            <td className="py-3 pr-3 text-slate-400">{safeText(vm.cluster_name)}</td>
                                            <td className="py-3 pr-3 text-slate-400">{timeAgo(vm.last_sync_at)}</td>

                                            <td className="py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <ActionIcon
                                                        title="Abrir"
                                                        tone="blue"
                                                        disabled={!!actionLoadingKey}
                                                        onClick={() => setDrawerVm(vm)}
                                                    >
                                                        <ExternalLink size={16} className="text-blue-200" />
                                                    </ActionIcon>

                                                    {actions.map((a) => {
                                                        const Icon = a.icon;
                                                        const loading = isLoadingAction(vm.id, a.action);

                                                        return (
                                                            <ActionIcon
                                                                key={a.action}
                                                                title={a.title}
                                                                tone={a.tone}
                                                                disabled={!!actionLoadingKey}
                                                                onClick={(e) => runVmAction(vm, a.action, e)}
                                                            >
                                                                {loading ? (
                                                                    <Loader2 size={16} className="animate-spin text-slate-200" />
                                                                ) : (
                                                                    <Icon size={16} className="text-slate-200" />
                                                                )}
                                                            </ActionIcon>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {filteredRecent.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-6 text-center text-slate-500">
                                            Sem resultados
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </Panel>

                    {/* DRAWER */}
                    <Drawer
                        open={!!drawerVm}
                        title={drawerVm?.name || `VM #${drawerVm?.id}`}
                        subtitle={drawerVm ? `Cluster: ${safeText(drawerVm.cluster_name)}` : ""}
                        onClose={() => setDrawerVm(null)}
                    >
                        {drawerVm ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge tone={getStatusMeta(drawerVm.status || "UNKNOWN").tone}>
                                        {getStatusMeta(drawerVm.status || "UNKNOWN").label}
                                    </Badge>
                                    <Badge tone="blue">ID: {drawerVm.id}</Badge>
                                    <Badge tone="zinc">Last sync: {timeAgo(drawerVm.last_sync_at)}</Badge>
                                </div>

                                <div className={cls("rounded-2xl border border-slate-800/70 p-4", VM_UI.cardBg)}>
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-semibold text-slate-100">Ações rápidas</div>
                                        <div className="flex items-center gap-2">
                                            <ActionIcon
                                                title="Abrir página"
                                                tone="blue"
                                                onClick={() => navigate(`/vm/${drawerVm.id}`)}
                                            >
                                                <ExternalLink size={16} className="text-blue-200" />
                                            </ActionIcon>

                                            {getActionsForVm(drawerVm).map((a) => {
                                                const Icon = a.icon;
                                                const loading = isLoadingAction(drawerVm.id, a.action);
                                                return (
                                                    <ActionIcon
                                                        key={a.action}
                                                        title={a.title}
                                                        tone={a.tone}
                                                        disabled={!!actionLoadingKey}
                                                        onClick={(e) => runVmAction(drawerVm, a.action, e)}
                                                    >
                                                        {loading ? (
                                                            <Loader2 size={16} className="animate-spin text-slate-200" />
                                                        ) : (
                                                            <Icon size={16} className="text-slate-200" />
                                                        )}
                                                    </ActionIcon>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="mt-3 text-xs text-slate-400 space-y-1">
                                        <div>Provider: {safeText(drawerVm.provider)}</div>
                                        <div>Provider VM ID: {safeText(drawerVm.provider_vm_id)}</div>
                                        <div>Hostname: {safeText(drawerVm.hostname)}</div>
                                        <div>Atualizado: {timeAgo(drawerVm.updated_at || drawerVm.updatedAt)}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => navigate("/sync-logs")}
                                        className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-white/5 text-sm flex items-center justify-center gap-2"
                                        title="Ver Sync Logs"
                                    >
                                        Sync Logs <Activity size={16} />
                                    </button>

                                    <button
                                        onClick={refresh}
                                        className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-white/5 text-sm flex items-center justify-center gap-2"
                                        title="Atualizar"
                                    >
                                        Atualizar <RefreshCw size={16} />
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </Drawer>
                </>
            )}
        </div>
    );
}
