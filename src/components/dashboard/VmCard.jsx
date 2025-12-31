import {
    Cpu,
    MemoryStick,
    HardDrive,
    Play,
    Square,
    RotateCcw,
    Server,
    Monitor,
    Loader2,
    UserPlus,
    CheckSquare,
    Square as SquareIcon
} from 'lucide-react';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';

import api from '../../services';
import useUsersSimple from '../../hooks/useUsersSimple';

export default function VmCard({
                                   vm,
                                   onChange,
                                   currentUser,

                                   // ✅ batch selection (opcional)
                                   selectedIds = [],
                                   onToggleSelect = null,
                               }) {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [showAssign, setShowAssign] = useState(false);
    const [selectedUser, setSelectedUser] = useState('');

    const { users, loading: loadingUsers } = useUsersSimple(showAssign);

    const statusMap = {
        POWERED_ON: { label: 'ONLINE', color: 'text-emerald-400', dot: 'bg-emerald-400' },
        POWERED_OFF: { label: 'OFFLINE', color: 'text-slate-400', dot: 'bg-slate-400' },
        RESTARTING: { label: 'PROCESSANDO', color: 'text-yellow-400', dot: 'bg-yellow-400' },
        SUSPENDED: { label: 'SUSPENDED', color: 'text-orange-400', dot: 'bg-orange-400' },
        UNKNOWN: { label: 'UNKNOWN', color: 'text-slate-500', dot: 'bg-slate-500' }
    };

    const safeVm = vm || {};
    const status = statusMap[safeVm.status] || statusMap.UNKNOWN;
    const locked = safeVm.status === 'RESTARTING' || loading;

    const canAssign =
        currentUser?.role === 'root' ||
        currentUser?.role === 'admin' ||
        currentUser?.role === 'support';

    // ✅ seleção só pra operador
    const canSelect = canAssign && typeof onToggleSelect === 'function';
    const isSelected = Array.isArray(selectedIds) && selectedIds.includes(safeVm.id);

    function openDetails() {
        if (!safeVm?.id) return;
        navigate(`/vm/${safeVm.id}`);
    }

    async function action(e, type) {
        e.stopPropagation();
        if (locked || !safeVm?.id) return;

        const labels = {
            start: 'Ligar',
            stop: 'Desligar',
            restart: 'Reiniciar'
        };

        const result = await Swal.fire({
            title: `${labels[type]} VM`,
            text: `Confirma ${labels[type].toLowerCase()} a VM "${safeVm.name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: labels[type],
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#0ea5e9',
        });

        if (!result.isConfirmed) return;

        try {
            setLoading(true);
            await api.post(`/vm/${safeVm.id}/${type}`);
            onChange?.();
        } finally {
            setLoading(false);
        }
    }

    async function assignVm() {
        if (!selectedUser || !safeVm?.id) return;

        const result = await Swal.fire({
            title: 'Atribuir VM',
            text: 'Confirma a mudança de dono desta VM?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Confirmar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#0ea5e9',
        });

        if (!result.isConfirmed) return;

        await api.post(`/vm/${safeVm.id}/assign`, { user_id: selectedUser });
        setShowAssign(false);
        setSelectedUser('');
        onChange?.();
    }

    return (
        <>
            <div
                onClick={openDetails}
                className={`relative cursor-pointer rounded-xl
                bg-gradient-to-b from-slate-900 to-slate-950
                border p-5 transition
                ${isSelected ? 'border-sky-600 shadow-lg shadow-sky-600/10' : 'border-slate-800 hover:border-sky-600 hover:shadow-lg hover:shadow-sky-600/10'}`}
            >
                {/* ✅ CHECKBOX (operador) */}
                {canSelect && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleSelect?.(safeVm.id);
                        }}
                        className="absolute left-3 top-3 w-7 h-7 flex items-center justify-center rounded-lg
                                   bg-slate-900/70 border border-slate-700 hover:border-sky-500 transition"
                        title="Selecionar"
                    >
                        {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-sky-400" />
                        ) : (
                            <SquareIcon className="w-4 h-4 text-slate-400" />
                        )}
                    </button>
                )}

                {/* HEADER */}
                <div className="flex justify-between mb-4 pl-6">
                    <div>
                        <h3 className="text-lg font-semibold flex gap-2">
                            <Server className="w-5 h-5 text-sky-400" />
                            {safeVm.name || '—'}
                        </h3>

                        <p className="text-xs text-slate-400 flex gap-2 mt-1">
                            <Monitor className="w-4 h-4" />
                            {safeVm.os || 'Sistema desconhecido'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                        <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                        <span className={status.color}>{status.label}</span>
                    </div>
                </div>

                {/* INFO */}
                <div className="space-y-2 text-xs text-slate-300">
                    <InfoRow icon={<Cpu />} label="CPU" value={`${safeVm.cpu || 0} vCPU`} />
                    <InfoRow icon={<MemoryStick />} label="Memória" value={`${safeVm.memory_mb || 0} MB`} />
                    <InfoRow icon={<HardDrive />} label="Disco" value={`${safeVm.disk_gb || 0} GB`} />

                    <div className="text-xs text-slate-500">
                        IP: {safeVm.ip?.ip_address || 'Não atribuído'}
                    </div>
                </div>

                {/* ACTIONS */}
                <div className="mt-5 grid grid-cols-2 gap-3" onClick={e => e.stopPropagation()}>
                    {safeVm.status === 'POWERED_ON' && (
                        <>
                            <ActionButton
                                onClick={e => action(e, 'restart')}
                                loading={loading}
                                icon={<RotateCcw />}
                                label="Restart"
                                color="yellow"
                            />
                            <ActionButton
                                onClick={e => action(e, 'stop')}
                                loading={loading}
                                icon={<Square />}
                                label="Shutdown"
                                color="red"
                            />
                        </>
                    )}

                    {(safeVm.status === 'POWERED_OFF' || safeVm.status === 'SUSPENDED' || safeVm.status === 'UNKNOWN') && (
                        <ActionButton
                            onClick={e => action(e, 'start')}
                            loading={loading}
                            icon={<Play />}
                            label="Ligar"
                            color="green"
                            full
                        />
                    )}
                </div>

                {/* ASSIGN */}
                {canAssign && (
                    <div
                        onClick={e => {
                            e.stopPropagation();
                            setShowAssign(true);
                        }}
                        className="mt-4 text-xs text-sky-400 hover:underline flex items-center gap-1"
                    >
                        <UserPlus className="w-3 h-3" />
                        Atribuir VM
                    </div>
                )}
            </div>

            {/* MODAL ASSIGN */}
            {showAssign &&
                createPortal(
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-80 shadow-xl">
                            <h3 className="text-sm font-semibold mb-4">Atribuir VM</h3>

                            <select
                                value={selectedUser}
                                onChange={e => setSelectedUser(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm"
                                disabled={loadingUsers}
                            >
                                <option value="">
                                    {loadingUsers ? 'Carregando usuários...' : 'Selecione um usuário'}
                                </option>

                                {users.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} ({u.role})
                                    </option>
                                ))}
                            </select>

                            <div className="flex justify-end gap-2 mt-5">
                                <button
                                    onClick={() => setShowAssign(false)}
                                    className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-xl"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={assignVm}
                                    className="px-4 py-2 text-sm bg-sky-600 hover:bg-sky-500 rounded-xl font-semibold"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}

function ActionButton({ onClick, loading, icon, label, color, full }) {
    const colors = {
        green: 'bg-emerald-600 hover:bg-emerald-700',
        red: 'bg-red-600 hover:bg-red-700',
        yellow: 'bg-amber-500 hover:bg-amber-400 text-black'
    };

    return (
        <button
            onClick={onClick}
            className={`flex items-center justify-center gap-2 py-2 text-sm rounded-xl font-semibold transition
            ${colors[color]} ${full ? 'col-span-2' : ''}`}
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
            {label}
        </button>
    );
}

function InfoRow({ icon, label, value }) {
    return (
        <div className="flex justify-between">
            <span className="flex gap-2 text-slate-400 items-center">
                <span className="w-4 h-4">{icon}</span>
                {label}
            </span>
            <span>{value}</span>
        </div>
    );
}
