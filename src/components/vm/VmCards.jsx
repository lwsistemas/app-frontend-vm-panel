import { useState } from 'react';
import {
    Play,
    Square,
    RotateCcw,
    Monitor,
    Cpu,
    MemoryStick,
    HardDrive,
    Loader2,
} from 'lucide-react';

import { useVmLive } from '../../context/VmLiveContext';
import api from '../../services';

export default function VmCards() {
    const { vms, loading, refresh } = useVmLive();
    const [actionLoading, setActionLoading] = useState({});

    async function handleAction(vm, action) {
        if (actionLoading[vm.id]) return;

        setActionLoading(prev => ({ ...prev, [vm.id]: true }));

        try {
            await api.post(`/vms/${vm.id}/${action}`);
        } catch (err) {
            console.error(`[VM][${action}]`, err);
        } finally {
            setTimeout(() => {
                refresh();
                setActionLoading(prev => ({ ...prev, [vm.id]: false }));
            }, 1500);
        }
    }

    function statusBadge(status) {
        const map = {
            POWERED_ON: 'bg-emerald-600/20 text-emerald-400',
            POWERED_OFF: 'bg-slate-600/20 text-slate-300',
            SUSPENDED: 'bg-yellow-600/20 text-yellow-400',
            RESTARTING: 'bg-blue-600/20 text-blue-400',
            UNKNOWN: 'bg-red-600/20 text-red-400',
            CRASHED: 'bg-red-700/30 text-red-400',
        };

        return (
            <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                    map[status] || map.UNKNOWN
                }`}
            >
                {status}
            </span>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando VMs...
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {vms.map(vm => {
                const busy = actionLoading[vm.id];

                return (
                    <div
                        key={vm.id}
                        className="bg-slate-900 border border-slate-800
                                   rounded-xl p-4 flex flex-col gap-4
                                   hover:border-slate-700 transition"
                    >
                        {/* HEADER */}
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-semibold text-slate-100">
                                    {vm.name}
                                </div>
                                <div className="text-xs text-slate-500">
                                    {vm.hostname || '—'}
                                </div>
                            </div>

                            {statusBadge(vm.status)}
                        </div>

                        {/* SPECS */}
                        <div className="grid grid-cols-3 gap-3 text-xs text-slate-400">
                            <Spec icon={<Cpu size={14} />} value={vm.cpu || '—'} />
                            <Spec
                                icon={<MemoryStick size={14} />}
                                value={
                                    vm.memory_mb
                                        ? `${vm.memory_mb} MB`
                                        : '—'
                                }
                            />
                            <Spec
                                icon={<HardDrive size={14} />}
                                value={
                                    vm.disk_gb
                                        ? `${vm.disk_gb} GB`
                                        : '—'
                                }
                            />
                        </div>

                        {/* IP */}
                        <div className="text-xs text-slate-300">
                            IP: {vm.ip_address || '—'}
                        </div>

                        {/* ACTIONS */}
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                            <ActionButton
                                icon={<Play size={14} />}
                                disabled={busy || vm.status === 'POWERED_ON'}
                                onClick={() => handleAction(vm, 'start')}
                            />

                            <ActionButton
                                icon={<Square size={14} />}
                                disabled={busy || vm.status !== 'POWERED_ON'}
                                onClick={() => handleAction(vm, 'stop')}
                            />

                            <ActionButton
                                icon={<RotateCcw size={14} />}
                                disabled={busy}
                                onClick={() => handleAction(vm, 'reboot')}
                            />

                            <ActionButton
                                icon={<Monitor size={14} />}
                                onClick={() =>
                                    window.open(
                                        `/vm/${vm.id}/console`,
                                        '_blank'
                                    )
                                }
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* =========================
 * COMPONENTES AUXILIARES
 * ========================= */

function Spec({ icon, value }) {
    return (
        <div className="flex items-center gap-2">
            <span className="opacity-70">{icon}</span>
            <span>{value}</span>
        </div>
    );
}

function ActionButton({ icon, onClick, disabled }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`p-2 rounded-md transition
                ${
                disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-slate-800'
            }`}
        >
            {icon}
        </button>
    );
}
