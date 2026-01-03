import {
    Cpu,
    MemoryStick,
    HardDrive,
    Play,
    RotateCcw,
    Server,
    ExternalLink,
    Loader2,
    CheckSquare,
    Square as SquareIcon,
    Power,
    MoreVertical
} from "lucide-react";

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import api from "../../services";
import { VM_UI } from "./vm.ui";

function cls(...arr) {
    return arr.filter(Boolean).join(" ");
}

// Toolbar vCenter vibe
function IconBtn({ title, onClick, disabled, tone = "zinc", loading, children }) {
    const map = {
        zinc: "border-slate-800 bg-slate-950/40 hover:bg-white/5",
        emerald: "border-emerald-500/25 bg-emerald-500/10 hover:bg-emerald-500/15",
        orange: "border-orange-500/25 bg-orange-500/10 hover:bg-orange-500/15",
        red: "border-red-500/25 bg-red-500/10 hover:bg-red-500/15",
        blue: "border-blue-500/25 bg-blue-500/10 hover:bg-blue-500/15",
    };

    return (
        <button
            title={title}
            onClick={onClick}
            disabled={disabled || loading}
            className={cls(
                "p-2 rounded-xl border transition flex items-center justify-center",
                map[tone] || map.zinc,
                (disabled || loading) ? "opacity-60 cursor-not-allowed" : ""
            )}
        >
            {loading ? <Loader2 size={16} className="animate-spin text-slate-200" /> : children}
        </button>
    );
}

// Botões grandes (sempre visíveis) para operação
function ActionBtn({ title, tone, icon, loading, disabled, onClick }) {
    const map = {
        emerald: "bg-emerald-600 hover:bg-emerald-500 text-white",
        orange: "bg-orange-500 hover:bg-orange-400 text-black",
        red: "bg-red-600 hover:bg-red-500 text-white",
        zinc: "bg-slate-800 hover:bg-slate-700 text-white",
    };

    return (
        <button
            title={title}
            onClick={onClick}
            disabled={disabled || loading}
            className={cls(
                "flex items-center justify-center gap-2 py-2 rounded-xl font-semibold text-sm transition",
                map[tone] || map.zinc,
                (disabled || loading) ? "opacity-70 cursor-not-allowed" : ""
            )}
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
            {title}
        </button>
    );
}

export default function VmCard({
                                   vm,
                                   onChange,
                                   currentUser,
                                   selectedIds = [],
                                   onToggleSelect = null,
                               }) {
    const navigate = useNavigate();
    const [loadingAction, setLoadingAction] = useState(null);
    const [hovered, setHovered] = useState(false);
    const [showMore, setShowMore] = useState(false);

    const safeVm = vm || {};

    const isSelected = useMemo(() => {
        if (!onToggleSelect) return false;
        return selectedIds.includes(safeVm.id);
    }, [selectedIds, onToggleSelect, safeVm.id]);

    const status = (safeVm.status || "UNKNOWN").toUpperCase();

    // Regras de operação
    const canStart = status === "POWERED_OFF" || status === "SUSPENDED" || status === "UNKNOWN";
    const canStop = status === "POWERED_ON";
    const canRestart = status === "POWERED_ON" || status === "SUSPENDED";

    const locked = !!loadingAction;

    function openVm() {
        if (locked || !safeVm?.id) return;
        navigate(`/vm/${safeVm.id}`);
    }

    async function action(e, type) {
        e.stopPropagation();
        if (locked || !safeVm?.id) return;

        const labels = {
            start: "Ligar",
            stop: "Desligar",
            restart: "Reiniciar",
        };

        // Start direto, stop/restart confirm
        if (type !== "start") {
            const result = await Swal.fire({
                title: `${labels[type]} VM`,
                text: `Confirma ${labels[type].toLowerCase()} a VM "${safeVm.name}"?`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: labels[type],
                cancelButtonText: "Cancelar",
            });

            if (!result.isConfirmed) return;
        }

        try {
            setLoadingAction(type);
            await api.post(`/vm/${safeVm.id}/${type}`);
            onChange?.();
        } catch (err) {
            console.error(err);
            Swal.fire("Erro", `Falha ao executar ação: ${labels[type]}`, "error");
        } finally {
            setLoadingAction(null);
        }
    }

    function toggleSelect(e) {
        e.stopPropagation();
        if (!onToggleSelect || !safeVm?.id) return;
        onToggleSelect(safeVm.id);
    }

    // Badge por status
    const statusTone = useMemo(() => {
        if (status === "POWERED_ON") return "emerald";
        if (status === "POWERED_OFF") return "slate";
        if (status === "SUSPENDED") return "orange";
        if (status === "DELETED") return "red";
        return "zinc";
    }, [status]);

    const statusBadge = useMemo(() => {
        const map = {
            emerald: "border-emerald-500/25 bg-emerald-500/10 text-emerald-100",
            slate: "border-slate-500/25 bg-slate-500/10 text-slate-200",
            orange: "border-orange-500/25 bg-orange-500/10 text-orange-100",
            red: "border-red-500/25 bg-red-500/10 text-red-100",
            zinc: "border-slate-800 bg-slate-950/60 text-slate-200",
        };
        return map[statusTone] || map.zinc;
    }, [statusTone]);

    const showToolbar = hovered || isSelected;

    return (
        <div
            onClick={openVm}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => {
                setHovered(false);
                setShowMore(false);
            }}
            className={cls(
                "relative rounded-2xl border border-slate-800/70 overflow-hidden transition cursor-pointer",
                VM_UI.cardBg,
                "hover:bg-white/5",
                isSelected ? "ring-2 ring-white/15" : ""
            )}
        >
            {/* Header */}
            <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <Server size={16} className="text-cyan-300/90" />
                            <div className="text-sm font-semibold text-slate-100 truncate">
                                {safeVm.name || `VM #${safeVm.id}`}
                            </div>
                        </div>

                        <div className="text-xs text-slate-500 mt-1 truncate">
                            {safeVm.guest_os || "—"} · {safeVm.cluster_name || "—"}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={cls("text-xs px-2 py-1 rounded-lg border", statusBadge)}>
                            {status === "POWERED_ON"
                                ? "Online"
                                : status === "POWERED_OFF"
                                    ? "Offline"
                                    : status === "SUSPENDED"
                                        ? "Suspended"
                                        : status === "DELETED"
                                            ? "Deleted"
                                            : "Unknown"}
                        </span>
                    </div>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className={cls("flex items-center gap-2 p-2 rounded-xl border border-slate-800/60", VM_UI.innerBoxBg)}>
                        <Cpu size={16} className="text-slate-400" />
                        <div className="text-xs text-slate-300">
                            <div className="text-slate-500">CPU</div>
                            <div>{safeVm.cpu || safeVm.vcpu || "—"} vCPU</div>
                        </div>
                    </div>

                    <div className={cls("flex items-center gap-2 p-2 rounded-xl border border-slate-800/60", VM_UI.innerBoxBg)}>
                        <MemoryStick size={16} className="text-slate-400" />
                        <div className="text-xs text-slate-300">
                            <div className="text-slate-500">Memória</div>
                            <div>{safeVm.ram_mb || safeVm.memory || "—"} MB</div>
                        </div>
                    </div>

                    <div className={cls("flex items-center gap-2 p-2 rounded-xl border border-slate-800/60", VM_UI.innerBoxBg)}>
                        <HardDrive size={16} className="text-slate-400" />
                        <div className="text-xs text-slate-300">
                            <div className="text-slate-500">Disco</div>
                            <div>{safeVm.disk_gb || safeVm.disk || "—"} GB</div>
                        </div>
                    </div>
                </div>

                {/* Footer info */}
                <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-slate-500 truncate">
                        IP: {safeVm.ip_address || "Não atribuído"}
                    </div>

                    <div className="text-xs text-slate-500">
                        {safeVm.last_sync_at ? `${safeVm.last_sync_at}` : ""}
                    </div>
                </div>

                {/* ✅ AÇÕES VISÍVEIS (infra grande) */}
                <div className="mt-4 grid grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
                    {canStart && (
                        <ActionBtn
                            title="Ligar"
                            tone="emerald"
                            icon={<Play className="w-4 h-4" />}
                            loading={loadingAction === "start"}
                            disabled={!canStart}
                            onClick={(e) => action(e, "start")}
                        />
                    )}

                    {canRestart && (
                        <ActionBtn
                            title="Restart"
                            tone="orange"
                            icon={<RotateCcw className="w-4 h-4" />}
                            loading={loadingAction === "restart"}
                            disabled={!canRestart}
                            onClick={(e) => action(e, "restart")}
                        />
                    )}

                    {canStop && (
                        <ActionBtn
                            title="Shutdown"
                            tone="red"
                            icon={<Power className="w-4 h-4" />}
                            loading={loadingAction === "stop"}
                            disabled={!canStop}
                            onClick={(e) => action(e, "stop")}
                        />
                    )}

                    {/* Quando não tem stop e tem start+restart, fecha grid certinho */}
                    {!canStop && canStart && canRestart ? (
                        <div className="hidden" />
                    ) : null}
                </div>
            </div>

            {/* Toolbar (hover/selected) */}
            <div
                className={cls(
                    "absolute top-3 right-3 flex items-center gap-2 transition",
                    showToolbar ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
                )}
            >
                <IconBtn title="Abrir" tone="blue" onClick={(e) => { e.stopPropagation(); openVm(); }}>
                    <ExternalLink size={16} className="text-blue-200" />
                </IconBtn>

                <IconBtn
                    title="Ligar"
                    tone="emerald"
                    disabled={!canStart}
                    loading={loadingAction === "start"}
                    onClick={(e) => action(e, "start")}
                >
                    <Play size={16} className="text-emerald-200" />
                </IconBtn>

                <IconBtn
                    title="Desligar"
                    tone="red"
                    disabled={!canStop}
                    loading={loadingAction === "stop"}
                    onClick={(e) => action(e, "stop")}
                >
                    <Power size={16} className="text-red-200" />
                </IconBtn>

                <IconBtn
                    title="Reiniciar"
                    tone="orange"
                    disabled={!canRestart}
                    loading={loadingAction === "restart"}
                    onClick={(e) => action(e, "restart")}
                >
                    <RotateCcw size={16} className="text-orange-200" />
                </IconBtn>

                {onToggleSelect ? (
                    <IconBtn
                        title={isSelected ? "Desmarcar" : "Selecionar"}
                        tone={isSelected ? "emerald" : "zinc"}
                        onClick={toggleSelect}
                    >
                        {isSelected ? (
                            <CheckSquare size={16} className="text-emerald-200" />
                        ) : (
                            <SquareIcon size={16} className="text-slate-300" />
                        )}
                    </IconBtn>
                ) : null}

                <IconBtn
                    title="Mais ações"
                    tone="zinc"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowMore(!showMore);
                    }}
                >
                    <MoreVertical size={16} className="text-slate-200" />
                </IconBtn>
            </div>

            {/* Mini menu */}
            {showMore ? (
                <div
                    className="absolute top-14 right-3 w-48 rounded-2xl border border-slate-800 bg-slate-950/90 backdrop-blur-md overflow-hidden z-20"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        className="w-full text-left px-3 py-2 text-sm text-slate-100 hover:bg-white/5"
                        onClick={() => navigate(`/vm/${safeVm.id}`)}
                    >
                        Abrir detalhes
                    </button>

                    <button
                        className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-white/5"
                        onClick={() => {
                            Swal.fire("Info", "Console/Remote será plugado aqui.", "info");
                            setShowMore(false);
                        }}
                    >
                        Abrir Console (em breve)
                    </button>
                </div>
            ) : null}
        </div>
    );
}
