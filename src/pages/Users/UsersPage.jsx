import { useEffect, useState } from 'react';
import api from '../../services';

import UsersFilters from './UsersFilters';
import UsersTable from './UsersTable';
import UserCreateModal from './modals/UserCreateModal';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    const [filters, setFilters] = useState({
        search: '',
        status: '',
        role: '',
        limit: 20,
        page: 1,
    });

    async function loadUsers() {
        try {
            setLoading(true);
            const { data } = await api.get('/users/list', { params: filters });
            setUsers(data.data || data);
        } catch (err) {
            console.error('[USERS][LOAD]', err);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadUsers();
    }, [filters]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-semibold">Usuários</h1>
                    <p className="text-sm text-slate-400">
                        Gerenciamento de usuários do sistema
                    </p>
                </div>

                <button
                    onClick={() => setShowCreate(true)}
                    className="bg-sky-600 hover:bg-sky-700 px-4 py-2 rounded text-sm"
                >
                    + Novo Usuário
                </button>
            </div>

            <UsersFilters
                filters={filters}
                onChange={setFilters}
            />

            <UsersTable
                users={users}
                loading={loading}
                onRefresh={loadUsers}
            />

            {showCreate && (
                <UserCreateModal
                    onClose={() => setShowCreate(false)}
                    onSuccess={() => {
                        setShowCreate(false);
                        loadUsers();
                    }}
                />
            )}

        </div>
    );
}
