import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Server,
    Power,
    PauseCircle,
    HelpCircle,
} from 'lucide-react';

import api from '../services';
import VmCard from '../components/dashboard/VmCard.jsx';
import VmList from '../components/dashboard/VmList.jsx';
import GlobalLoader from '../components/GlobalLoader';

function timeAgo(date) {
    if (!date) return '—';
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
}

const STATUS_CARDS = [
    {
        status: 'POWERED_ON',
        label: 'Online',
        icon: Server,
        color: 'emerald',
    },
    {
        status: 'POWERED_OFF',
        label: 'Offline',
        icon: Power,
        color: 'slate',
    },
    {
        status: 'SUSPENDED',
        label: 'Suspended',
        icon: PauseCircle,
        color: 'orange',
    },
    {
        status: 'UNKNOWN',
        label: 'Unknown',
        icon: HelpCircle,
        color: 'zinc',
    },
];

export default function Dashboard() {
    const [vms, setVms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    // visualização
    const [view, setView] = useState(
        localStorage.getItem('vm_view') || 'cards'
    );

    // ✅ seleção em lote (pronto pro bulk actions)
    const [selected, setSelected] = useState([]);

    const user = JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate();

    const isPrivileged =
        user?.role === 'root' ||
        user?.role === 'admin' ||
        user?.role === 'support';

    async function loadVms() {
        try {
            setLoading(true);
            const { data } = await api.get('/vm', { params: { limit: 9 } });
            setVms(data.data || []);
        } catch {
            alert('Erro ao carregar VMs');
        } finally {
            setLoading(false);
        }
    }

    function changeView(type) {
        setView(type);
        localStorage.setItem('vm_view', type);

        // ✅ ao trocar view, mantém seleção (não reseta)
        // se quiser resetar depois, a gente muda
    }

    useEffect(() => {
        loadVms();
    }, []);

    // ✅ quando muda lista de VMs, remove IDs que não existem mais
    useEffect(() => {
        const ids = new Set((vms || []).map(vm => vm.id));
        setSelected(prev => prev.filter(id => ids.has(id)));
    }, [vms]);

    const lastSync =
        vms
            .map(vm => vm.last_sync_at)
            .filter(Boolean)
            .sort((a, b) => new Date(b) - new Date(a))[0];

    // count por status
    const statusCount = vms.reduce((acc, vm) => {
        acc[vm.status] = (acc[vm.status] || 0) + 1;
        return acc;
    }, {});

    // ✅ select all desta tela (somente dashboard)
    const allSelected = vms.length > 0 && selected.length === vms.length;

    function toggleAll() {
        if (!isPrivileged) return;
        setSelected(allSelected ? [] : vms.map(vm => vm.id));
    }

    function toggleOne(id) {
        if (!isPrivileged) return;
        setSelected(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    }

    const selectedCount = selected.length;

    // ✅ clusters list (se quiser usar depois em toolbar)
    const clusters = useMemo(() => {
        return [...new Set(vms.map(vm => vm.cluster_name).filter(Boolean))].sort();
    }, [vms]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
            <main className="flex-1 p-6 space-y-6">

                {/* HEADER */}
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-semibold">Máquinas Virtuais</h1>

                    <div className="flex items-center gap-3">
                        {/* toggle view */}
                        <div className="flex bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                            <button
                                onClick={() => changeView('cards')}
                                className={`px-3 py-2 text-sm ${
                                    view === 'cards'
                                        ? 'bg-sky-600'
                                        : 'hover:bg-slate-800'
                                }`}
                            >
                                Cards
                            </button>
                            <button
                                onClick={() => changeView('rows')}
                                className={`px-3 py-2 text-sm ${
                                    view === 'rows'
                                        ? 'bg-sky-600'
                                        : 'hover:bg-slate-800'
                                }`}
                            >
                                Lista
                            </button>
                        </div>

                        <button
                            onClick={() => navigate('/vms')}
                            className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700"
                        >
                            Ver todas
                        </button>

                        {(user?.role === 'root' || user?.role === 'admin') && (
                            <div className="text-xs text-emerald-400 flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                                Sincronização automática ativa
                                <span className="text-slate-400">
                                    · Última sync: {timeAgo(lastSync)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* STATUS CARDS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {STATUS_CARDS.map(card => {
                        const Icon = card.icon;

                        // ⚠️ Tailwind não compila strings dinâmicas
                        // então aqui usamos classes fixas por status
                        const hoverBorder =
                            card.color === 'emerald'
                                ? 'hover:border-emerald-500 hover:shadow-emerald-500/10'
                                : card.color === 'slate'
                                    ? 'hover:border-slate-500 hover:shadow-slate-500/10'
                                    : card.color === 'orange'
                                        ? 'hover:border-orange-500 hover:shadow-orange-500/10'
                                        : 'hover:border-zinc-500 hover:shadow-zinc-500/10';

                        const iconBg =
                            card.color === 'emerald'
                                ? 'bg-emerald-500/10'
                                : card.color === 'slate'
                                    ? 'bg-slate-500/10'
                                    : card.color === 'orange'
                                        ? 'bg-orange-500/10'
                                        : 'bg-zinc-500/10';

                        const iconColor =
                            card.color === 'emerald'
                                ? 'text-emerald-400'
                                : card.color === 'slate'
                                    ? 'text-slate-400'
                                    : card.color === 'orange'
                                        ? 'text-orange-400'
                                        : 'text-zinc-400';

                        const valueColor =
                            card.color === 'emerald'
                                ? 'text-emerald-400'
                                : card.color === 'slate'
                                    ? 'text-slate-300'
                                    : card.color === 'orange'
                                        ? 'text-orange-300'
                                        : 'text-zinc-300';

                        return (
                            <div
                                key={card.status}
                                onClick={() => navigate(`/vm?status=${card.status}`)}
                                className={`cursor-pointer rounded-xl bg-slate-900 border border-slate-800
                                    p-4 transition hover:shadow-lg ${hoverBorder}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${iconBg}`}>
                                        <Icon className={`w-5 h-5 ${iconColor}`} />
                                    </div>

                                    <div>
                                        <div className="text-xs text-slate-400">
                                            {card.label}
                                        </div>
                                        <div className={`text-2xl font-semibold ${valueColor}`}>
                                            {statusCount[card.status] || 0}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ✅ BAR DE SELEÇÃO (SÓ QUANDO ROOT/ADMIN/SUPPORT E TEM VM) */}
                {isPrivileged && vms.length > 0 && (
                    <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 p-3 rounded-lg">
                        <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleAll}
                        />

                        <span className="text-sm text-slate-300">
                            {selectedCount > 0
                                ? `${selectedCount} selecionadas`
                                : 'Selecionar todas desta tela'}
                        </span>

                        {selectedCount > 0 && (
                            <button
                                onClick={() => setSelected([])}
                                className="ml-auto px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded"
                            >
                                Limpar seleção
                            </button>
                        )}
                    </div>
                )}

                {/* LISTAGEM */}
                {loading ? (
                    <div className="text-slate-400">Carregando VMs…</div>
                ) : view === 'rows' ? (
                    <VmList
                        vms={vms}
                        onChange={loadVms}
                        currentUser={user}

                        // ✅ props novas (bulk)
                        selected={selected}
                        onToggleOne={toggleOne}
                        onToggleAll={toggleAll}
                        allSelected={allSelected}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {vms.map(vm => (
                            <VmCard
                                key={vm.id}
                                vm={vm}
                                onChange={loadVms}
                                currentUser={user}

                                // ✅ props novas (bulk)
                                selected={selected}
                                onToggleOne={toggleOne}
                                isSelected={selected.includes(vm.id)}
                            />
                        ))}
                    </div>
                )}
            </main>

            <GlobalLoader visible={syncing} />
        </div>
    );
}
