import { useState } from 'react';
import api from '../services';

export default function CreateUserModal({ onClose, onCreated }) {
    const [form, setForm] = useState({
        name: '',
        login: '',
        email: '',
        password: '',
        role: 'user',
    });

    async function submit() {
        try {
            await api.post('/users', form);
            onCreated();
            onClose();
        } catch (err) {
            alert(err.response?.data?.error || 'Erro ao criar usuário');
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 w-96 space-y-4">
                <h3 className="font-semibold text-lg">Criar Usuário</h3>

                {['name', 'login', 'email', 'password'].map(field => (
                    <input
                        key={field}
                        type={field === 'password' ? 'password' : 'text'}
                        placeholder={field}
                        value={form[field]}
                        onChange={e => setForm({ ...form, [field]: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm"
                    />
                ))}

                <select
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm"
                >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="root">Root</option>
                </select>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-3 py-1 bg-slate-700 rounded"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={submit}
                        className="px-3 py-1 bg-sky-600 rounded"
                    >
                        Criar
                    </button>
                </div>
            </div>
        </div>
    );
}
