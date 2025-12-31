import { Search } from 'lucide-react';

export default function UsersFilters({ filters, onChange }) {

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

                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, login ou e-mail"
                        value={filters.search}
                        onChange={e => update('search', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded"
                    />
                </div>

                <select
                    value={filters.status}
                    onChange={e => update('status', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded"
                >
                    <option value="">Todos os status</option>
                    <option value="active">Ativo</option>
                    <option value="blocked">Bloqueado</option>
                </select>

                <select
                    value={filters.role}
                    onChange={e => update('role', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded"
                >
                    <option value="">Todas as roles</option>
                    <option value="root">Root</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                </select>

                <select
                    value={filters.limit}
                    onChange={e => update('limit', Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded"
                >
                    <option value={10}>10 por página</option>
                    <option value={20}>20 por página</option>
                    <option value={50}>50 por página</option>
                </select>
            </div>
        </div>
    );
}
