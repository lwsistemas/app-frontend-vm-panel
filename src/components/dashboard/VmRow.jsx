import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import {
    ExternalLink,
    Play,
    Power,
    RotateCcw,
    Loader2,
    MoreVertical
} from "lucide-react";

import api from "../../services";

function cls(...arr) {
    return arr.filter(Boolean).join(" ");
}

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

export default function VmRow({ vm, onChange }) {
    const navigate = useNavigate();
    const [hovered, setHovered] = useState(false);
    const [loadingAction, setLoadingAction] = useState(null);
    const [showMore, setShowMore] = useState(false);

    const safeVm = vm || {};
    const status = (safeVm.status || "UNKNOWN").toUpperCase();

    const canStart = status === "POWERED_OFF";
    const canStop = status === "POWERED_ON";
    const canRestart = status === "POWERED_ON" || status === "SUSPENDED";

    const statusBadge = useMemo(() => {
        if (status === "POWERED_ON") return "border-emerald-500/25 bg-emerald-500/10 text-emerald-100";
        if (status === "POWERED_OFF") return "border-slate-800 bg-slate-950/60 text-slate-200";
        if (status === "SUSPENDED") return "border-orange-500/25 bg-orange-500/10 text-orange-100";
        if (status === "DELETED") return "border-red-500/25 bg-red-500/10 text-red-100";
        return "border-slate-800 bg-slate-950/60 text-slate-200";
    }, [status]);

    async function action(e, type) {
        e.stopPropagation();
        if (!safeVm?.id) return;

        const labels = { start: "Ligar", stop: "Desligar", restart: "Reiniciar" };

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

    return (
        <div
            className={cls(
                "relative rounded-2xl border border-slate-800/70 p-3 transition cursor-pointer",
                "bg-gradient-to-b from-slate-950/70 to-slate-950/30 hover:bg-white/5"
            )}
            onClick={() => navigate(`/vm/${safeVm.id}`)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => {
                setHovered(false);
                setShowMore(false);
            }}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-100 truncate">
                        {safeVm.name || `VM #${safeVm.id}`}
                    </div>
                    <div className="text-xs text-slate-500 truncate mt-1">
                        {safeVm.guest_os || "—"} · {safeVm.cluster_name || "—"}
                    </div>
                </div>

                <div className="flex items-center gap-2">
          <span className={cls("text-xs px-2 py-1 rounded-lg border", statusBadge)}>
            {status === "POWERED_ON" ? "Online" :
                status === "POWERED_OFF" ? "Offline" :
                    status === "SUSPENDED" ? "Suspended" :
                        status === "DELETED" ? "Deleted" : "Unknown"}
          </span>

                    {/* toolbar no hover */}
                    <div
                        className={cls(
                            "flex items-center gap-2 transition",
                            hovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
                        )}
                    >
                        <IconBtn title="Abrir" tone="blue" onClick={(e) => { e.stopPropagation(); navigate(`/vm/${safeVm.id}`); }}>
                            <ExternalLink size={16} className="text-blue-200" />
                        </IconBtn>

                        <IconBtn title="Ligar" tone="emerald" disabled={!canStart} loading={loadingAction === "start"} onClick={(e) => action(e, "start")}>
                            <Play size={16} className="text-emerald-200" />
                        </IconBtn>

                        <IconBtn title="Desligar" tone="red" disabled={!canStop} loading={loadingAction === "stop"} onClick={(e) => action(e, "stop")}>
                            <Power size={16} className="text-red-200" />
                        </IconBtn>

                        <IconBtn title="Reiniciar" tone="orange" disabled={!canRestart} loading={loadingAction === "restart"} onClick={(e) => action(e, "restart")}>
                            <RotateCcw size={16} className="text-orange-200" />
                        </IconBtn>

                        <IconBtn title="Mais" tone="zinc" onClick={(e) => { e.stopPropagation(); setShowMore(!showMore); }}>
                            <MoreVertical size={16} className="text-slate-200" />
                        </IconBtn>
                    </div>
                </div>
            </div>

            {showMore ? (
                <div
                    className="absolute top-12 right-3 w-48 rounded-2xl border border-slate-800 bg-slate-950/90 backdrop-blur-md overflow-hidden z-20"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-white/5"
                        onClick={() => navigate(`/vm/${safeVm.id}`)}
                    >
                        Abrir detalhes
                    </button>

                    <button
                        className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-white/5"
                        onClick={() => Swal.fire("Info", "Console/Remote será plugado aqui.", "info")}
                    >
                        Abrir Console (em breve)
                    </button>
                </div>
            ) : null}
        </div>
    );
}
