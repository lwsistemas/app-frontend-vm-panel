import {useEffect, useMemo, useRef, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {
    Bell,
    AlertTriangle,
    CheckCircle,
    XCircle,
    LogOut,
    LayoutDashboard,
    Server,
    Cpu,
    Plus,
    TerminalSquare,
    Radio,
    Activity,
    Users,
    HardDrive,
    MemoryStick,
    Network,
    Hash,
    Play,
    Power,
    RotateCcw,
    RefreshCcw,
    ArrowLeft,
    Layers,
    Cloud,
    Wrench,
    ShieldAlert,
} from "lucide-react";

import api from "../services";

function cls(...arr) {
    return arr.filter(Boolean).join(" ");
}

function safeJson(value) {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function toSecondsAgo(dateStr) {
    if (!dateStr) return null;
    const t = new Date(dateStr).getTime();
    if (!t) return null;
    const diff = Math.max(0, Date.now() - t);
    return Math.floor(diff / 1000);
}

function formatAgo(seconds) {
    if (seconds == null) return "—";
    if (seconds < 60) return `${seconds}s`;
    const min = Math.floor(seconds / 60);
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d`;
}

function getApiModeLabel() {
    const fromStorage = localStorage.getItem("api_mode") || localStorage.getItem("apiMode");
    if (fromStorage) return String(fromStorage).toUpperCase();

    const url = import.meta?.env?.VITE_API_URL || "";
    if (!url) return "API";
    if (url.includes("localhost") || url.includes("127.0.0.1")) return "LOCAL";
    return "PROD";
}

function extractVmId(pathname) {
    const m = pathname?.match(/^\/vm\/(\d+)/);
    return m ? m[1] : null;
}

function statusTone(status) {
    switch (status) {
        case "POWERED_ON":
            return "emerald";
        case "POWERED_OFF":
            return "slate";
        case "SUSPENDED":
            return "amber";
        case "DELETED":
            return "red";
        default:
            return "amber";
    }
}

function toolTone(status) {
    const s = String(status || "").toUpperCase();
    if (!s) return "slate";
    if (s.includes("RUNNING")) return "emerald";
    if (s.includes("OK")) return "emerald";
    if (s.includes("NOT")) return "amber";
    if (s.includes("OUTDATED")) return "amber";
    if (s.includes("UNMANAGED")) return "amber";
    return "slate";
}

function Chip({
                  label, value, tone = "slate", icon = null, title = null, compact = false,
              }) {
    const tones = {
        slate: "border-slate-700/30 text-slate-300 bg-slate-900/25",
        sky: "border-sky-700/30 text-sky-200 bg-sky-900/10",
        emerald: "border-emerald-700/30 text-emerald-200 bg-emerald-900/10",
        amber: "border-amber-700/30 text-amber-200 bg-amber-900/10",
        red: "border-red-700/30 text-red-200 bg-red-900/10",
    };

    return (<span
        className={cls(compact ? "text-[10px] px-2 py-[5px]" : "text-[11px] px-2.5 py-1", "rounded-xl border inline-flex items-center gap-2 max-w-[280px]", tones[tone] || tones.slate)}
        title={title || (typeof value === "string" ? value : "")}
    >
      {icon ? <span className="opacity-90">{icon}</span> : null}
        <span className="opacity-70">{label}:</span>
      <span className="font-semibold truncate">{value ?? "—"}</span>
    </span>);
}

function HeaderButton({
                          icon, label, onClick, tone = "slate", disabled = false,
                      }) {
    const tones = {
        slate: "bg-slate-900/30 border-slate-800 text-slate-200 hover:bg-slate-800/50",
        emerald: "bg-emerald-900/20 border-emerald-800/40 text-emerald-100 hover:bg-emerald-900/30",
        sky: "bg-sky-900/15 border-sky-800/35 text-sky-100 hover:bg-sky-900/25",
        amber: "bg-amber-900/15 border-amber-800/35 text-amber-100 hover:bg-amber-900/20",
        red: "bg-red-900/15 border-red-800/35 text-red-100 hover:bg-red-900/20",
    };

    return (<button
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={cls("flex items-center gap-2 px-3 py-2 rounded-xl border transition text-xs", tones[tone] || tones.slate, disabled && "opacity-40 cursor-not-allowed hover:bg-transparent")}
    >
        {icon}
        {label}
    </button>);
}

function ActionButton({
                          icon, label, onClick, tone = "slate", disabled = false, loading = false,
                      }) {
    const tones = {
        slate: "bg-slate-900/40 border-slate-800 text-slate-200 hover:bg-slate-800/60",
        emerald: "bg-emerald-900/25 border-emerald-800/45 text-emerald-100 hover:bg-emerald-900/30",
        sky: "bg-sky-900/20 border-sky-800/40 text-sky-100 hover:bg-sky-900/30",
        amber: "bg-amber-900/20 border-amber-800/40 text-amber-100 hover:bg-amber-900/25",
        red: "bg-red-900/20 border-red-800/40 text-red-100 hover:bg-red-900/25",
    };

    return (<button
        onClick={disabled || loading ? undefined : onClick}
        disabled={disabled || loading}
        className={cls("flex items-center gap-2 px-3 py-2 rounded-xl border transition text-xs whitespace-nowrap", tones[tone] || tones.slate, (disabled || loading) && "opacity-45 cursor-not-allowed")}
        title={label}
    >
        <span className={cls(loading && "animate-spin")}>{icon}</span>
        <span className="font-semibold">{label}</span>
    </button>);
}

export default function Header() {
    const navigate = useNavigate();
    const location = useLocation();

    const user = useMemo(() => {
        const raw = localStorage.getItem("user");
        if (!raw) return null;
        return safeJson(raw);
    }, []);

    const role = (user?.role || "").toLowerCase();
    const isPrivileged = ["root", "admin", "support"].includes(role);

    const [openUser, setOpenUser] = useState(false);
    const [openAlerts, setOpenAlerts] = useState(false);

    const [alerts, setAlerts] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingAlerts, setLoadingAlerts] = useState(false);

    const [summary, setSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryErr, setSummaryErr] = useState(null);

    const [vmCtx, setVmCtx] = useState(null);
    const [vmCtxLoading, setVmCtxLoading] = useState(false);

    const [liveMode, setLiveMode] = useState(() => localStorage.getItem("header_live_mode") === "1");

    const [vmActionLoading, setVmActionLoading] = useState({
        start: false, stop: false, restart: false, sync: false, console: false,
    });

    const alertsRef = useRef(null);
    const userRef = useRef(null);

    const apiMode = getApiModeLabel();
    const vmId = useMemo(() => extractVmId(location.pathname), [location.pathname]);
    const isVmDetail = !!vmId;

    function logout() {
        localStorage.clear();
        navigate("/login");
    }

    async function loadAlerts() {
        if (!isPrivileged) return;
        try {
            setLoadingAlerts(true);
            const {data} = await api.get("/alerts", {
                params: {limit: 10, status: "open"},
            });

            if (data?.success) {
                setAlerts(data.rows || []);
                setUnreadCount(data.unreadCount || 0);
            } else if (Array.isArray(data)) {
                setAlerts(data);
                setUnreadCount(data.length);
            }
        } catch (e) {
            console.log("[ALERTS][LOAD]", e.message);
        } finally {
            setLoadingAlerts(false);
        }
    }

    useEffect(() => {
        if (!isPrivileged) return;
        loadAlerts();
        const t = setInterval(loadAlerts, 20000);
        return () => clearInterval(t);
    }, [isPrivileged]);

    async function loadSummary({silent = false} = {}) {
        try {
            if (!silent) setSummaryLoading(true);
            setSummaryErr(null);

            const now = Date.now();
            const last = Number(localStorage.getItem("header_summary_ts") || "0");
            const cached = localStorage.getItem("header_summary_cache");

            const minIntervalMs = liveMode ? 0 : 15000;
            if (!liveMode && cached && now - last < minIntervalMs) {
                setSummary(safeJson(cached));
                return;
            }

            const {data} = await api.get("/dashboard/summary");
            if (data?.ok) {
                setSummary(data);
                localStorage.setItem("header_summary_cache", JSON.stringify(data));
                localStorage.setItem("header_summary_ts", String(Date.now()));
            } else {
                setSummary(data || null);
            }
        } catch (e) {
            setSummaryErr(e.message || "Erro no summary");
        } finally {
            setSummaryLoading(false);
        }
    }

    useEffect(() => {
        loadSummary({silent: true});
        const interval = liveMode ? 5000 : 20000;
        const t = setInterval(() => loadSummary({silent: true}), interval);
        return () => clearInterval(t);
    }, [liveMode]);

    async function loadVmContext(vmId, {silent = false} = {}) {
        if (!vmId) {
            setVmCtx(null);
            return;
        }

        try {
            if (!silent) setVmCtxLoading(true);

            const {data} = await api.get(`/vm/${vmId}/detail`);
            const v = data?.vm || {};
            const nics = Array.isArray(data?.nics) ? data.nics : [];

            const primaryNic = nics.find((x) => x?.connected) || nics[0] || null;

            setVmCtx({
                id: vmId,
                name: v?.name,
                hostname: v?.hostname,
                os: v?.os,
                status: v?.status,
                ip_address: v?.ip_address,
                cluster_name: v?.cluster_name,
                provider_host: v?.provider_host,
                provider_vm_id: v?.provider_vm_id,
                provider_vm_name: v?.provider_vm_name,
                tools_status: v?.tools_status,
                tools_version: v?.tools_version,
                tools_version_status: v?.tools_version_status,
                cpu: v?.cpu,
                memory_mb: v?.memory_mb,
                disk_gb: v?.disk_gb,
                last_sync_at: v?.last_sync_at,
                primary_mac: primaryNic?.mac_address || null,
                primary_network: primaryNic?.network_name || null,
            });
        } catch (e) {
            setVmCtx(null);
        } finally {
            setVmCtxLoading(false);
        }
    }

    useEffect(() => {
        if (!vmId) {
            setVmCtx(null);
            return;
        }
        loadVmContext(vmId, {silent: true});
        const interval = liveMode ? 4000 : 15000;
        const t = setInterval(() => loadVmContext(vmId, {silent: true}), interval);
        return () => clearInterval(t);
    }, [vmId, liveMode]);

    function toggleLiveMode() {
        if (!isPrivileged) return;
        const next = !liveMode;
        setLiveMode(next);
        localStorage.setItem("header_live_mode", next ? "1" : "0");
    }

    useEffect(() => {
        function handleClick(e) {
            if (openAlerts && alertsRef.current && !alertsRef.current.contains(e.target)) setOpenAlerts(false);
            if (openUser && userRef.current && !userRef.current.contains(e.target)) setOpenUser(false);
        }

        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [openAlerts, openUser]);

    const health = useMemo(() => {
        if (!summary?.ok) return {label: "—", tone: "slate"};

        const total = summary?.kpis?.total || 0;
        const byStatus = summary?.kpis?.byStatus || {};
        const offlineOldCount = summary?.alerts?.offlineOldCount || 0;
        const staleSyncCount = summary?.alerts?.staleSyncCount || 0;

        const deleted = byStatus?.DELETED || 0;
        const unknown = byStatus?.UNKNOWN || 0;

        const inv = summary?.inventory;
        const invAlerts = inv?.alerts || {};
        const staleIpSyncCount = invAlerts?.staleIpSyncCount || 0;
        const missingSubnetCount = invAlerts?.missingSubnetCount || 0;
        const missingGatewayCount = invAlerts?.missingGatewayCount || 0;
        const missingNetmaskCount = invAlerts?.missingNetmaskCount || 0;

        const deletedRatio = total > 0 ? deleted / total : 0;

        if (staleIpSyncCount > 0 || missingSubnetCount > 0 || missingGatewayCount > 0 || missingNetmaskCount > 0) {
            return {label: "CRIT", tone: "red"};
        }

        if (staleSyncCount > 0 || offlineOldCount > 0 || unknown > 0 || deletedRatio > 0.2) {
            return {label: "WARN", tone: "amber"};
        }

        return {label: "OK", tone: "emerald"};
    }, [summary]);

    const lastSyncAgo = useMemo(() => formatAgo(toSecondsAgo(summary?.alerts?.lastSyncAt)), [summary?.alerts?.lastSyncAt]);

    const globalChips = useMemo(() => {
        if (!summary?.ok) return [];

        const byStatus = summary?.kpis?.byStatus || {};
        const online = byStatus?.POWERED_ON ?? 0;
        const offline = byStatus?.POWERED_OFF ?? 0;
        const deleted = byStatus?.DELETED ?? 0;
        const unknown = byStatus?.UNKNOWN ?? 0;

        const inv = summary?.inventory;
        const invAlerts = inv?.alerts || {};
        const staleIpSyncCount = invAlerts?.staleIpSyncCount || 0;

        const out = [{
            key: "health",
            label: "Health",
            value: health.label,
            tone: health.tone,
            icon: <ShieldAlert className="w-3.5 h-3.5"/>
        }, {key: "online", label: "Online", value: online, tone: "emerald"}, {
            key: "offline",
            label: "Offline",
            value: offline,
            tone: offline > 0 ? "amber" : "slate"
        }, {key: "deleted", label: "Deleted", value: deleted, tone: deleted > 0 ? "amber" : "slate"}, {
            key: "unknown",
            label: "Unknown",
            value: unknown,
            tone: unknown > 0 ? "amber" : "slate"
        }, {key: "sync", label: "Sync", value: lastSyncAgo, tone: "sky", icon: <Activity className="w-3.5 h-3.5"/>},];

        if (isPrivileged && summary?.inventory) {
            out.push({
                key: "inv",
                label: "Inventory",
                value: staleIpSyncCount > 0 ? `CRIT (${staleIpSyncCount})` : "OK",
                tone: staleIpSyncCount > 0 ? "red" : "emerald",
                icon: <Layers className="w-3.5 h-3.5"/>,
            });
        }

        out.push({key: "api", label: "API", value: apiMode, tone: "slate", icon: <Cloud className="w-3.5 h-3.5"/>});
        out.push({key: "role", label: "Role", value: role || "user", tone: isPrivileged ? "emerald" : "slate"});

        return out;
    }, [summary, lastSyncAgo, isPrivileged, health, apiMode, role]);

    const vmMainChips = useMemo(() => {
        if (!vmCtx) return [];

        const tools = vmCtx.tools_status || "—";
        const toolsT = toolTone(tools);

        return [{
            key: "vm",
            label: "VM",
            value: vmCtx.status || "—",
            tone: statusTone(vmCtx.status),
            icon: <Server className="w-3.5 h-3.5"/>,
        }, {
            key: "ip",
            label: "IP",
            value: vmCtx.ip_address || "—",
            tone: vmCtx.ip_address ? "emerald" : "slate",
            icon: <Hash className="w-3.5 h-3.5"/>,
        }, {
            key: "cluster",
            label: "Cluster",
            value: vmCtx.cluster_name || "—",
            tone: vmCtx.cluster_name ? "sky" : "slate",
            icon: <Layers className="w-3.5 h-3.5"/>,
        }, {
            key: "host",
            label: "Host",
            value: vmCtx.provider_host || "—",
            tone: "slate",
            icon: <Cloud className="w-3.5 h-3.5"/>,
        }, {
            key: "tools", label: "Tools", value: tools, tone: toolsT, icon: <Wrench className="w-3.5 h-3.5"/>,
        },];
    }, [vmCtx]);

    const vmSecondaryChips = useMemo(() => {
        if (!vmCtx) return [];

        const ramGb = vmCtx.memory_mb != null ? `${Math.round(vmCtx.memory_mb / 1024)} GB` : "—";

        return [{
            key: "cpu",
            label: "CPU",
            value: vmCtx.cpu != null ? `${vmCtx.cpu} vCPU` : "—",
            tone: "slate",
            icon: <Cpu className="w-3.5 h-3.5"/>,
        }, {
            key: "ram", label: "RAM", value: ramGb, tone: "slate", icon: <MemoryStick className="w-3.5 h-3.5"/>,
        }, {
            key: "disk",
            label: "Disk",
            value: vmCtx.disk_gb != null ? `${vmCtx.disk_gb} GB` : "—",
            tone: "slate",
            icon: <HardDrive className="w-3.5 h-3.5"/>,
        }, {
            key: "mac",
            label: "MAC",
            value: vmCtx.primary_mac || "—",
            tone: vmCtx.primary_mac ? "sky" : "slate",
            icon: <Network className="w-3.5 h-3.5"/>,
        }, {
            key: "net",
            label: "NET",
            value: vmCtx.primary_network || "—",
            tone: vmCtx.primary_network ? "sky" : "slate",
            icon: <Network className="w-3.5 h-3.5"/>,
        }, {
            key: "ls",
            label: "Last Sync",
            value: formatAgo(toSecondsAgo(vmCtx.last_sync_at)),
            tone: "sky",
            icon: <Activity className="w-3.5 h-3.5"/>,
        },];
    }, [vmCtx]);

    const vmActionRules = useMemo(() => {
        const s = vmCtx?.status;
        const isDeleted = s === "DELETED";
        const isOn = s === "POWERED_ON";
        const isOff = s === "POWERED_OFF";

        return {
            start: !isDeleted && isOff,
            stop: !isDeleted && isOn,
            restart: !isDeleted && isOn,
            sync: !isDeleted,
            console: !isDeleted,
            blockedReason: isDeleted ? "VM está DELETED (ações bloqueadas)" : null,
        };
    }, [vmCtx?.status]);

    function fireVmAction(action) {
        if (!vmId) return;

        setVmActionLoading((prev) => ({...prev, [action]: true}));

        window.dispatchEvent(new CustomEvent("vm:action", {
            detail: {vmId: Number(vmId), action},
        }));

        setTimeout(() => {
            setVmActionLoading((prev) => ({...prev, [action]: false}));
        }, 10000);
    }

    useEffect(() => {
        function onDone(e) {
            const {vmId: doneId, action, ok} = e?.detail || {};
            if (!doneId || String(doneId) !== String(vmId)) return;
            if (!action) return;

            setVmActionLoading((prev) => ({...prev, [action]: false}));

            if (ok) {
                loadVmContext(vmId, {silent: true});
                loadSummary({silent: true});
            }
        }

        window.addEventListener("vm:actionDone", onDone);
        return () => window.removeEventListener("vm:actionDone", onDone);
    }, [vmId]);

    const pageBlock = useMemo(() => {
        if (isVmDetail && vmCtx) {
            return {
                title: vmCtx.name || `VM #${vmId}`,
                subtitle: vmCtx.os || vmCtx.provider_host || "",
                tone: statusTone(vmCtx.status),
                status: vmCtx.status || "—",
            };
        }

        const path = location.pathname || "/";
        if (path.startsWith("/vms/create")) return {
            title: "Criar VM",
            subtitle: "Provisionamento",
            tone: "sky",
            status: null
        };
        if (path.startsWith("/vms")) return {title: "VMs", subtitle: "Gerenciamento", tone: "sky", status: null};
        if (path.startsWith("/inventory")) return {
            title: "Inventory DC",
            subtitle: "Infra / IPs",
            tone: "sky",
            status: null
        };
        if (path.startsWith("/users")) return {title: "Usuários", subtitle: "Admin", tone: "sky", status: null};
        if (path.startsWith("/invoices")) return {title: "Invoices", subtitle: "Financeiro", tone: "sky", status: null};

        return {title: "Dashboard DC", subtitle: "NOC / Datacenter", tone: "sky", status: null};
    }, [isVmDetail, vmCtx, vmId, location.pathname]);

    const quickActions = useMemo(() => {
        const arr = [];

        if (isVmDetail) {
            arr.push({label: "VMs", icon: <Cpu size={14}/>, onClick: () => navigate("/vms"), tone: "slate"});
            arr.push({
                label: "Dashboard",
                icon: <LayoutDashboard size={14}/>,
                onClick: () => navigate("/dashboard"),
                tone: "slate"
            });
            if (isPrivileged) arr.push({
                label: "Inventory", icon: <Server size={14}/>, onClick: () => navigate("/inventory"), tone: "slate"
            });
            return arr;
        }

        const path = location.pathname || "/";
        if (path.startsWith("/vms")) {
            arr.push({
                label: "Criar VM", icon: <Plus size={14}/>, onClick: () => navigate("/vms/create"), tone: "emerald"
            });
            arr.push({
                label: "Dashboard",
                icon: <LayoutDashboard size={14}/>,
                onClick: () => navigate("/dashboard"),
                tone: "slate"
            });
            if (isPrivileged) arr.push({
                label: "Inventory", icon: <Server size={14}/>, onClick: () => navigate("/inventory"), tone: "slate"
            });
            return arr;
        }

        if (path.startsWith("/dashboard") || path === "/") {
            arr.push({label: "VMs", icon: <Cpu size={14}/>, onClick: () => navigate("/vms"), tone: "slate"});
            if (isPrivileged) {
                arr.push({
                    label: "Inventory", icon: <Server size={14}/>, onClick: () => navigate("/inventory"), tone: "slate"
                });
                arr.push({label: "Users", icon: <Users size={14}/>, onClick: () => navigate("/users"), tone: "slate"});
            }
            return arr;
        }

        if (path.startsWith("/inventory")) {
            arr.push({
                label: "Dashboard",
                icon: <LayoutDashboard size={14}/>,
                onClick: () => navigate("/dashboard"),
                tone: "slate"
            });
            arr.push({label: "VMs", icon: <Cpu size={14}/>, onClick: () => navigate("/vms"), tone: "slate"});
            if (isPrivileged) arr.push({
                label: "Users", icon: <Users size={14}/>, onClick: () => navigate("/users"), tone: "slate"
            });
            return arr;
        }
//
        return arr;
    }, [isVmDetail, vmId, navigate, isPrivileged, location.pathname]);

    return (<header
        className={cls("sticky top-0 z-40 border-b border-slate-800", "bg-gradient-to-b from-slate-950/92 via-slate-950/80 to-slate-950/65", "backdrop-blur-xl")}
    >
        {/* linha viva */}
        <div className="h-[2px] w-full bg-gradient-to-r from-sky-500/0 via-sky-500/35 to-sky-500/0"/>

        {/* TOP BAR */}
        <div className="px-6 h-[60px] flex items-center justify-between">
            {/* LEFT */}
            <div className="flex items-center gap-4 min-w-0">
                {/* BRAND */}
                <div
                    onClick={() => navigate("/")}
                    className="cursor-pointer select-none flex items-center gap-3 group shrink-0"
                >
                    <div
                        className={cls("w-9 h-9 rounded-xl flex items-center justify-center", "bg-slate-900/60 border border-slate-800", "group-hover:bg-slate-900/80 transition")}
                    >
                        <Server className="w-5 h-5 text-sky-400"/>
                    </div>
                    <div className="leading-tight hidden sm:block">
                        <div className="text-sm font-semibold text-slate-100 tracking-wide">
                            VM Panel
                        </div>
                        <div className="text-[11px] text-slate-400">
                            Infra • Cloud • Billing
                        </div>
                    </div>
                </div>

                {/* PAGE BLOCK */}
                <div className="min-w-0 flex-1">
                    {/* Linha do Title + Status */}
                    <div className="flex items-center gap-2 min-w-0">
    <span className="text-sm font-semibold text-slate-100 truncate flex-1 min-w-0">
      {pageBlock.title}
    </span>

                        {pageBlock.status ? (<span className="flex items-center gap-2 shrink-0">
        {/* dot em telas menores */}
                            <span
                                className={cls("inline-flex xl:hidden w-2 h-2 rounded-full", pageBlock.tone === "emerald" && "bg-emerald-400", pageBlock.tone === "amber" && "bg-amber-400", pageBlock.tone === "red" && "bg-red-400", pageBlock.tone === "slate" && "bg-slate-400")}
                                title={pageBlock.status}
                            />

                            {/* badge completo só no desktop */}
                            <span
                                className={cls("hidden xl:inline-flex text-[10px] px-2 py-1 rounded-xl border whitespace-nowrap", pageBlock.tone === "emerald" && "border-emerald-700/40 bg-emerald-900/10 text-emerald-200", pageBlock.tone === "amber" && "border-amber-700/40 bg-amber-900/10 text-amber-200", pageBlock.tone === "red" && "border-red-700/40 bg-red-900/10 text-red-200", pageBlock.tone === "slate" && "border-slate-700/40 bg-slate-900/10 text-slate-200")}
                            >
          {pageBlock.status}
        </span>
      </span>) : null}
                    </div>

                    {/* Subtitle (1 linha no note / 2 linhas no desktop) */}
                    <div
                        className={cls("text-[11px] text-slate-400", "overflow-hidden text-ellipsis", "line-clamp-1 xl:line-clamp-2")}
                    >
                        {pageBlock.subtitle}
                        {summaryErr ? (<span className="ml-2 text-red-400">({summaryErr})</span>) : null}
                    </div>
                </div>

                {/* GLOBAL CHIPS */}
                <div className="hidden xl:flex items-center gap-2 ml-2">
                    {globalChips.map((c) => (<Chip
                        key={c.key}
                        label={c.label}
                        value={c.value}
                        tone={c.tone}
                        icon={c.icon}
                        compact
                    />))}
                </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-3 shrink-0">
                {/* QUICK ACTIONS */}
                <div className="hidden 2xl:flex items-center gap-2">
                    {quickActions.map((a, idx) => (<HeaderButton
                        key={idx}
                        icon={a.icon}
                        label={a.label}
                        onClick={a.onClick}
                        tone={a.tone}
                    />))}
                </div>

                {/* LIVE MODE */}
                {isPrivileged && (<button
                    onClick={toggleLiveMode}
                    className={cls("hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border transition text-xs", liveMode ? "border-emerald-700/40 bg-emerald-900/20 text-emerald-200" : "border-slate-800 bg-slate-900/30 text-slate-300 hover:bg-slate-800/50")}
                    title="Live Mode: acelera refresh"
                >
                    <Radio className={cls("w-4 h-4", liveMode && "animate-pulse")}/>
                    Live <span className="opacity-70">{liveMode ? "ON" : "OFF"}</span>
                </button>)}

                {/* REFRESH */}
                <button
                    onClick={() => loadSummary({silent: false})}
                    className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900/30 text-slate-300 hover:bg-slate-800/50 transition text-xs"
                    title="Atualizar summary"
                >
                    <Activity className={cls("w-4 h-4", summaryLoading && "animate-spin")}/>
                    Atualizar
                </button>

                {/* ALERTS */}
                {isPrivileged && (<div className="relative" ref={alertsRef}>
                    <button
                        onClick={() => {
                            setOpenAlerts(!openAlerts);
                            setOpenUser(false);
                            loadAlerts();
                        }}
                        className="relative p-2 rounded-xl hover:bg-slate-800/70 border border-transparent hover:border-slate-700 transition"
                        title="Alertas"
                    >
                        <Bell size={18}/>
                        {unreadCount > 0 && (<span
                            className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-[10px] flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>)}
                    </button>

                    {openAlerts && (<div
                        className="absolute right-0 top-12 w-96 bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
                        <div
                            className="px-4 py-3 text-xs text-slate-400 border-b border-slate-800 flex justify-between items-center">
                            <span>Alertas do sistema</span>
                            <button
                                onClick={() => setOpenAlerts(false)}
                                className="hover:text-slate-200"
                            >
                                ✕
                            </button>
                        </div>

                        {loadingAlerts ? (<div className="px-4 py-4 text-sm text-slate-400">
                            Carregando alertas...
                        </div>) : alerts.length === 0 ? (
                            <div className="px-4 py-4 text-sm text-slate-400">
                                Nenhum alerta pendente 🎉
                            </div>) : (<div className="max-h-[360px] overflow-auto">
                            {alerts.map((a) => (<div
                                key={a.id}
                                className="px-4 py-3 border-b border-slate-800 hover:bg-slate-900/60 transition"
                            >
                                <div className="flex gap-3">
                                    {(() => {
                                        if (a.type === "error") return <XCircle size={16}
                                                                                className="text-red-400"/>;
                                        if (a.type === "warning") return (<AlertTriangle size={16}
                                                                                         className="text-yellow-400"/>);
                                        if (a.type === "success") return (<CheckCircle size={16}
                                                                                       className="text-emerald-400"/>);
                                        return <CheckCircle size={16} className="text-sky-400"/>;
                                    })()}

                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-slate-100">
                                            {a.title}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            {a.message}
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-2">
                                            {new Date(a.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>))}
                        </div>)}
                    </div>)}
                </div>)}

                {/* USER INFO */}
                <div className="hidden sm:block text-right">
                    <div className="text-sm text-slate-100">
                        {user?.name || user?.login || "Usuário"}
                    </div>
                    <div className="text-xs text-slate-400">{user?.email || ""}</div>
                </div>

                {/* AVATAR MENU */}
                <div className="relative" ref={userRef}>
                    <button
                        onClick={() => {
                            setOpenUser(!openUser);
                            setOpenAlerts(false);
                        }}
                        className="w-9 h-9 rounded-full bg-slate-800/70 border border-slate-700 flex items-center justify-center font-semibold hover:bg-slate-800 transition"
                        title="Conta"
                    >
                        {user?.login?.slice(0, 2)?.toUpperCase() || "US"}
                    </button>

                    {openUser && (<div
                        className="absolute right-0 top-14 w-56 bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
                        <div className="px-4 py-3 border-b border-slate-800">
                            <div className="text-sm font-semibold text-slate-100">
                                {user?.name || user?.login || "Conta"}
                            </div>
                            <div className="text-xs text-slate-400">{user?.email || ""}</div>
                            <div className="text-[11px] text-slate-500 mt-1">
                                Role: <b className="text-slate-300">{role || "user"}</b>
                            </div>
                        </div>

                        {isPrivileged && (<button
                            onClick={() => {
                                setOpenUser(false);
                                navigate("/users");
                            }}
                            className="flex gap-2 w-full px-4 py-3 text-sm hover:bg-slate-900/70"
                        >
                            <Users size={14}/> Usuários
                        </button>)}

                        <div className="border-t border-slate-800"/>

                        <button
                            onClick={logout}
                            className="flex gap-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-slate-900/70"
                        >
                            <LogOut size={14}/> Sair
                        </button>
                    </div>)}
                </div>
            </div>
        </div>

        {/* VM DETAIL STRIP */}
        {isVmDetail && (<div className="px-1 pb-3 -mt-1">
            <div className="flex flex-wrap items-center gap-1 justify-between">
                {/* LEFT: Back + Chips */}
                <div className="flex flex-wrap items-center gap-2">
                    <ActionButton
                        icon={<ArrowLeft size={14}/>}
                        label="Voltar"
                        tone="slate"
                        onClick={() => navigate(-1)}
                    />

                    {vmCtxLoading ? (<span className="text-[11px] text-slate-500">
                  Carregando contexto da VM…
                </span>) : vmCtx ? (<>
                        {vmMainChips.map((c) => (<Chip
                            key={c.key}
                            label={c.label}
                            value={c.value}
                            tone={c.tone}
                            icon={c.icon}
                        />))}

                        <div className="hidden 2xl:flex gap-2 opacity-80">
                            {vmSecondaryChips.map((c) => (<Chip
                                key={c.key}
                                label={c.label}
                                value={c.value}
                                tone={c.tone}
                                icon={c.icon}
                                compact
                            />))}
                        </div>
                    </>) : (<span className="text-[11px] text-slate-500">
                  Contexto da VM indisponível.
                </span>)}
                </div>

                {/* RIGHT: VM Actions */}
                <div className="flex flex-wrap items-center gap-2">
                    {vmActionRules.blockedReason && (<span
                        className="text-[11px] text-red-300 border border-red-800/40 bg-red-900/10 px-3 py-2 rounded-xl">
                  {vmActionRules.blockedReason}
                </span>)}

                    <ActionButton
                        icon={<Play size={14}/>}
                        label="Start"
                        tone="emerald"
                        disabled={!vmActionRules.start}
                        loading={vmActionLoading.start}
                        onClick={() => fireVmAction("start")}
                    />

                    <ActionButton
                        icon={<Power size={14}/>}
                        label="Stop"
                        tone="red"
                        disabled={!vmActionRules.stop}
                        loading={vmActionLoading.stop}
                        onClick={() => fireVmAction("stop")}
                    />

                    <ActionButton
                        icon={<RotateCcw size={14}/>}
                        label="Restart"
                        tone="amber"
                        disabled={!vmActionRules.restart}
                        loading={vmActionLoading.restart}
                        onClick={() => fireVmAction("restart")}
                    />

                    <ActionButton
                        icon={<RefreshCcw size={14}/>}
                        label="Sync"
                        tone="sky"
                        disabled={!vmActionRules.sync}
                        loading={vmActionLoading.sync}
                        onClick={() => fireVmAction("sync")}
                    />

                    <ActionButton
                        icon={<TerminalSquare size={14}/>}
                        label="Console"
                        tone="slate"
                        disabled={!vmActionRules.console}
                        loading={vmActionLoading.console}
                        onClick={() => {
                            setVmActionLoading((p) => ({...p, console: true}));
                            navigate(`/vms/${vmId}/console`);
                            setTimeout(() => setVmActionLoading((p) => ({...p, console: false})), 600);
                        }}
                    />
                </div>
            </div>
        </div>)}
    </header>);
}
