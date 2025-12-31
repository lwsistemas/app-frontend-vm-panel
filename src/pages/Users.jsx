import { useEffect, useState } from 'react';
import {
    User,
    Shield,
    Trash2,
    Lock,
    Unlock,
    RefreshCcw,
    Plus,
} from 'lucide-react';

import api from '../services';
import Header from '../components/Header';

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('user'));



    async function loadUsers() {
        try {
            setLoading(true);
            const { data } = await api.get('/users/simple');
            setUsers(data);
        } catch {
            alert('Erro ao carregar usuários');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadUsers();
    }, []);

    async function action(id, type) {
        if (!window.confirm('Confirmar ação?')) return;

        try {
            await api.post(`/users/${id}/${type}`);
            loadUsers();
        } catch (err) {
            alert(err.response?.data?.error || 'Erro ao executar ação');
        }
    }

    async function remove(id) {
        if (!window.confirm('Deseja remover este usuário?')) return;

        try {
            await api.delete(`/users/${id}`);
            loadUsers();
        } catch (err) {
            alert(err.response?.data?.error || 'Erro ao remover usuário');
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <Header />

            <main className="max-w-6xl mx-auto p-6 space-y-6">

                {/* HEADER */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-semibold flex gap-2">
                        <User className="w-6 h-6 text-sky-400" />
                        Usuários
                    </h1>

                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 px-4 py-2
                                   bg-sky-600 hover:bg-sky-700 rounded-md"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Usuário
                    </button>
                </div>

                {/* LIST */}
                {loading ? (
                    <div className="text-slate-400">Carregando…</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {users.map(user => (
                            <div
                                key={user.id}
                                className="bg-slate-900 border border-slate-800
                                           rounded-lg p-4 space-y-3"
                            >
                                <div className="flex justify-between">
                                    <div>
                                        <h3 className="font-semibold flex gap-2">
                                            <User className="w-4 h-4 text-sky-400" />
                                            {user.name}
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            {user.email}
                                        </p>
                                    </div>

                                    <span className="text-xs px-2 py-1 rounded
                                        bg-slate-800 flex items-center gap-1">
                                        <Shield className="w-3 h-3" />
                                        {user.role}
                                    </span>
                                </div>

                                <div className="flex gap-2 text-xs">
                                    {user.status === 'active' ? (
                                        <button
                                            onClick={() => action(user.id, 'block')}
                                            className="flex items-center gap-1
                                                       px-2 py-1 bg-yellow-600 rounded"
                                        >
                                            <Lock className="w-3 h-3" />
                                            Bloquear
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => action(user.id, 'unblock')}
                                            className="flex items-center gap-1
                                                       px-2 py-1 bg-emerald-600 rounded"
                                        >
                                            <Unlock className="w-3 h-3" />
                                            Ativar
                                        </button>
                                    )}

                                    <button
                                        onClick={() => action(user.id, 'reset-password')}
                                        className="flex items-center gap-1
                                                   px-2 py-1 bg-sky-600 rounded"
                                    >
                                        <RefreshCcw className="w-3 h-3" />
                                        Resetar senha
                                    </button>

                                    {currentUser?.role === 'root' && (
                                        <button
                                            onClick={() => remove(user.id)}
                                            className="flex items-center gap-1
                                                       px-2 py-1 bg-red-600 rounded"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Deletar
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {showCreate && (
                <CreateUserModal
                    onClose={() => setShowCreate(false)}
                    onCreated={loadUsers}
                />
            )}
        </div>
    );
}
