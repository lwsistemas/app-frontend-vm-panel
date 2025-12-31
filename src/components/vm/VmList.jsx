import { useState } from 'react';
import {
    Play,
    Square,
    RotateCcw,
    Monitor,
    Loader2,
} from 'lucide-react';

import { useVmLive } from '../../context/VmLiveContext';
import api from '../../services';

export default function VmList() {
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
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                    <th className="px-4 py-3 text-left">VM</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">IP</th>
                    <th className="px-4 py-3 text-left">CPU</th>
                    <th className="px-4 py-3 text-left">RAM</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                {vms.map(vm => {
                    const busy = actionLoading[vm.id];

                    return (
                        <tr
                            key={vm.id}
                            className="hover:bg-slate-900 transition"
                        >
                            <td className="px-4 py-3">
                                <div className="font-medium">
                                    {vm.name}
                                </div>
                                <div className="text-xs text-slate-500">
                                    {vm.hostname || '—'}
                                </div>
                            </td>

                            <td className="px-4 py-3">
                                {statusBadge(vm.status)}
                            </td>

                            <td className="px-4 py-3 text-slate-300">
                                {vm.ip_address || '—'}
                            </td>

                            <td className="px-4 py-3">
                                {vm.cpu || '—'}
                            </td>

                            <td className="px-4 py-3">
                                {vm.memory_mb
                                    ? `${vm.memory_mb} MB`
                                    : '—'}
                            </td>

                            <td className="px-4 py-3">
                                <div className="flex justify-end gap-2">
                                    <ActionButton
                                        icon={<Play size={14} />}
                                        disabled={busy || vm.status === 'POWERED_ON'}
                                        onClick={() =>
                                            handleAction(vm, 'start')
                                        }
                                    />

                                    <ActionButton
                                        icon={<Square size={14} />}
                                        disabled={busy || vm.status !== 'POWERED_ON'}
                                        onClick={() =>
                                            handleAction(vm, 'stop')
                                        }
                                    />

                                    <ActionButton
                                        icon={<RotateCcw size={14} />}
                                        disabled={busy}
                                        onClick={() =>
                                            handleAction(vm, 'reboot')
                                        }
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
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}

/* =========================
 * BOTÃO DE AÇÃO
 * ========================= */
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
