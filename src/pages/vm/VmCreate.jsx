// src/pages/Vms/VmCreatePage.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services';
import useUsersSimple from '../../hooks/useUsersSimple';

export default function VmCreatePage() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    const isPrivileged = ['root', 'admin', 'support'].includes(user?.role);
    const canPickOwner = ['root', 'admin'].includes(user?.role);

    const { users } = useUsersSimple(canPickOwner);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [optionsLoading, setOptionsLoading] = useState(true);

    const [templates, setTemplates] = useState([]);
    const [hosts, setHosts] = useState([]);

    const defaultCluster = '';
    const defaultHost = '';

    const [taskId, setTaskId] = useState(null);
    const [showLoader, setShowLoader] = useState(false);

    const task = useTaskProgress(taskId, showLoader);

    useEffect(() => {
        if (!showLoader) return;

        if (task.status === "SUCCEEDED" && task.vmId) {
            setShowLoader(false);
            navigate(`/vms`);
        }

        if (task.status === "FAILED") {
            setShowLoader(false);
            setError("Falha ao criar VM");
        }
    }, [task.status, task.vmId, showLoader]);


    const [form, setForm] = useState({
        name: '',
        hostname: '',
        template_id: '',
        cluster_id: '',
        host_id: '',
        cpu: 2,
        memory_mb: 2048,
        disk_gb: 40,
        owner_id: user?.id || '',
    });

    function update(field, value) {
        setForm(prev => ({
            ...prev,
            [field]: value,
        }));
    }

    async function loadTemplates(hostId) {
        if (!hostId) return [];
        const { data } = await api.get(`/vm/templates?host_id=${hostId}`);
        return data?.templates || [];
    }

    useEffect(() => {
        const base = `vm-alpha-core-${Math.floor(Math.random() * 900 + 100)}`;
        setForm(prev => ({
            ...prev,
            name: base,
            hostname: base,
        }));
    }, []);

    /* ===============================
     * ✅ LOAD HOSTS
     * =============================== */
    useEffect(() => {
        if (!isPrivileged) return;

        async function loadOptions() {
            try {
                setOptionsLoading(true);
                setError('');

                const { data } = await api.get('/vm/create/options');

                const hsts = data?.hosts || [];
                setHosts(hsts);

                // cluster default (visual)
                const clusterList = [...new Set(hsts.map(h => h.cluster_name).filter(Boolean))].sort();
                const clusterDefault = clusterList[0] || defaultCluster;

                // host default
                const hostsCluster = hsts
                    .filter(h => h.cluster_name === clusterDefault && h.status === 'active')
                    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

                const hostDefault = hostsCluster[0]?.provider_host_id || defaultHost;

                // templates do host default
                const tpls = await loadTemplates(hostDefault);
                setTemplates(tpls);

                setForm(prev => ({
                    ...prev,
                    cluster_id: clusterDefault,
                    host_id: hostDefault,
                    template_id: tpls[0]?.id || '',
                }));

            } catch (e) {
                setError(e.response?.data?.error || 'Erro ao carregar opções');
            } finally {
                setOptionsLoading(false);
            }
        }

        loadOptions();
    }, [isPrivileged]);

    /* ===============================
     * ✅ CLUSTERS (visual)
     * =============================== */
    const clusters = useMemo(() => {
        return [...new Set(hosts.map(h => h.cluster_name).filter(Boolean))].sort();
    }, [hosts]);

    const hostsByCluster = useMemo(() => {
        if (!form.cluster_id) return [];
        return hosts
            .filter(h => h.cluster_name === form.cluster_id && h.status === 'active')
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [hosts, form.cluster_id]);

    /* ===============================
     * ✅ AO TROCAR CLUSTER → TROCA HOST
     * =============================== */
    async function updateCluster(clusterId) {
        const filteredHosts = hosts
            .filter(h => h.cluster_name === clusterId && h.status === 'active')
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        const nextHost = filteredHosts[0]?.provider_host_id || '';

        const tpls = await loadTemplates(nextHost);
        setTemplates(tpls);

        setForm(prev => ({
            ...prev,
            cluster_id: clusterId,
            host_id: nextHost,
            template_id: tpls[0]?.id || '',
        }));
    }

    /* ===============================
     * ✅ AO TROCAR HOST → BUSCA TEMPLATES DO HOST
     * =============================== */
    async function updateHost(hostId) {
        update('host_id', hostId);

        const tpls = await loadTemplates(hostId);
        setTemplates(tpls);

        setForm(prev => ({
            ...prev,
            template_id: tpls[0]?.id || '',
        }));
    }

    function validate() {
        if (!form.host_id) return 'Host é obrigatório';
        if (!form.template_id) return 'Template é obrigatório';
        if (!form.name) return 'Nome é obrigatório';
        if (!form.hostname) return 'Hostname é obrigatório';
        if (!form.cpu || Number(form.cpu) < 1) return 'CPU inválida';
        if (!form.memory_mb || Number(form.memory_mb) < 256) return 'Memória inválida';
        if (!form.disk_gb || Number(form.disk_gb) < 10) return 'Disco inválido';
        if (!form.owner_id) return 'Dono é obrigatório';
        return '';
    }

    async function submit() {
        setError('');

        const err = validate();
        if (err) {
            setError(err);
            return;
        }

        try {
            setLoading(true);

            const payload = {
                name: form.name.trim(),
                hostname: form.hostname.trim(),
                template_id: form.template_id.trim(),
                cluster_id: form.cluster_id.trim(), // visual (valida no backend)
                host_id: form.host_id.trim(),
                cpu: Number(form.cpu),
                memory_mb: Number(form.memory_mb),
                disk_gb: Number(form.disk_gb),
                owner_id: Number(form.owner_id),
            };

            const { data } = await api.post('/vm/create', payload);

            if (data?.vm?.id) {
                navigate(`/vm/${data.vm.id}`);
            } else {
                navigate('/vms');
            }
        } catch (e) {
            setError(e.response?.data?.error || 'Erro ao criar VM');
        } finally {
            setLoading(false);
        }
    }

    if (!isPrivileged) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold">Sem permissão</h2>
                <p className="text-slate-400 mt-2">
                    Apenas root/admin/suporte podem criar VMs.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Criar VM</h1>

                <GlobalLoader
                    visible={showLoader}
                    title="Criando VM"
                    subtitle="Clonando template no vCenter…"
                    progress={Math.round((task.completed / task.total) * 100)}
                    status={task.status}
                />



                <button
                    onClick={() => navigate('/vms')}
                    className="px-5 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition font-medium"
                >
                    Voltar
                </button>
            </div>

            {error && (
                <div className="bg-red-950/40 border border-red-800 text-red-200 p-4 rounded-xl">
                    {error}
                </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div>
                        <label className="text-sm text-slate-400 block mb-2">Nome</label>
                        <input
                            value={form.name}
                            onChange={e => update('name', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-slate-400 block mb-2">Hostname</label>
                        <input
                            value={form.hostname}
                            onChange={e => update('hostname', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-sm text-slate-400 block mb-2">Cluster</label>

                        {optionsLoading ? (
                            <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-500">
                                Carregando clusters...
                            </div>
                        ) : (
                            <select
                                value={form.cluster_id}
                                onChange={e => updateCluster(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm"
                            >
                                <option value="">Selecione...</option>
                                {clusters.map(c => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {form.cluster_id && (
                        <div className="md:col-span-2">
                            <label className="text-sm text-slate-400 block mb-2">Host</label>

                            {optionsLoading ? (
                                <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-500">
                                    Carregando hosts...
                                </div>
                            ) : (
                                <select
                                    value={form.host_id}
                                    onChange={e => updateHost(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm"
                                >
                                    <option value="">Selecione...</option>
                                    {hostsByCluster.map(h => (
                                        <option key={h.provider_host_id} value={h.provider_host_id}>
                                            {h.name} • {h.location} • {h.host_ip} ({h.provider_host_id})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    <div className="md:col-span-2">
                        <label className="text-sm text-slate-400 block mb-2">Template (por Host)</label>

                        {optionsLoading ? (
                            <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-500">
                                Carregando templates...
                            </div>
                        ) : (
                            <select
                                value={form.template_id}
                                onChange={e => update('template_id', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm"
                            >
                                <option value="">Selecione...</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} • {t.os} • {t.cluster_name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-sm text-slate-400 block mb-2">Dono</label>

                        {canPickOwner ? (
                            <select
                                value={form.owner_id}
                                onChange={e => update('owner_id', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm"
                            >
                                <option value="">Selecione...</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} ({u.role})
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300">
                                {user?.name} (ID {user?.id})
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="text-sm text-slate-400 block mb-2">CPU</label>
                        <input
                            type="number"
                            min="1"
                            value={form.cpu}
                            onChange={e => update('cpu', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-slate-400 block mb-2">Memória (MB)</label>
                        <input
                            type="number"
                            min="256"
                            value={form.memory_mb}
                            onChange={e => update('memory_mb', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-slate-400 block mb-2">Disco (GB)</label>
                        <input
                            type="number"
                            min="10"
                            value={form.disk_gb}
                            onChange={e => update('disk_gb', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm"
                        />
                    </div>

                </div>

                <div className="flex justify-end gap-4 mt-8">
                    <button
                        onClick={() => navigate('/vms')}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium transition"
                    >
                        Cancelar
                    </button>

                    <button
                        onClick={submit}
                        disabled={loading || optionsLoading || !form.cluster_id || !form.host_id || !form.template_id}
                        className="px-6 py-3 bg-sky-600 hover:bg-sky-500 rounded-xl font-semibold transition disabled:opacity-50"
                    >
                        {loading ? 'Criando...' : 'Criar VM'}
                    </button>
                </div>
            </div>
        </div>
    );
}
