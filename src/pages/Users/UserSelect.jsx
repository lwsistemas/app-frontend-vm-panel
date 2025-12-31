import { useEffect, useState } from 'react';
import api from '../../services';

export default function UserSelect({ value, onChange }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const { data } = await api.get('/users/simple');
            setUsers(data || []);
            setLoading(false);
        }
        load();
    }, []);

    return (
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm"
            disabled={loading}
        >
            <option value="">
                {loading ? 'Carregando usuários...' : 'Selecione um usuário'}
            </option>

            {users.map(u => (
                <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                </option>
            ))}
        </select>
    );
}
