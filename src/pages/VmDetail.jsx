import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
    Ban,
} from "lucide-react";

import VmsApi from "../services/vms";
import VmCancelRequestModal from "../components/VmCancelRequestModal";
import { canVm, whyVmDenied } from "../utils/permissions";

function cls(...arr) {
    return arr.filter(Boolean).join(" ");
}

function bytesToGb(bytes = 0) {
    return Math.round((Number(bytes) / 1024 / 1024 / 1024) * 10) / 10;
}

export default function VmDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    // ✅ payload real /vm/:id/detail
    const [vm, setVm] = useState(null);
    const [hardware, setHardware] = useState(null);
    const [disks, setDisks] = useState([]);
    const [nics, setNics] = useState([]);
    const [cdroms, setCdroms] = useState([]);

    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(null);
    const [progress, setProgress] = useState(0);
    const [tab, setTab] = useState("overview");

    const pollRef = useRef(null);
    const [openCancel, setOpenCancel] = useState(false);

    const isDeleted = vm?.status === "DELETED";

    // totals reais (disks)
    const totalDiskGb = useMemo(() => {
        const totalBytes = (disks || []).reduce((sum, d) => sum + Number(d.capacity_bytes || 0), 0);
        return bytesToGb(totalBytes);
    }, [disks]);

    // ✅ Permissões por contrato
    const canRequestCancel = canVm("cancel_request");

    const canStart =
        !isDeleted && canVm("start") && vm?.status !== "POWERED_ON" && !acting;
    const canStop =
        !isDeleted && canVm("stop") && vm?.status === "POWERED_ON" && !acting;
    const canRestart =
        !isDeleted && canVm("reboot") && vm?.status === "POWERED_ON" && !acting;

    async function loadVm(silent = false) {
        if (!id) return;
        if (!silent) setLoading(true);

        try {
            const data = await VmsApi.detail(id);

            // ✅ contrato real
            setVm(data?.vm || null);
            setHardware(data?.hardware || null);
            setDisks(Array.isArray(data?.disks) ? data.disks : []);
            setNics(Array.isArray(data?.nics) ? data.nics : []);
            setCdroms(Array.isArray(data?.cdroms) ? data.cdroms : []);
        } catch (err) {
            console.error(err);
        } finally {
            if (!silent) setLoading(false);
        }
    }

    function stopPolling() {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
    }

    function startPolling() {
        stopPolling();
        pollRef.current = setInterval(() => {
            loadVm(true);
        }, 2000);
    }

    useEffect(() => {
        loadVm();
        return () => stopPolling();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // fim de ação quando status estabiliza
    useEffect(() => {
        if (!acting) return;

        const stable = vm?.status === "POWERED_ON" || vm?.status === "POWERED_OFF" || isDeleted;

        if (stable) {
            stopPolling();
            setProgress(100);
            setTimeout(() => {
                setActing(null);
                setProgress(0);
            }, 500);
        }
    }, [vm, acting, isDeleted]);

    // refresh silencioso se não estiver agindo
    useEffect(() => {
        if (acting) return;

        const interval = setInterval(() => {
            loadVm(true);
        }, 20000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [acting, id]);

    // executor de ação
    useEffect(() => {
        async function runAction(action) {
            try {
                if (!id) return;

                setProgress(5);
                startPolling();

                if (action === "start") await VmsApi.start(id);
                if (action === "stop") await VmsApi.stop(id);
                if (action === "restart") await VmsApi.restart(id);
                if (action === "sync") await VmsApi.sync(id);

                setProgress(30);
            } catch (err) {
                console.error(err);
                stopPolling();
                setActing(null);
                setProgress(0);
            }
        }

        if (!acting) return;
        runAction(acting);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [acting]);

    function action(a) {
        if (acting) return;
        setActing(a);
    }

    if (loading) {
        return <div className="p-6 text-slate-400">Carregando VM...</div>;
    }

    if (!vm) {
        return <div className="p-6 text-slate-400">VM não encontrada.</div>;
    }

    return (
        <div className="min-h-screen relative">
            {/* BG */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(16,185,129,0.08),transparent_55%)]" />
            </div>

            {/* HEADER */}
            <div className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/70 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    {/* LINE 1 */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 hover:bg-white/5 transition"
                            title="Voltar"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>

                        {/* Identity */}
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 rounded-xl border border-slate-800 bg-slate-950/60">
                                    <Server className="w-5 h-5 text-sky-400" />
                                </div>

                                <div className="min-w-0">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <h1 className="text-lg font-semibold text-white truncate">
                                            {vm.name || vm.hostname || `VM #${vm.id}`}
                                        </h1>

                                        <Chip
                                            label="Status"
                                            value={vm.status}
                                            tone={
                                                vm.status === "POWERED_ON"
                                                    ? "emerald"
                                                    : vm.status === "POWERED_OFF"
                                                        ? "red"
                                                        : vm.status === "DELETED"
                                                            ? "orange"
                                                            : "zinc"
                                            }
                                        />
                                    </div>

                                    <div className="text-xs text-slate-400 truncate">
                                        VMs / {vm.name || vm.hostname || `#${vm.id}`}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="hidden md:flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <ActionButton
                                    icon={<Power className="w-4 h-4" />}
                                    label="Start"
                                    tone="emerald"
                                    disabled={!canStart}
                                    loading={acting === "start"}
                                    title={isDeleted ? "VM DELETED não executa ação" : "Start"}
                                    onClick={() => action("start")}
                                />
                                <ActionButton
                                    icon={<Power className="w-4 h-4" />}
                                    label="Stop"
                                    tone="red"
                                    disabled={!canStop}
                                    loading={acting === "stop"}
                                    title={
                                        isDeleted
                                            ? "VM DELETED não executa ação"
                                            : !canStop
                                                ? whyVmDenied("stop")
                                                : "Stop"
                                    }
                                    onClick={() => action("stop")}
                                />
                                <ActionButton
                                    icon={<RotateCcw className="w-4 h-4" />}
                                    label="Restart"
                                    tone="orange"
                                    disabled={!canRestart}
                                    loading={acting === "restart"}
                                    title={isDeleted ? "VM DELETED não executa ação" : "Restart"}
                                    onClick={() => action("restart")}
                                />
                            </div>

                            <div className="w-px h-9 bg-slate-800 mx-1" />

                            <div className="flex items-center gap-2">
                                <ActionButton
                                    icon={<RefreshCw className="w-4 h-4" />}
                                    label="Sync"
                                    tone="sky"
                                    disabled={!!acting}
                                    loading={acting === "sync"}
                                    onClick={() => action("sync")}
                                />

                                <button
                                    onClick={() => navigate(`/vms/${id}/console`)}
                                    className={cls(
                                        "flex items-center gap-2 px-3 py-2 rounded-xl border transition text-sm font-semibold",
                                        acting ? "opacity-50 cursor-not-allowed" : "",
                                        "border-slate-800 bg-slate-950/40 hover:bg-white/5 text-slate-200"
                                    )}
                                    title={isDeleted ? "VM DELETED não tem console" : "Abrir Console"}
                                    disabled={!!acting || isDeleted}
                                >
                                    <ExternalLink className="w-4 h-4 text-sky-300" />
                                    Console
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* LINE 2 */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Chip label="OS" value={vm.os || "—"} />
                        <Chip label="Cluster" value={vm.cluster_name || "—"} />
                        <Chip label="Provider" value={vm.provider || "—"} tone="sky" />
                        <Chip label="IP" value={vm.ip_address || "—"} />
                        <Chip label="Tools" value={vm.tools_status || "—"} />
                        <Chip
                            label="Last Sync"
                            value={vm.last_sync_at ? new Date(vm.last_sync_at).toLocaleString() : "—"}
                        />
                    </div>

                    {/* PROGRESS */}
                    {acting ? (
                        <div className="mt-3 h-1 w-full bg-slate-900/70 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-sky-500 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    ) : null}
                </div>
            </div>

            {/* CONTENT */}
            <main className="max-w-7xl mx-auto px-6 py-6 relative z-10">
                {/* Tabs */}
                <div className="flex items-center gap-2 mb-6">
                    <TabButton
                        icon={<Server className="w-4 h-4" />}
                        label="overview"
                        active={tab === "overview"}
                        onClick={() => setTab("overview")}
                    />
                    <TabButton
                        icon={<Network className="w-4 h-4" />}
                        label="network"
                        active={tab === "network"}
                        onClick={() => setTab("network")}
                    />
                    <TabButton
                        icon={<Disc3 className="w-4 h-4" />}
                        label="storage"
                        active={tab === "storage"}
                        onClick={() => setTab("storage")}
                    />
                    <TabButton
                        icon={<Wrench className="w-4 h-4" />}
                        label="tools"
                        active={tab === "tools"}
                        onClick={() => setTab("tools")}
                    />
                </div>

                {/* OVERVIEW */}
                {tab === "overview" && (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card title="Overview">
                                <Info label="OS" value={vm.os} />
                                <Info label="IP Address" value={vm.ip_address || "—"} />
                                <Info label="Datastore" value={disks[0]?.datastore || "—"} />
                                <Info label="Network" value={nics[0]?.network_name || "—"} />
                                <Info label="Provider VM ID" value={vm.provider_vm_id || "—"} />
                            </Card>

                            <Card title="Hardware">
                                <Info
                                    icon={<Cpu className="w-4 h-4 text-slate-400" />}
                                    label="CPU"
                                    value={`${hardware?.cpu_count ?? vm.cpu ?? "—"} vCPU`}
                                />
                                <Info
                                    icon={<MemoryStick className="w-4 h-4 text-slate-400" />}
                                    label="Memory"
                                    value={`${Math.round((hardware?.memory_mb ?? vm.memory_mb ?? 0) / 1024) || "—"} GB`}
                                />
                                <Info
                                    icon={<HardDrive className="w-4 h-4 text-slate-400" />}
                                    label="Disk (real)"
                                    value={`${totalDiskGb || vm.disk_gb || "—"} GB`}
                                />
                                <Info label="Boot Type" value={hardware?.boot_type || "—"} />
                                <Info label="HW Version" value={hardware?.hw_version || "—"} />
                            </Card>

                            <Card title="Health / System">
                                <HealthItem
                                    icon={<AlertTriangle className="w-4 h-4" />}
                                    label="VMware Tools"
                                    ok={vm.tools_status === "OK"}
                                />
                                <HealthItem
                                    icon={<AlertTriangle className="w-4 h-4" />}
                                    label="ISO Mounted"
                                    ok={!cdroms.some((c) => c.iso_file)}
                                />
                                <HealthItem
                                    icon={<ShieldCheck className="w-4 h-4" />}
                                    label="Network Connected"
                                    ok={nics.some((n) => n.connected)}
                                />
                            </Card>
                        </div>

                        {/* Cancelamento */}
                        <div className="mt-6">
                            <Card title="Cancelamento">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <div className="text-sm font-semibold text-slate-100">
                                            Solicitar cancelamento
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            Isso abre um ticket para o DC/NOC. Não desliga a VM automaticamente.
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setOpenCancel(true)}
                                        disabled={!canRequestCancel}
                                        title={
                                            !canRequestCancel
                                                ? whyVmDenied("cancel_request")
                                                : "Solicitar cancelamento"
                                        }
                                        className={cls(
                                            "px-4 py-2 rounded-xl border text-sm font-semibold flex items-center gap-2 transition",
                                            canRequestCancel
                                                ? "border-orange-500/25 bg-orange-500/10 hover:bg-orange-500/15 text-orange-100"
                                                : "border-slate-800 bg-white/5 text-slate-500 opacity-60 cursor-not-allowed"
                                        )}
                                    >
                                        <Ban className="w-4 h-4" />
                                        Solicitar cancelamento
                                    </button>
                                </div>
                            </Card>
                        </div>
                    </>
                )}

                {/* NETWORK */}
                {tab === "network" && (
                    <Card title="Network Interfaces">
                        {nics.length ? (
                            nics.map((n) => (
                                <Info
                                    key={n.id || n.mac_address}
                                    label={n.label || n.mac_address}
                                    value={`${n.network_name || "—"} • ${n.connected ? "CONNECTED" : "DISCONNECTED"}`}
                                />
                            ))
                        ) : (
                            <EmptyState text="Nenhuma interface encontrada." />
                        )}
                    </Card>
                )}

                {/* STORAGE */}
                {tab === "storage" && (
                    <Card title="Storage">
                        {disks.length ? (
                            disks.map((d) => (
                                <Info
                                    key={d.id || d.label}
                                    label={d.label || "Disk"}
                                    value={`${bytesToGb(d.capacity_bytes)} GB • ${d.datastore || "—"}`}
                                />
                            ))
                        ) : (
                            <EmptyState text="Nenhum disco encontrado." />
                        )}
                    </Card>
                )}

                {/* TOOLS */}
                {tab === "tools" && (
                    <Card title="VMware Tools">
                        <Info label="Status" value={vm.tools_status || "—"} />
                        <Info label="Version" value={vm.tools_version || "—"} />
                        <Info label="Version Status" value={vm.tools_version_status || "—"} />
                    </Card>
                )}
            </main>

            {/* Mobile dock */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-950/80 backdrop-blur-xl p-3 z-40">
                <div className="grid grid-cols-5 gap-2">
                    <IconAction
                        label="Start"
                        tone="emerald"
                        disabled={!canStart}
                        loading={acting === "start"}
                        onClick={() => action("start")}
                    >
                        <Power className="w-4 h-4" />
                    </IconAction>

                    <IconAction
                        label="Stop"
                        tone="red"
                        disabled={!canStop}
                        loading={acting === "stop"}
                        onClick={() => action("stop")}
                    >
                        <Power className="w-4 h-4" />
                    </IconAction>

                    <IconAction
                        label="Restart"
                        tone="orange"
                        disabled={!canRestart}
                        loading={acting === "restart"}
                        onClick={() => action("restart")}
                    >
                        <RotateCcw className="w-4 h-4" />
                    </IconAction>

                    <IconAction
                        label="Sync"
                        tone="sky"
                        disabled={!!acting}
                        loading={acting === "sync"}
                        onClick={() => action("sync")}
                    >
                        <RefreshCw className="w-4 h-4" />
                    </IconAction>

                    <IconAction
                        label="Console"
                        tone="zinc"
                        disabled={!!acting || isDeleted}
                        onClick={() => navigate(`/vms/${id}/console`)}
                    >
                        <ExternalLink className="w-4 h-4" />
                    </IconAction>
                </div>
            </div>

            {/* Modal Cancelamento */}
            <VmCancelRequestModal
                open={openCancel}
                vm={vm}
                onClose={() => setOpenCancel(false)}
                onSent={() => {}}
            />
        </div>
    );
}

/* ================= COMPONENTS ================= */

function ActionButton({ icon, label, onClick, disabled, tone, loading, ...rest }) {
    const tones = {
        emerald: "bg-emerald-600 hover:bg-emerald-500 text-white",
        red: "bg-red-600 hover:bg-red-500 text-white",
        orange: "bg-orange-500 hover:bg-orange-400 text-black",
        sky: "bg-sky-600 hover:bg-sky-500 text-white",
        zinc: "bg-slate-900/60 hover:bg-white/5 border border-slate-800 text-slate-200",
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            {...rest}
            className={cls(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition",
                tones[tone] || tones.zinc,
                disabled ? "opacity-50 cursor-not-allowed" : ""
            )}
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
            {label}
        </button>
    );
}

function IconAction({ label, tone, disabled, loading, onClick, children }) {
    const tones = {
        emerald: "bg-emerald-600/25 border-emerald-500/30 text-emerald-100",
        red: "bg-red-600/25 border-red-500/30 text-red-100",
        orange: "bg-orange-500/25 border-orange-500/30 text-orange-100",
        sky: "bg-sky-600/25 border-sky-500/30 text-sky-100",
        zinc: "bg-slate-900/60 border-slate-800 text-slate-200",
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cls(
                "flex flex-col items-center justify-center gap-1 p-2 rounded-xl border text-[10px] font-semibold",
                tones[tone] || tones.zinc,
                disabled ? "opacity-50 cursor-not-allowed" : ""
            )}
            title={label}
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
            {label}
        </button>
    );
}

function TabButton({ icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={cls(
                "px-3 py-2 rounded-xl border flex items-center gap-2 text-sm font-semibold transition",
                active
                    ? "border-sky-500/25 bg-sky-500/10 text-sky-100"
                    : "border-slate-800 bg-slate-950/40 hover:bg-white/5 text-slate-200"
            )}
        >
            {icon}
            {label}
        </button>
    );
}

function Card({ title, children }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 backdrop-blur-xl p-5">
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-4">{title}</div>
            {children}
        </div>
    );
}

function Info({ label, value, icon }) {
    return (
        <div className="flex items-center justify-between gap-3 py-2">
            <div className="flex items-center gap-2 text-sm text-slate-300">
                {icon ? icon : null}
                <span>{label}</span>
            </div>
            <div className="text-sm text-slate-100 font-semibold">{value ?? "—"}</div>
        </div>
    );
}

function HealthItem({ icon, label, ok }) {
    return (
        <div className="flex items-center gap-3 py-2">
            <div
                className={cls(
                    "w-8 h-8 rounded-xl border flex items-center justify-center",
                    ok
                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                        : "border-orange-500/25 bg-orange-500/10 text-orange-200"
                )}
            >
                {icon}
            </div>

            <div className="flex-1">
                <div className="text-sm text-slate-200">{label}</div>
                <div className="text-xs text-slate-500">{ok ? "OK" : "Atenção"}</div>
            </div>
        </div>
    );
}

function EmptyState({ text }) {
    return <div className="py-10 text-center text-sm text-slate-500">{text}</div>;
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
        <div className={cls("px-3 py-1.5 rounded-xl border flex items-center gap-2", tones[tone] || tones.zinc)}>
            <span className="text-[11px] text-slate-400">{label}:</span>
            <span className="font-semibold text-xs truncate max-w-[260px]">{value}</span>
        </div>
    );
}
