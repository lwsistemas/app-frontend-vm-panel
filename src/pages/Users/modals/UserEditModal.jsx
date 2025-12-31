import { useState, useEffect } from 'react';
import api from '../../../services';

export default function UserEditModal({ user, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        status: 'active',
        password: '',
    });

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                status: user.status || 'active',
                password: '',
            });
        }
    }, [user]);

    function update(field, value) {
        setForm(prev => ({ ...prev, [field]: value }));
    }

    async function submit(e) {
        e.preventDefault();
        setError(null);

        if (!form.name) {
            setError('O nome é obrigatório.');
            return;
        }

        try {
            setLoading(true);

            const payload = {
                name: form.name,
                email: form.email || null,
                phone: form.phone || null,
                status: form.status,
            };

            // só envia senha se o usuário digitou
            if (form.password) {
                payload.password = form.password;
            }

            await api.put(`/users/${user.id}`, payload);

            onSuccess?.();
            onClose();
        } catch (err) {
            console.error('[USER_EDIT]', err);
            setError(
                err?.response?.data?.message ||
                'Erro ao atualizar usuário'
            );
        } finally {
            setLoading(false);
        }
    }

    if (!user) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal-container">
                <h2>Editar usuário</h2>

                <form onSubmit={submit} className="modal-form">
                    <div className="form-group">
                        <label>Nome</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={e => update('name', e.target.value)}
                            placeholder="Nome completo"
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label>Login</label>
                        <input
                            type="text"
                            value={user.login}
                            disabled
                        />
                    </div>

                    <div className="form-group">
                        <label>E-mail</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={e => update('email', e.target.value)}
                            placeholder="email@exemplo.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>Telefone</label>
                        <input
                            type="text"
                            value={form.phone}
                            onChange={e => update('phone', e.target.value)}
                            placeholder="+55 11 99999-9999"
                        />
                    </div>

                    <div className="form-group">
                        <label>Nova senha (opcional)</label>
                        <input
                            type="password"
                            value={form.password}
                            onChange={e => update('password', e.target.value)}
                            placeholder="Deixe em branco para não alterar"
                        />
                    </div>

                    <div className="form-group">
                        <label>Status</label>
                        <select
                            value={form.status}
                            onChange={e => update('status', e.target.value)}
                        >
                            <option value="active">Ativo</option>
                            <option value="blocked">Bloqueado</option>
                            <option value="disabled">Desativado</option>
                        </select>
                    </div>

                    {error && (
                        <div className="form-error">
                            {error}
                        </div>
                    )}

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Salvando...' : 'Salvar alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
