// src/components/vm/VmCard.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Power,
    Square,
    RotateCw,
    ExternalLink,
    Cpu,
    MemoryStick,
    HardDrive,
} from "lucide-react";

import api from "../../services";
import { useVmLive } from "../../context/VmLiveContext";

function statusUi(status) {
    const s = String(status || "").toUpperCase();

    if (s === "POWERED_ON") {
        return {
            label: "ON",
            cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
        };
    }
    if (s === "POWERED_OFF") {
        return {
            label: "OFF",
            cls: "bg-slate-500/10 border-slate-500/20 text-slate-300",
        };
    }
    if (s === "TEMPLATE") {
        return {
            label: "TEMPLATE",
            cls: "bg-indigo-500/10 border-indigo-500/20 text-indigo-300",
        };
    }
    if (s === "CRASHED" || s === "MISSING") {
        return {
            label: "CRASHED",
            cls: "bg-red-500/10 border-red-500/20 text-red-300",
        };
    }

    return {
        label: s || "UNKNOWN",
        cls: "bg-yellow-500/10 border-yellow-500/20 text-yellow-200",
    };
}

function fmtMbToGb(mb) {
    if (!mb) return "-";
    const gb = Number(mb) / 1024;
    if (Number.isNaN(gb)) return "-";
    return `${gb.toFixed(gb >= 10 ? 0 : 1)} GB`;
}

export default function VmCard({ vm }) {
    const navigate = useNavigate();
    const { setVms, refresh } = useVmLive();

    const [busy, setBusy] = useState(false);
    const [busyAction, setBusyAction] = useState(null);

    const ui = useMemo(() => statusUi(vm?.status), [vm?.status]);

    const title = vm?.hostname || vm?.name || `VM #${vm?.id}`;
    const subtitle = vm?.ip_address ? `IP: ${vm.ip_address}` : (vm?.provider_vm_id ? `VC: ${vm.provider_vm_id}` : "—");

    const cpu = vm?.cpu ?? vm?.cpu_count ?? null;
    const ram = vm?.memory_mb ?? null;
    const disk = vm?.disk_gb ?? null;

    const canStart = String(vm?.status).toUpperCase() !== "POWERED_ON";
    const canStop = String(vm?.status).toUpperCase() === "POWERED_ON";
    const canReboot = String(vm?.status).toUpperCase() === "POWERED_ON";

    function optimisticStatus(nextStatus) {
        setVms(prev =>
            (prev || []).map(x => (x.id === vm.id ? { ...x, status: nextStatus } : x))
        );
    }

    async function doAction(action) {
        if (busy) return; // ✅ trava duplo click

        setBusy(true);
        setBusyAction(action);

        try {
            // otimista imediato
            if (action === "start") optimisticStatus("RESTARTING");
            if (action === "stop") optimisticStatus("POWERED_OFF");
            if (action === "reboot") optimisticStatus("RESTARTING");

            // chama backend
            await api.post(`/vms/${vm.id}/${action}`);

            // refresh após 1.5s (backend aplica no vCenter)
            setTimeout(() => {
                refresh();
            }, 1500);
        } catch (e) {
            console.log(`[VM][${action}][FAIL]`, e?.message || e);
            // volta status via refresh
            refresh();
        } finally {
            setBusy(false);
            setBusyAction(null);
        }
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition">
            {/* TOP */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-100 truncate">
                        {title}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 truncate">
                        {subtitle}
                    </div>
                </div>

                <div className={`text-[11px] px-2 py-1 rounded-full border ${ui.cls}`}>
                    {ui.label}
                </div>
            </div>

            {/* SPECS */}
            <div className="mt-4 grid grid-cols-3 gap-3">
                <Spec icon={<Cpu size={14} />} label="CPU" value={cpu ? `${cpu}` : "-"} />
                <Spec icon={<MemoryStick size={14} />} label="RAM" value={fmtMbToGb(ram)} />
                <Spec icon={<HardDrive size={14} />} label="Disk" value={disk ? `${disk} GB` : "-"} />
            </div>

            {/* ACTIONS */}
            <div className="mt-4 flex gap-2">
                <ActionButton
                    disabled={busy || !canStart}
                    onClick={() => doAction("start")}
                    icon={<Power size={16} />}
                    label={busy && busyAction === "start" ? "Iniciando..." : "Start"}
                />

                <ActionButton
                    disabled={busy || !canStop}
                    onClick={() => doAction("stop")}
                    icon={<Square size={16} />}
                    label={busy && busyAction === "stop" ? "Parando..." : "Stop"}
                />

                <ActionButton
                    disabled={busy || !canReboot}
                    onClick={() => doAction("reboot")}
                    icon={<RotateCw size={16} />}
                    label={busy && busyAction === "reboot" ? "Reiniciando..." : "Reboot"}
                />
            </div>

            {/* FOOTER */}
            <div className="mt-4 flex items-center justify-between">
                <div className="text-[11px] text-slate-500">
                    ID #{vm?.id}
                    {vm?.owner_id ? <span className="ml-2">• Owner {vm.owner_id}</span> : null}
                </div>

                <button
                    onClick={() => navigate(`/vm/${vm.id}`)}
                    className="text-xs inline-flex items-center gap-1 text-sky-300 hover:text-sky-200"
                >
                    Detalhes <ExternalLink size={14} />
                </button>
            </div>
        </div>
    );
}

function Spec({ icon, label, value }) {
    return (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
                {icon}
                <span>{label}</span>
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-100">
                {value}
            </div>
        </div>
    );
}

function ActionButton({ disabled, onClick, icon, label }) {
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className={`flex-1 h-9 rounded-xl border border-slate-800
                inline-flex items-center justify-center gap-2 text-xs font-semibold
                ${disabled
                ? "opacity-50 cursor-not-allowed bg-slate-950"
                : "bg-slate-950 hover:bg-slate-800 transition"
            }`}
        >
            {icon}
            {label}
        </button>
    );
}
