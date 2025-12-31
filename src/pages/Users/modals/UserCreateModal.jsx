import { useState } from 'react';
import api from '../../../services';

export default function UserCreateModal({ onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        name: '',
        login: '',
        email: '',
        phone: '',
        password: '',
        status: 'active',
    });

    function update(field, value) {
        setForm(prev => ({ ...prev, [field]: value }));
    }

    async function submit(e) {
        e.preventDefault();
        setError(null);

        if (!form.name || !form.login || !form.password) {
            setError('Nome, login e senha são obrigatórios.');
            return;
        }

        try {
            setLoading(true);

            await api.post('/users', {
                name: form.name,
                login: form.login,
                email: form.email || null,
                phone: form.phone || null,
                password: form.password,
                status: form.status,
            });

            onSuccess?.();
            onClose();
        } catch (err) {
            console.error('[USER_CREATE]', err);
            setError(
                err?.response?.data?.message ||
                'Erro ao criar usuário'
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="modal-backdrop">
            <div className="modal-container">
                <h2>Criar usuário</h2>

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
                            value={form.login}
                            onChange={e => update('login', e.target.value)}
                            placeholder="login de acesso"
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
                        <label>Senha</label>
                        <input
                            type="password"
                            value={form.password}
                            onChange={e => update('password', e.target.value)}
                            placeholder="Senha de acesso"
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
                            {loading ? 'Criando...' : 'Criar usuário'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
