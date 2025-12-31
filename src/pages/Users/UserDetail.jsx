// pages/Users/UserDetail.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services';

import {
    User,
    Mail,
    Shield,
    Activity,
} from 'lucide-react';

export default function UserDetail() {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    async function load() {
        try {
            setLoading(true);
            const { data } = await api.get(`/users/${id}`);
            setUser(data);
        } catch (err) {
            console.error('[USER][DETAIL]', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, [id]);

    if (loading) {
        return (
            <div className="text-sm text-slate-400">
                Carregando usuário…
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-sm text-red-400">
                Usuário não encontrado
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                        <User className="w-6 h-6 text-sky-400" />
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold">
                            {user.name}
                        </h2>
                        <p className="text-sm text-slate-400">
                            ID #{user.id}
                        </p>
                    </div>
                </div>
            </div>

            {/* INFO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <InfoCard
                    icon={<Mail />}
                    label="E-mail"
                    value={user.email}
                />

                <InfoCard
                    icon={<Shield />}
                    label="Role"
                    value={user.role}
                />

                <InfoCard
                    icon={<Activity />}
                    label="Status"
                    value={user.status}
                />

                <InfoCard
                    label="Login"
                    value={user.login}
                />
            </div>

            {/* PLACEHOLDERS */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-sm text-slate-400">
                VMs do usuário, histórico e logs aparecerão aqui.
            </div>
        </div>
    );
}

/* ===================== */

function InfoCard({ icon, label, value }) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                {icon}
                {label}
            </div>
            <div className="text-sm font-medium">
                {value || '-'}
            </div>
        </div>
    );
}
