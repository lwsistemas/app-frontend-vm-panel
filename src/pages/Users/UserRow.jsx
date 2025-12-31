import { Lock, Unlock, Trash2, Edit } from 'lucide-react';
import api from '../../services';
import { useState } from 'react';

import UserDeleteModal from './modals/UserDeleteModal';
import UserEditModal from './modals/UserEditModal';

export default function UserRow({ user, onRefresh }) {
    const [modalDelete, setModalDelete] = useState(false);
    const [modalEdit, setModalEdit] = useState(false);

    async function toggleStatus() {
        const endpoint =
            user.status === 'active'
                ? `/users/${user.id}/block`
                : `/users/${user.id}/unblock`;

        await api.post(endpoint);
        onRefresh();
    }

    return (
        <>
            <tr className="bg-slate-950 hover:bg-slate-900">
                <td className="px-4 py-3">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-slate-400">ID #{user.id}</div>
                </td>

                <td className="px-4 py-3">{user.login}</td>
                <td className="px-4 py-3">{user.email}</td>

                <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded text-xs bg-slate-800">
                        {user.role}
                    </span>
                </td>

                <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                        user.status === 'active'
                            ? 'bg-emerald-600'
                            : 'bg-red-600'
                    }`}>
                        {user.status}
                    </span>
                </td>

                <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => setModalEdit(true)} title="Editar">
                        <Edit className="w-4 h-4 text-sky-400" />
                    </button>

                    <button onClick={toggleStatus} title="Ativar / Bloquear">
                        {user.status === 'active'
                            ? <Lock className="w-4 h-4 text-yellow-400" />
                            : <Unlock className="w-4 h-4 text-yellow-400" />
                        }
                    </button>

                    <button onClick={() => setModalDelete(true)} title="Excluir">
                        <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                </td>
            </tr>

            {modalEdit && (
                <UserEditModal
                    user={user}
                    onClose={() => setModalEdit(false)}
                    onSuccess={() => {
                        setModalEdit(false);
                        onRefresh();
                    }}
                />
            )}

            {modalDelete && (
                <UserDeleteModal
                    user={user}
                    onClose={() => setModalDelete(false)}
                    onSuccess={() => {
                        setModalDelete(false);
                        onRefresh();
                    }}
                />
            )}
        </>
    );
}
