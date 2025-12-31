import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, RotateCcw, Power, Play, Network } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../services';

export default function VmRow({ vm, selected, toggle, onChange }) {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function confirmAction(type, e) {
        e.stopPropagation();
        if (loading) return;

        const label = {
            start: 'Iniciar',
            stop: 'Desligar',
            restart: 'Reiniciar',
        }[type];

        const result = await Swal.fire({
            title: `${label} VM`,
            text: `Confirma ${label.toLowerCase()} a VM "${vm.name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: label,
            cancelButtonText: 'Cancelar',
        });

        if (!result.isConfirmed) return;

        try {
            setLoading(true);
            await api.post(`/vm/${vm.id}/${type}`);
            onChange?.();
        } finally {
            setLoading(false);
        }
    }

    async function assignIp(e) {
        e.stopPropagation();

        const { value: ip_id } = await Swal.fire({
            title: 'Atribuir IP',
            input: 'text',
            inputLabel: 'ID do IP',
            showCancelButton: true,
        });

        if (!ip_id) return;

        await api.post(`/vm/${vm.id}/assign-ip`, { ip_id });
        onChange?.();
    }

    return (
        <div
            onClick={() => navigate(`/vm/${vm.id}`)}
            className="flex items-center gap-4 px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 cursor-pointer"
        >
            <input
                type="checkbox"
                checked={selected.includes(vm.id)}
                onClick={e => e.stopPropagation()}
                onChange={() => toggle(vm.id)}
            />

            <div className="flex items-center gap-3 w-[300px]">
                <Server className="w-5 h-5 text-sky-400" />
                <div>
                    <div className="font-medium">{vm.name}</div>
                    <div className="text-xs text-slate-400">{vm.os || '—'}</div>
                </div>
            </div>

            <div className="w-[180px] text-sm text-slate-300">
                IP: {vm.ip?.ip_address || 'Não atribuído'}
            </div>

            <div className="w-[120px] text-xs">
                <span className={`px-2 py-1 rounded-full ${
                    vm.status === 'POWERED_ON'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-slate-500/10 text-slate-400'
                }`}>
                    {vm.status}
                </span>
            </div>

            <div className="flex-1 text-xs text-slate-400">
                {vm.cpu} vCPU · {vm.memory_mb} MB · {vm.disk_gb} GB
            </div>

            <div className="flex gap-2">
                <button
                    onClick={assignIp}
                    className="px-3 py-1 text-xs bg-sky-600 rounded flex items-center gap-1"
                >
                    <Network className="w-3 h-3" /> IP
                </button>

                {vm.status === 'POWERED_ON' ? (
                    <>
                        <button
                            onClick={e => confirmAction('restart', e)}
                            className="px-3 py-1 text-xs bg-amber-600 rounded"
                        >
                            <RotateCcw className="w-3 h-3 inline" /> Restart
                        </button>
                        <button
                            onClick={e => confirmAction('stop', e)}
                            className="px-3 py-1 text-xs bg-red-600 rounded"
                        >
                            <Power className="w-3 h-3 inline" /> Shutdown
                        </button>
                    </>
                ) : (
                    <button
                        onClick={e => confirmAction('start', e)}
                        className="px-3 py-1 text-xs bg-emerald-600 rounded"
                    >
                        <Play className="w-3 h-3 inline" /> Start
                    </button>
                )}
            </div>
        </div>
    );
}
