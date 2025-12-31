import { useState } from 'react';
import api from '../../../services';

export default function UserDeleteModal({ user, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function confirmDelete() {
        setError(null);

        try {
            setLoading(true);
            await api.delete(`/users/${user.id}`);
            onSuccess?.();
            onClose();
        } catch (err) {
            console.error('[USER_DELETE]', err);
            setError(
                err?.response?.data?.message ||
                'Erro ao excluir usuário'
            );
        } finally {
            setLoading(false);
        }
    }

    if (!user) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal-container">
                <h2 className="danger-title">Excluir usuário</h2>

                <p className="danger-text">
                    Tem certeza que deseja excluir o usuário:
                    <strong> {user.name}</strong>?
                </p>

                <p className="danger-warning">
                    Esta ação não poderá ser desfeita.
                </p>

                {error && (
                    <div className="form-error">
                        {error}
                    </div>
                )}

                <div className="modal-actions">
                    <button
                        className="btn-secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancelar
                    </button>

                    <button
                        className="btn-danger"
                        onClick={confirmDelete}
                        disabled={loading}
                    >
                        {loading ? 'Excluindo...' : 'Excluir usuário'}
                    </button>
                </div>
            </div>
        </div>
    );
}
