import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Server,
    RotateCcw,
    Power,
    Play,
    ArrowRightLeft,
} from "lucide-react";
import Swal from "sweetalert2";
import api from "../../services";

function cls(...arr) {
    return arr.filter(Boolean).join(" ");
}

export default function VmList({
                                   vms = [],
                                   onChange,
                                   currentUser,
                                   selected = [],
                                   setSelected,
                               }) {
    const navigate = useNavigate();

    const [loadingSingle, setLoadingSingle] = useState(null); // {id}:{action}
    const [loadingBatch, setLoadingBatch] = useState(null); // action string

    const role = String(currentUser?.role || "").toLowerCase();
    const isOperator = ["root", "admin", "support"].includes(role);

    // ✅ cliente opera, mas sem bulk
    const enableBulk = isOperator;

    const ids = useMemo(() => vms.map((v) => v.id).filter(Boolean), [vms]);

    const allSelected = useMemo(() => {
        if (!enableBulk) return false;
        if (!ids.length) return false;
        return ids.every((id) => selected.includes(id));
    }, [enableBulk, ids, selected]);

    function toggleAll() {
        if (!enableBulk) return;
        if (allSelected) setSelected([]);
        else setSelected(ids);
    }

    function toggleOne(id) {
        if (!enableBulk) return;
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }

    function statusToLabel(st) {
        const s = String(st || "UNKNOWN").toUpperCase();
        if (s === "POWERED_ON") return "ONLINE";
        if (s === "POWERED_OFF") return "OFFLINE";
        if (s === "SUSPENDED") return "SUSPENDED";
        if (s === "DELETED") return "DELETED";
        return "UNKNOWN";
    }

    function statusBadgeClass(st) {
        const s = String(st || "UNKNOWN").toUpperCase();
        if (s === "POWERED_ON") return "border-emerald-500/25 bg-emerald-500/10 text-emerald-100";
        if (s === "POWERED_OFF") return "border-slate-800 bg-slate-950/60 text-slate-200";
        if (s === "SUSPENDED") return "border-orange-500/25 bg-orange-500/10 text-orange-100";
        if (s === "DELETED") return "border-red-500/25 bg-red-500/10 text-red-100";
        return "border-slate-800 bg-slate-950/60 text-slate-200";
    }

    function canStart(vm) {
        const s = String(vm?.status || "UNKNOWN").toUpperCase();
        return s === "POWERED_OFF" || s === "SUSPENDED" || s === "UNKNOWN";
    }

    function canStop(vm) {
        const s = String(vm?.status || "UNKNOWN").toUpperCase();
        return s === "POWERED_ON";
    }

    function canRestart(vm) {
        const s = String(vm?.status || "UNKNOWN").toUpperCase();
        return s === "POWERED_ON" || s === "SUSPENDED";
    }

    async function confirmAction(type, vmName) {
        const label = { start: "Ligar", stop: "Desligar", restart: "Reiniciar" }[type];

        // start é direto
        if (type === "start") return true;

        const result = await Swal.fire({
            title: `${label} VM`,
            text: `Confirma ${label.toLowerCase()} a VM "${vmName}"?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: label,
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#0ea5e9",
        });

        return result.isConfirmed;
    }

    async function actionSingle(vm, type, e) {
        e?.stopPropagation?.();

        if (!vm?.id) return;
        if (loadingBatch) return;

        const allowed =
            (type === "start" && canStart(vm)) ||
            (type === "stop" && canStop(vm)) ||
            (type === "restart" && canRestart(vm));

        if (!allowed) return;

        const ok = await confirmAction(type, vm.name || `VM #${vm.id}`);
        if (!ok) return;

        try {
            setLoadingSingle(`${vm.id}:${type}`);
            await api.post(`/vm/${vm.id}/${type}`);
            onChange?.();
        } catch (err) {
            console.error(err);
            Swal.fire("Erro", `Falha ao executar ${type} na VM`, "error");
        } finally {
            setLoadingSingle(null);
        }
    }

    async function confirmBatch(action) {
        const label = { start: "Ligar", stop: "Desligar", restart: "Reiniciar" }[action];
        const count = selected.length;

        // start em batch pode ser direto, mas eu recomendo confirmar também
        const result = await Swal.fire({
            title: `${label} em massa`,
            text: `Confirma ${label.toLowerCase()} ${count} VM(s)?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: label,
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#0ea5e9",
        });

        return result.isConfirmed;
    }

    async function actionBatch(action) {
        if (!enableBulk) return;
        if (!selected.length) return;
        if (loadingSingle) return;

        const ok = await confirmBatch(action);
        if (!ok) return;

        try {
            setLoadingBatch(action);

            // executa em série pra não matar API
            for (const id of selected) {
                await api.post(`/vm/${id}/${action}`);
            }

            setSelected([]);
            onChange?.();
        } catch (err) {
            console.error(err);
            Swal.fire("Erro", `Falha na ação em massa: ${action}`, "error");
        } finally {
            setLoadingBatch(null);
        }
    }

    return (
        <div className="space-y-3">
            {/* ✅ BULK BAR (só operador) */}
            {enableBulk && (
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleAll}
                            className="w-4 h-4 accent-sky-500"
                        />
                        <div className="text-sm text-slate-200">
                            Selecionadas:{" "}
                            <span className="font-semibold text-sky-300">
                {selected.length}
              </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            disabled={!selected.length || loadingBatch}
                            onClick={() => actionBatch("start")}
                            className="px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Play className="w-4 h-4" />
                            Start
                        </button>

                        <button
                            disabled={!selected.length || loadingBatch}
                            onClick={() => actionBatch("restart")}
                            className="px-3 py-2 text-xs font-semibold rounded-xl bg-orange-500 hover:bg-orange-400 text-black disabled:opacity-50 flex items-center gap-2"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Restart
                        </button>

                        <button
                            disabled={!selected.length || loadingBatch}
                            onClick={() => actionBatch("stop")}
                            className="px-3 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Power className="w-4 h-4" />
                            Shutdown
                        </button>
                    </div>
                </div>
            )}

            {/* ✅ LIST */}
            <div className="space-y-2">
                {vms.map((vm) => {
                    const stLabel = statusToLabel(vm.status);
                    const stClass = statusBadgeClass(vm.status);

                    const startOk = canStart(vm);
                    const stopOk = canStop(vm);
                    const restartOk = canRestart(vm);

                    const keyStart = `${vm.id}:start`;
                    const keyStop = `${vm.id}:stop`;
                    const keyRestart = `${vm.id}:restart`;

                    return (
                        <div
                            key={vm.id}
                            onClick={() => navigate(`/vm/${vm.id}`)}
                            className={cls(
                                "relative rounded-2xl border border-slate-800/70 px-4 py-3 cursor-pointer transition",
                                "bg-gradient-to-b from-slate-950/70 to-slate-950/30 hover:bg-white/5"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                {/* checkbox (só operador) */}
                                {enableBulk && (
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(vm.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={() => toggleOne(vm.id)}
                                        className="w-4 h-4 accent-sky-500"
                                    />
                                )}

                                <div className="flex items-center gap-3 w-[320px] min-w-[320px]">
                                    <Server className="w-5 h-5 text-sky-400" />
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-slate-100 truncate">
                                            {vm.name || `VM #${vm.id}`}
                                        </div>
                                        <div className="text-xs text-slate-500 truncate">
                                            {vm.os || vm.guest_os || "—"} · {vm.cluster_name || "—"}
                                        </div>
                                    </div>
                                </div>

                                <div className="w-[220px] text-sm text-slate-300">
                                    IP:{" "}
                                    <span className="text-slate-200">
                    {vm.ip?.ip_address || vm.ip_address || "Não atribuído"}
                  </span>
                                </div>

                                <div className="w-[140px] text-xs">
                  <span className={cls("px-2 py-1 rounded-full border", stClass)}>
                    {stLabel}
                  </span>
                                </div>

                                {/* ações (cliente e operador) */}
                                <div
                                    className="flex-1 flex justify-end gap-2"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {startOk && (
                                        <button
                                            disabled={loadingSingle === keyStart || loadingBatch}
                                            onClick={(e) => actionSingle(vm, "start", e)}
                                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2"
                                        >
                                            <Play className="w-4 h-4" />
                                            Start
                                        </button>
                                    )}

                                    {restartOk && (
                                        <button
                                            disabled={loadingSingle === keyRestart || loadingBatch}
                                            onClick={(e) => actionSingle(vm, "restart", e)}
                                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-orange-500 hover:bg-orange-400 text-black disabled:opacity-50 flex items-center gap-2"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            Restart
                                        </button>
                                    )}

                                    {stopOk && (
                                        <button
                                            disabled={loadingSingle === keyStop || loadingBatch}
                                            onClick={(e) => actionSingle(vm, "stop", e)}
                                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 flex items-center gap-2"
                                        >
                                            <Power className="w-4 h-4" />
                                            Shutdown
                                        </button>
                                    )}

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/vm/${vm.id}`);
                                        }}
                                        className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-2"
                                    >
                                        <ArrowRightLeft className="w-4 h-4" />
                                        Detalhes
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
