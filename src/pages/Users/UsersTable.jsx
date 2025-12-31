import UserRow from './UserRow';

export default function UsersTable({ users, loading, onRefresh }) {
    if (loading) {
        return <div className="text-sm text-slate-400">Carregando usuários…</div>;
    }

    if (!users.length) {
        return <div className="text-sm text-slate-400">Nenhum usuário encontrado.</div>;
    }

    return (
        <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="min-w-full text-sm">
                <thead className="bg-slate-900 text-slate-400">
                <tr>
                    <th className="px-4 py-3 text-left">Usuário</th>
                    <th className="px-4 py-3 text-left">Login</th>
                    <th className="px-4 py-3 text-left">E-mail</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                {users.map(user => (
                    <UserRow
                        key={user.id}
                        user={user}
                        onRefresh={onRefresh}
                    />
                ))}
                </tbody>
            </table>
        </div>
    );
}
