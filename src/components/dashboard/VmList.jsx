import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Server,
    RotateCcw,
    Power,
    Play,
    UserPlus,
    ArrowRightLeft,
    PauseCircle
} from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../services';
import useUsersSimple from '../../hooks/useUsersSimple';

export default function VmList({ vms = [], onChange, currentUser, selected = [], setSelected }) {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const { users } = useUsersSimple(false);

    const role = currentUser?.role || 'basic';
    const isOperator = ['root', 'admin', 'support'].includes(role);
    const isRoot = role === 'root';
    const isClient = role === 'client' || role === 'basic';

    const vmsSafe = useMemo(() => (Array.isArray(vms) ? vms.filter(Boolean) : []), [vms]);

    const allSelected = vmsSafe.length > 0 && selected.length === vmsSafe.length;

    function toggleAll() {
        if (!isOperator && !isClient) return;
        setSelected(allSelected ? [] : vmsSafe.map(vm => vm.id));
    }

    function toggleOne(id) {
        if (!isOperator && !isClient) return;
        setSelected(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : [...prev, id]
        );
    }

    /* ===========================
     * HELPERS
     * =========================== */
    async function confirmBatch(title, text, icon = 'warning') {
        const result = await Swal.fire({
            title,
            text,
            icon,
            showCancelButton: true,
            confirmButtonText: 'Confirmar',
            cancelButtonText: 'Cancelar',
        });
        return result.isConfirmed;
    }

    async function batchAction(type) {
        if (selected.length === 0) return;
        if (loading) return;

        const labels = {
            start: 'Iniciar',
            stop: 'Desligar',
            reset: 'Resetar',
            suspend: 'Suspender',
        };

        const ok = await confirmBatch(
            `${labels[type]} (${selected.length} VMs)`,
            `Confirma ${labels[type].toLowerCase()} as VMs selecionadas?`
        );
        if (!ok) return;

        try {
            setLoading(true);
            await api.post(`/vm/batch/${type}`, { vm_ids: selected });
            setSelected([]);
            onChange?.();
        } finally {
            setLoading(false);
        }
    }

    async function assignBatch() {
        if (!isOperator || selected.length === 0) return;

        const { data } = await api.get('/users/simple');

        const { value: user_id } = await Swal.fire({
            title: `Atribuir Dono (${selected.length} VMs)`,
            input: 'select',
            inputOptions: (data || []).reduce((acc, u) => {
                acc[u.id] = `${u.name} (${u.role})`;
                return acc;
            }, {}),
            inputPlaceholder: 'Selecione um usuário',
            showCancelButton: true,
            confirmButtonText: 'Confirmar',
        });

        if (!user_id) return;

        try {
            setLoading(true);
            await api.post('/vm/batch/assign', {
                vm_ids: selected,
                user_id: Number(user_id),
            });
            setSelected([]);
            onChange?.();
        } finally {
            setLoading(false);
        }
    }

    async function migrateBatch() {
        if (!isOperator || selected.length === 0) return;

        const { data } = await api.get('/hosts'); // precisa existir no backend

        const { value: host_id } = await Swal.fire({
            title: `Migrar Host (${selected.length} VMs)`,
            input: 'select',
            inputOptions: (data || []).reduce((acc, h) => {
                acc[h.provider_host_id] = `${h.name} (${h.location})`;
                return acc;
            }, {}),
            inputPlaceholder: 'Selecione um host destino',
            showCancelButton: true,
            confirmButtonText: 'Migrar',
        });

        if (!host_id) return;

        const ok = await confirmBatch(
            'Confirmar migração',
            `Confirma migrar ${selected.length} VMs para ${host_id}?`,
            'question'
        );
        if (!ok) return;

        try {
            setLoading(true);
            await api.post('/vm/batch/migrate', {
                vm_ids: selected,
                host_id: String(host_id),
            });
            setSelected([]);
            onChange?.();
        } finally {
            setLoading(false);
        }
    }

    /* ===========================
     * ACTIONS (INDIVIDUAL)
     * =========================== */
    async function actionSingle(vm, type, e) {
        e.stopPropagation();
        if (loading) return;

        const label = {
            start: 'Iniciar',
            stop: 'Desligar',
            restart: 'Reiniciar',
        }[type];

        const ok = await confirmBatch(
            `${label} VM`,
            `Confirma ${label.toLowerCase()} a VM "${vm.name}"?`
        );
        if (!ok) return;

        try {
            setLoading(true);
            await api.post(`/vm/${vm.id}/${type}`);
            onChange?.();
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-3">

            {/* BATCH BAR */}
            {(isOperator || isClient) && (
                <div className="flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                    />

                    <span className="text-sm text-slate-300">
                        {selected.length > 0
                            ? `${selected.length} VMs selecionadas`
                            : 'Selecionar todas'}
                    </span>

                    {/* CLIENT ACTIONS */}
                    {selected.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 ml-auto">
                            {/* Cliente: start/stop/reset */}
                            <button
                                disabled={loading}
                                onClick={() => batchAction('start')}
                                className="px-3 py-1 text-xs bg-emerald-600 rounded flex items-center gap-1 disabled:opacity-50"
                            >
                                <Play className="w-3 h-3" />
                                Start
                            </button>

                            <button
                                disabled={loading}
                                onClick={() => batchAction('stop')}
                                className="px-3 py-1 text-xs bg-red-600 rounded flex items-center gap-1 disabled:opacity-50"
                            >
                                <Power className="w-3 h-3" />
                                Stop
                            </button>

                            <button
                                disabled={loading}
                                onClick={() => batchAction('reset')}
                                className="px-3 py-1 text-xs bg-amber-600 rounded flex items-center gap-1 disabled:opacity-50"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Reset
                            </button>

                            {/* Operator extras */}
                            {isOperator && (
                                <>
                                    <button
                                        disabled={loading}
                                        onClick={assignBatch}
                                        className="px-3 py-1 text-xs bg-sky-600 rounded flex items-center gap-1 disabled:opacity-50"
                                    >
                                        <UserPlus className="w-3 h-3" />
                                        Atribuir
                                    </button>

                                    <button
                                        disabled={loading}
                                        onClick={() => batchAction('suspend')}
                                        className="px-3 py-1 text-xs bg-orange-600 rounded flex items-center gap-1 disabled:opacity-50"
                                    >
                                        <PauseCircle className="w-3 h-3" />
                                        Suspender
                                    </button>

                                    <button
                                        disabled={loading}
                                        onClick={migrateBatch}
                                        className="px-3 py-1 text-xs bg-purple-600 rounded flex items-center gap-1 disabled:opacity-50"
                                    >
                                        <ArrowRightLeft className="w-3 h-3" />
                                        Migrar Host
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* LIST */}
            {vmsSafe.map(vm => {
                const checked = selected.includes(vm.id);
                return (
                    <div
                        key={vm.id}
                        onClick={() => navigate(`/vm/${vm.id}`)}
                        className={`flex items-center gap-4 px-4 py-3
                                   bg-slate-900 border border-slate-800
                                   rounded-lg hover:bg-slate-800
                                   cursor-pointer
                                   ${checked ? 'ring-2 ring-sky-600/60' : ''}`}
                    >
                        {/* CHECKBOX */}
                        {(isOperator || isClient) && (
                            <input
                                type="checkbox"
                                checked={checked}
                                onClick={e => e.stopPropagation()}
                                onChange={() => toggleOne(vm.id)}
                            />
                        )}

                        {/* VM */}
                        <div className="flex items-center gap-3 w-[300px]">
                            <Server className="w-5 h-5 text-sky-400" />
                            <div>
                                <div className="font-medium">{vm.name || '—'}</div>
                                <div className="text-xs text-slate-400">{vm.os || '—'}</div>
                            </div>
                        </div>

                        {/* IP */}
                        <div className="w-[180px] text-sm text-slate-300">
                            IP: {vm.ip?.ip_address || 'Não atribuído'}
                        </div>

                        {/* STATUS */}
                        <div className="w-[120px] text-xs">
                            <span className={`px-2 py-1 rounded-full ${
                                vm.status === 'POWERED_ON'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-slate-500/10 text-slate-400'
                            }`}>
                                {vm.status || 'UNKNOWN'}
                            </span>
                        </div>

                        {/* RECURSOS */}
                        <div className="flex-1 text-xs text-slate-400">
                            {(vm.cpu ?? 0)} vCPU · {(vm.memory_mb ?? 0)} MB · {(vm.disk_gb ?? 0)} GB
                        </div>

                        {/* AÇÕES INDIVIDUAIS (cliente também) */}
                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                            {vm.status === 'POWERED_ON' ? (
                                <>
                                    <button
                                        disabled={loading}
                                        onClick={e => actionSingle(vm, 'restart', e)}
                                        className="px-3 py-1 text-xs bg-amber-600 rounded disabled:opacity-50"
                                    >
                                        <RotateCcw className="w-3 h-3 inline" /> Reset
                                    </button>
                                    <button
                                        disabled={loading}
                                        onClick={e => actionSingle(vm, 'stop', e)}
                                        className="px-3 py-1 text-xs bg-red-600 rounded disabled:opacity-50"
                                    >
                                        <Power className="w-3 h-3 inline" /> Stop
                                    </button>
                                </>
                            ) : (
                                <button
                                    disabled={loading}
                                    onClick={e => actionSingle(vm, 'start', e)}
                                    className="px-3 py-1 text-xs bg-emerald-600 rounded disabled:opacity-50"
                                >
                                    <Play className="w-3 h-3 inline" /> Start
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
