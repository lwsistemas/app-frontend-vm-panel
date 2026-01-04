import { useEffect, useMemo, useState } from 'react';
import api from '../../services';
import VmList from '../../components/dashboard/VmList.jsx';
import VmCard from '../../components/dashboard/VmCard.jsx';
import VmFilters from '../../components/vm/VmFilters.jsx';

import { Ban } from "lucide-react";
import VmCancelRequestModal from "../../components/VmCancelRequestModal";
import { canVm, whyVmDenied } from "../../utils/permissions";

export default function VmPage() {
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user?.role === 'admin' || user?.role === 'root';
    const isOperator = ['root', 'admin', 'support'].includes(user?.role); // operador
    const isClient = user?.role === 'client' || user?.role === 'basic';

    const [vms, setVms] = useState([]);
    const [loading, setLoading] = useState(true);

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 1,
    });

    const [view, setView] = useState(localStorage.getItem('vm_view_full') || 'rows');

    const [filters, setFilters] = useState({
        page: 1,
        limit: 20,
        search: '',
        status: '',
        os: '',
        min_cpu: '',
        min_memory: '',
        cluster: '',
        provider_host: '',
        vmware_tools: '',
        snapshot: '',
    });

    // ✅ seleção global (massa)
    const [selected, setSelected] = useState([]);
    const [openCancel, setOpenCancel] = useState(false);

    const canRequestCancel = canVm("cancel_request");

    const vmsSafe = useMemo(() => (Array.isArray(vms) ? vms.filter(Boolean) : []), [vms]);

    async function loadVms() {
        try {
            setLoading(true);

            const { data } = await api.get('/vm', { params: filters });

            const list = data.data || [];
            setVms(list);
            setPagination(data.pagination || pagination);

            // ✅ remove da seleção IDs que não estão mais na página
            const idsOnPage = new Set(list.filter(Boolean).map(x => x.id));
            setSelected(prev => prev.filter(id => idsOnPage.has(id)));

        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadVms();
    }, [filters]);

    function changeView(type) {
        setView(type);
        localStorage.setItem('vm_view_full', type);
    }

    function changePage(page) {
        setFilters(prev => ({
            ...prev,
            page,
        }));
    }

    function goCreateVm() {
        window.location.href = '/vms/create';
    }

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-semibold">Máquinas Virtuais</h1>

                <div className="flex items-center gap-3">
                    {isAdmin && (
                        <button
                            onClick={goCreateVm}
                            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium"
                        >
                            + Criar VM
                        </button>
                    )}

                    <div className="flex bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                        <button
                            onClick={() => changeView('rows')}
                            className={`px-3 py-2 text-sm ${
                                view === 'rows' ? 'bg-sky-600' : 'hover:bg-slate-800'
                            }`}
                        >
                            Lista
                        </button>
                        <button
                            onClick={() => changeView('cards')}
                            className={`px-3 py-2 text-sm ${
                                view === 'cards' ? 'bg-sky-600' : 'hover:bg-slate-800'
                            }`}
                        >
                            Cards
                        </button>
                    </div>
                </div>
            </div>

            {/* FILTROS */}
            <VmFilters
                filters={filters}
                onChange={setFilters}
                mode={isAdmin ? 'admin' : 'client'}
            />

            {/* LISTAGEM */}
            {loading ? (
                <div className="text-slate-400">Carregando VMs…</div>
            ) : view === 'rows' ? (
                <VmList
                    vms={vmsSafe}
                    onChange={loadVms}
                    currentUser={user}
                    selected={selected}
                    setSelected={setSelected}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vmsSafe.map(vm => (
                        <VmCard
                            key={vm.id}
                            vm={vm}
                            onChange={loadVms}
                            currentUser={user}
                            selected={selected}
                            setSelected={setSelected}
                        />
                    ))}
                </div>
            )}

            {/* PAGINAÇÃO */}
            {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 pt-4 pb-6">
                    {Array.from({ length: pagination.pages }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => changePage(i + 1)}
                            className={`px-3 py-1 text-sm rounded
                                ${pagination.page === i + 1
                                ? 'bg-sky-600'
                                : 'bg-slate-800 hover:bg-slate-700'
                            }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
