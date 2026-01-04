import {useEffect, useState, useRef, useMemo} from "react";
import {useParams, useNavigate} from "react-router-dom";
import {
    ArrowLeft,
    Server,
    Cpu,
    MemoryStick,
    HardDrive,
    Power,
    RotateCcw,
    RefreshCw,
    ShieldCheck,
    AlertTriangle,
    Network,
    Disc3,
    Wrench,
    ExternalLink,
    Loader2,
} from "lucide-react";

import api from "../services";

function cls(...arr) {
    return arr.filter(Boolean).join(" ");
}

/* ================= PAGE ================= */

export default function VmDetail() {
    const {id} = useParams();
    const navigate = useNavigate();
    const pollRef = useRef(null);

    const [vm, setVm] = useState(null);
    const [hardware, setHardware] = useState(null);
    const [disks, setDisks] = useState([]);
    const [nics, setNics] = useState([]);
    const [cdroms, setCdroms] = useState([]);
    const [tab, setTab] = useState("overview");

    const [loading, setLoading] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);

    // 🔒 controle de ação
    const [acting, setActing] = useState(null); // start | stop | restart | sync
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        setInitialLoad(true);
        loadVm(false);
        return () => stopPolling();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    async function loadVm(isPolling = false) {
        try {
            if (!isPolling && initialLoad) setLoading(true);

            const {data} = await api.get(`/vm/${id}/detail`);
            setVm(data.vm);
            setHardware(data.hardware);
            setDisks(data.disks || []);
            setNics(data.nics || []);
            setCdroms(data.cdroms || []);
        } catch (e) {
            console.error(e);
            navigate("/");
        } finally {
            if (!isPolling && initialLoad) {
                setLoading(false);
                setInitialLoad(false);
            }
        }
    }

    function startPolling() {
        stopPolling();
        pollRef.current = setInterval(async () => {
            await loadVm(true);
            setProgress((p) => Math.min(p + 15, 95));
        }, 2000);
    }

    function stopPolling() {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }

    async function action(endpoint) {
        if (acting) return;

        try {
            setActing(endpoint);
            setProgress(10);

            await api.post(`/vm/${id}/${endpoint}`);
            startPolling();
        } catch (err) {
            console.error(err);
            setActing(null);
            setProgress(0);
        }
    }

    // libera ações quando VM estabiliza
    useEffect(() => {
        if (!acting || !vm) return;

        const stable = vm.status === "POWERED_ON" || vm.status === "POWERED_OFF";

        if (stable) {
            stopPolling();
            setProgress(100);
            setTimeout(() => {
                setActing(null);
                setProgress(0);
            }, 500);
        }
    }, [vm, acting]);

    useEffect(() => {
        // não atualiza automaticamente se houver ação em andamento
        if (acting) return;

        const interval = setInterval(() => {
            loadVm(true); // refresh silencioso
        }, 20000); // 20 segundos

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [acting, id]);


    useEffect(() => {
        async function runAction(action) {
            try {
                if (!id) return;

                if (action === "start") await api.post(`/vm/${id}/start`);
                if (action === "stop") await api.post(`/vm/${id}/stop`);
                if (action === "restart") await api.post(`/vm/${id}/restart`);
                if (action === "sync") await api.post(`/vm/${id}/sync`);

                // avisa o Header que terminou com sucesso
                window.dispatchEvent(new CustomEvent("vm:actionDone", {
                    detail: { vmId: Number(id), action, ok: true }
                }));

                // se vc quiser forçar reload do detail local
                // loadVmDetail();
            } catch (e) {
                console.log("[VM ACTION ERROR]", action, e?.message);

                window.dispatchEvent(new CustomEvent("vm:actionDone", {
                    detail: { vmId: Number(id), action, ok: false, error: e?.message || "Erro" }
                }));
            }
        }

        function onAction(e) {
            const { vmId, action } = e?.detail || {};
            if (!vmId || String(vmId) !== String(id)) return;
            if (!action) return;
            runAction(action);
        }

        window.addEventListener("vm:action", onAction);
        return () => window.removeEventListener("vm:action", onAction);
    }, [id]);


    /* ================= DERIVED ================= */

    const toolsOk = vm?.tools_status === "RUNNING";
    const isoMounted = useMemo(() => cdroms.some((c) => c.iso_file), [cdroms]);
    const nicConnected = useMemo(() => nics.some((n) => n.connected), [nics]);

    const canStart = vm?.status !== "POWERED_ON" && !acting;
    const canStop = vm?.status === "POWERED_ON" && !acting;
    const canRestart = vm?.status === "POWERED_ON" && !acting;

    const statusPill = useMemo(() => statusPillClass(vm?.status), [vm?.status]);
    const statusText = useMemo(() => statusLabel(vm?.status), [vm?.status]);

    if (loading || !vm) {
        return (<div className="min-h-screen bg-slate-950 text-slate-400">
            <div className="p-6">Carregando VM…</div>
        </div>);
    }

    /* ================= UI ================= */

    return (<div className="min-h-screen text-slate-200 relative">
        {/* BACKGROUND pesado */}
        <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950 to-black"/>
            <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_55%)]"/>
            <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(16,185,129,0.08),transparent_55%)]"/>
        </div>

        {/* ACTION BAR FIXA */}
        {/* ============================
   HEADER (Microsoft Console Style)
============================ */}
        <div className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/70 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 py-4">
                {/* LINE 1 */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 hover:bg-white/5 transition"
                        title="Voltar"
                    >
                        <ArrowLeft className="w-4 h-4"/>
                    </button>

                    {/* Identity */}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-xl border border-slate-800 bg-slate-950/60">
                                <Server className="w-5 h-5 text-sky-400"/>
                            </div>

                            <div className="min-w-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <h1 className="text-lg md:text-xl font-semibold text-slate-100 truncate">
                                        {vm.name}
                                    </h1>

                                    {/* Status Pill */}
                                    <span
                                        className={cls("px-3 py-1 text-xs rounded-xl border font-semibold flex items-center gap-2", statusPillClass(vm.status))}
                                    >
                <span
                    className={cls("w-2 h-2 rounded-full", vm.status === "POWERED_ON" ? "bg-emerald-500" : vm.status === "POWERED_OFF" ? "bg-slate-500" : vm.status === "SUSPENDED" ? "bg-orange-400" : vm.status === "DELETED" ? "bg-red-500" : "bg-yellow-400", acting ? "animate-pulse" : "")}
                />
                                        {statusLabel(vm.status)}
              </span>

                                    {/* Acting tag */}
                                    {acting && (<span
                                        className="text-[11px] px-2 py-1 rounded-lg border border-slate-800 bg-slate-900/50 text-slate-200">
                  Executando: <b className="capitalize">{acting}</b>
                </span>)}
                                </div>

                                {/* breadcrumb */}
                                <div className="text-[11px] text-slate-500 mt-1">
                                    VMs / <span className="text-slate-300">{vm.name}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions (2 groups) */}
                    <div className="hidden md:flex items-center gap-2">
                        {/* Group: Operação */}
                        <div className="flex items-center gap-2">
                            <ActionButton
                                icon={<Power className="w-4 h-4"/>}
                                label="Start"
                                tone="emerald"
                                disabled={!canStart}
                                onClick={() => action("start")}
                            />
                            <ActionButton
                                icon={<Power className="w-4 h-4"/>}
                                label="Stop"
                                tone="red"
                                disabled={!canStop}
                                onClick={() => action("stop")}
                            />
                            <ActionButton
                                icon={<RotateCcw className="w-4 h-4"/>}
                                label="Restart"
                                tone="orange"
                                disabled={!canRestart}
                                onClick={() => action("restart")}
                            />
                        </div>

                        {/* Divider */}
                        <div className="w-px h-9 bg-slate-800 mx-1"/>

                        {/* Group: Sistema */}
                        <div className="flex items-center gap-2">
                            <ActionButton
                                icon={<RefreshCw className="w-4 h-4"/>}
                                label="Sync"
                                tone="sky"
                                disabled={!!acting}
                                onClick={() => action("sync")}
                            />

                            {/* Console = arma */}
                            <button
                                onClick={() => navigate(`/vms/${id}/console`)}
                                className={cls("flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition", "border border-slate-700 bg-slate-950/40 hover:bg-white/5 text-slate-200")}
                                title="Abrir Console"
                            >
                                <ExternalLink className="w-4 h-4 text-sky-300"/>
                                Console
                            </button>
                        </div>
                    </div>
                </div>

                {/* LINE 2 (telemetry chips) */}
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                    <Chip label="OS" value={vm.os || "—"} tone="zinc"/>
                    <Chip label="Cluster" value={vm.cluster_name || "—"} tone="sky"/>
                    <Chip label="Provider" value={vm.provider_host || "—"} tone="zinc"/>
                    <Chip label="IP" value={vm.ip_address || "—"} tone="emerald"/>
                    <Chip
                        label="Tools"
                        value={vm.tools_status || "—"}
                        tone={vm.tools_status === "RUNNING" ? "emerald" : "orange"}
                    />
                    <Chip
                        label="Last Sync"
                        value={vm.last_sync_at ? new Date(vm.last_sync_at).toLocaleString() : "—"}
                        tone="zinc"
                    />

                    {/* Quick hint: acting */}
                    {acting && (<span className="ml-auto text-[11px] text-slate-400">
          Atualizando em tempo real enquanto ação executa…
        </span>)}
                </div>
            </div>

            {/* PROGRESS BAR colada */}
            {acting && (<div className="w-full h-1 bg-slate-900">
                <div
                    className={cls("h-full transition-all duration-500", actionColor(acting))}
                    style={{width: `${progress}%`}}
                />
            </div>)}
        </div>

        {/* CONTENT */}
        <main className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Quick KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatusItem label="State" value={vm.status}/>
                <StatusItem label="Tools" value={vm.tools_status || "—"}/>
                <StatusItem
                    label="Last Sync"
                    value={vm.last_sync_at ? new Date(vm.last_sync_at).toLocaleString() : "—"}
                />
                <StatusItem label="Provider" value={vm.provider_host || "—"}/>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-slate-800 text-sm">
                <TabButton
                    icon={<Server className="w-4 h-4"/>}
                    label="overview"
                    active={tab === "overview"}
                    onClick={() => setTab("overview")}
                />
                <TabButton
                    icon={<Network className="w-4 h-4"/>}
                    label="network"
                    active={tab === "network"}
                    onClick={() => setTab("network")}
                />
                <TabButton
                    icon={<Disc3 className="w-4 h-4"/>}
                    label="storage"
                    active={tab === "storage"}
                    onClick={() => setTab("storage")}
                />
                <TabButton
                    icon={<Wrench className="w-4 h-4"/>}
                    label="tools"
                    active={tab === "tools"}
                    onClick={() => setTab("tools")}
                />
            </div>

            {/* OVERVIEW */}
            {tab === "overview" && (<>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card title="Overview">
                        <Info label="OS" value={vm.os}/>
                        <Info label="IP Address" value={vm.ip_address || "—"}/>
                        <Info label="Datastore" value={disks[0]?.datastore || "—"}/>
                        <Info label="Network" value={nics[0]?.network_name || "—"}/>
                        <Info label="VM ID" value={vm.provider_vm_id}/>
                    </Card>

                    <Card title="Hardware" className="lg:col-span-2">
                        <HardwareItem icon={<Cpu/>} label="CPU" value={`${vm.cpu} vCPU`}/>
                        <HardwareItem
                            icon={<MemoryStick/>}
                            label="Memory"
                            value={`${vm.memory_mb ? vm.memory_mb / 1024 : "—"} GB`}
                        />
                        <HardwareItem icon={<HardDrive/>} label="Disk" value={`${vm.disk_gb} GB`}/>
                        <Info label="Firmware" value={hardware?.firmware}/>
                        <Info label="Boot" value={hardware?.boot_type}/>
                    </Card>
                </div>

                <Card title="Health / System">
                    <HealthItem ok={toolsOk} label="VMware Tools"/>
                    <HealthItem ok={!isoMounted} label="ISO Mounted" warn/>
                    <HealthItem ok={nicConnected} label="Network Connected"/>
                </Card>
            </>)}

            {/* NETWORK */}
            {tab === "network" && (<Card title="Network Interfaces">
                {nics.length ? (nics.map((n) => (<Info
                    key={n.id || `${n.label}-${n.mac_address}`}
                    label={`${n.label} (${n.mac_address})`}
                    value={`${n.network_name || "—"} ${n.connected ? "• CONNECTED" : "• DISCONNECTED"}`}
                />))) : (<EmptyState text="Nenhuma interface encontrada."/>)}
            </Card>)}

            {/* STORAGE */}
            {tab === "storage" && (<Card title="Storage">
                {disks.length ? (disks.map((d) => (<Info
                    key={d.id || d.label}
                    label={d.label}
                    value={`${Math.round(d.capacity_bytes / 1024 / 1024 / 1024)} GB • ${d.datastore || "—"}`}
                />))) : (<EmptyState text="Nenhum disco encontrado."/>)}
            </Card>)}

            {/* TOOLS */}
            {tab === "tools" && (<Card title="VMware Tools">
                <Info label="Status" value={vm.tools_status}/>
                <Info label="Version" value={vm.tools_version || "—"}/>
                <Info label="Version Status" value={vm.tools_version_status || "—"}/>
            </Card>)}
        </main>

        {/* Mobile actions dock */}
        <div
            className="md:hidden fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-950/80 backdrop-blur-xl p-3 z-40">
            <div className="grid grid-cols-5 gap-2">
                <IconAction
                    label="Start"
                    tone="emerald"
                    disabled={!canStart}
                    loading={acting === "start"}
                    onClick={() => action("start")}
                >
                    <Power className="w-4 h-4"/>
                </IconAction>
                <IconAction
                    label="Stop"
                    tone="red"
                    disabled={!canStop}
                    loading={acting === "stop"}
                    onClick={() => action("stop")}
                >
                    <Power className="w-4 h-4"/>
                </IconAction>
                <IconAction
                    label="Restart"
                    tone="orange"
                    disabled={!canRestart}
                    loading={acting === "restart"}
                    onClick={() => action("restart")}
                >
                    <RotateCcw className="w-4 h-4"/>
                </IconAction>
                <IconAction
                    label="Sync"
                    tone="sky"
                    disabled={!!acting}
                    loading={acting === "sync"}
                    onClick={() => action("sync")}
                >
                    <RefreshCw className="w-4 h-4"/>
                </IconAction>
                <IconAction
                    label="Console"
                    tone="zinc"
                    disabled={false}
                    loading={false}
                    onClick={() => navigate(`/vms/${id}/console`)}
                >
                    <ExternalLink className="w-4 h-4"/>
                </IconAction>
            </div>
        </div>
    </div>);
}

/* ================= HELPERS ================= */

function statusLabel(status) {
    switch (status) {
        case "POWERED_ON":
            return "ONLINE";
        case "POWERED_OFF":
            return "OFFLINE";
        case "SUSPENDED":
            return "SUSPENDED";
        case "DELETED":
            return "DELETED";
        case "CRASHED":
            return "CRASHED";
        default:
            return status || "UNKNOWN";
    }
}

function statusPillClass(status) {
    switch (status) {
        case "POWERED_ON":
            return "border-emerald-500/25 bg-emerald-500/10 text-emerald-100";
        case "POWERED_OFF":
            return "border-slate-800 bg-slate-950/60 text-slate-200";
        case "SUSPENDED":
            return "border-orange-500/25 bg-orange-500/10 text-orange-100";
        case "DELETED":
            return "border-red-500/25 bg-red-500/10 text-red-100";
        case "CRASHED":
            return "border-red-500/25 bg-red-500/10 text-red-100";
        default:
            return "border-slate-800 bg-slate-950/60 text-slate-200";
    }
}

function actionColor(action) {
    switch (action) {
        case "start":
            return "bg-emerald-500";
        case "stop":
            return "bg-red-500";
        case "restart":
            return "bg-orange-400";
        case "sync":
            return "bg-sky-500";
        default:
            return "bg-slate-500";
    }
}

/* ================= COMPONENTS ================= */

function ActionButton({icon, label, onClick, disabled, tone}) {
    const tones = {
        emerald: "bg-emerald-600 hover:bg-emerald-500 text-white",
        red: "bg-red-600 hover:bg-red-500 text-white",
        orange: "bg-orange-500 hover:bg-orange-400 text-black",
        sky: "bg-sky-600 hover:bg-sky-500 text-white",
        zinc: "bg-slate-900/60 hover:bg-white/5 border border-slate-800 text-slate-200",
    };

    return (<button
        onClick={onClick}
        disabled={disabled}
        className={cls("flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition", tones[tone] || tones.zinc, disabled ? "opacity-50 cursor-not-allowed" : "")}
    >
        {disabled && tone !== "zinc" ? <Loader2 className="w-4 h-4 animate-spin"/> : icon}
        {label}
    </button>);
}

function IconAction({label, tone, disabled, loading, onClick, children}) {
    const tones = {
        emerald: "border-emerald-500/25 bg-emerald-500/10 text-emerald-100",
        red: "border-red-500/25 bg-red-500/10 text-red-100",
        orange: "border-orange-500/25 bg-orange-500/10 text-orange-100",
        sky: "border-sky-500/25 bg-sky-500/10 text-sky-100",
        zinc: "border-slate-800 bg-slate-950/60 text-slate-200",
    };

    return (<button
        onClick={onClick}
        disabled={disabled || loading}
        className={cls("flex flex-col items-center justify-center gap-1 py-2 rounded-2xl border transition text-xs font-semibold", tones[tone] || tones.zinc, disabled || loading ? "opacity-60 cursor-not-allowed" : "")}
    >
        {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : children}
        {label}
    </button>);
}

function TabButton({icon, label, active, onClick}) {
    return (<button
        onClick={onClick}
        className={cls("pb-3 flex items-center gap-2 capitalize text-sm transition", active ? "border-b-2 border-sky-500 text-sky-300" : "text-slate-400 hover:text-slate-200")}
    >
        {icon}
        {label}
    </button>);
}

function Card({title, children, className = ""}) {
    return (<div
        className={cls("bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3", className)}
    >
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            {title}
        </h3>
        {children}
    </div>);
}

function Info({label, value}) {
    return (<div className="flex justify-between text-sm gap-4">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-200 text-right truncate">{value || "—"}</span>
    </div>);
}

function HardwareItem({icon, label, value}) {
    return (<div className="flex items-center gap-3 text-sm">
        <div className="text-slate-400">{icon}</div>
        <span className="flex-1 text-slate-400">{label}</span>
        <span className="text-slate-200 font-semibold">{value}</span>
    </div>);
}

function StatusItem({label, value}) {
    return (<div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-200 mt-1 truncate">{value}</p>
    </div>);
}

function HealthItem({ok, label, warn}) {
    return (<div className="flex items-center gap-2 text-sm">
        {ok ? (<ShieldCheck className="w-4 h-4 text-emerald-500"/>) : warn ? (
            <AlertTriangle className="w-4 h-4 text-orange-400"/>) : (
            <AlertTriangle className="w-4 h-4 text-red-500"/>)}
        <span className={ok ? "text-slate-200" : "text-slate-300"}>{label}</span>
    </div>);
}

function EmptyState({text}) {
    return (<div className="text-sm text-slate-500 py-6 text-center">
        {text}
    </div>);
}
function Chip({ label, value, tone = "zinc" }) {
    const tones = {
        zinc: "border-slate-800 bg-slate-950/50 text-slate-200",
        sky: "border-sky-500/25 bg-sky-500/10 text-sky-100",
        emerald: "border-emerald-500/25 bg-emerald-500/10 text-emerald-100",
        orange: "border-orange-500/25 bg-orange-500/10 text-orange-100",
        red: "border-red-500/25 bg-red-500/10 text-red-100",
    };

    return (
        <div
            className={cls(
                "px-3 py-1.5 rounded-xl border flex items-center gap-2",
                tones[tone] || tones.zinc
            )}
        >
            <span className="text-[11px] text-slate-400">{label}:</span>
            <span className="font-semibold text-xs truncate max-w-[260px]">{value}</span>
        </div>
    );
}
