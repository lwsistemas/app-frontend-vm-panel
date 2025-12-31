import { useEffect, useState } from 'react';
import api from '../../services';

export default function VmFilters({ filters, onChange, mode }) {

    const [users, setUsers] = useState([]);



    useEffect(() => {
        if (mode === 'admin') {
            api.get('/users/simple').then(res => setUsers(res.data));
        }
    }, [mode]);

    function update(field, value) {
        onChange(prev => ({
            ...prev,
            [field]: value,
            page: 1,
        }));
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* SEARCH (CLIENT + ADMIN) */}
                <input
                    placeholder="Buscar por nome ou IP"
                    value={filters.search}
                    onChange={e => update('search', e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                />

                {/* STATUS */}
                <select
                    value={filters.status}
                    onChange={e => update('status', e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                >
                    <option value="">Status</option>
                    <option value="POWERED_ON">ONLINE</option>
                    <option value="POWERED_OFF">OFFLINE</option>
                    <option value="RESTARTING">RESTARTING</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                </select>

                {/* SO */}
                <select
                    value={filters.os}
                    onChange={e => update('os', e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                >
                    <option value="">Sistema</option>
                    <option value="windows">Windows</option>
                    <option value="linux">Linux</option>
                </select>

                {/* CPU MIN */}
                <input
                    type="number"
                    placeholder="CPU ≥"
                    value={filters.min_cpu}
                    onChange={e => update('min_cpu', e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                />

                {/* RAM MIN */}
                <input
                    type="number"
                    placeholder="RAM ≥ (MB)"
                    value={filters.min_memory}
                    onChange={e => update('min_memory', e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                />

                {/* ADMIN ONLY */}
                {mode === 'admin' && (
                    <>
                        <select
                            value={filters.user_id || ''}
                            onChange={e => update('user_id', e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                        >
                            <option value="">Todos os usuários</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.name} ({u.role})
                                </option>
                            ))}
                        </select>

                        <input
                            placeholder="Cluster"
                            value={filters.cluster}
                            onChange={e => update('cluster', e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                        />

                        <input
                            placeholder="Host ESXi"
                            value={filters.provider_host}
                            onChange={e => update('provider_host', e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                        />

                        <select
                            value={filters.vmware_tools}
                            onChange={e => update('vmware_tools', e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                        >
                            <option value="">VMware Tools</option>
                            <option value="ok">OK</option>
                            <option value="old">Desatualizado</option>
                            <option value="missing">Ausente</option>
                        </select>

                        <select
                            value={filters.snapshot}
                            onChange={e => update('snapshot', e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                        >
                            <option value="">Snapshot</option>
                            <option value="1">Com snapshot</option>
                            <option value="0">Sem snapshot</option>
                        </select>
                    </>
                )}
            </div>
        </div>
    );
}
