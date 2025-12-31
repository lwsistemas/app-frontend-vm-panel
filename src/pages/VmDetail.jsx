import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Server,
    Cpu,
    MemoryStick,
    HardDrive,
    Power,
    RotateCcw,
    RefreshCw,
    ShieldCheck,
    AlertTriangle,
} from 'lucide-react';

import api from '../services';
import Header from '../components/Header';

export default function VmDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const pollRef = useRef(null);

    const [vm, setVm] = useState(null);
    const [hardware, setHardware] = useState(null);
    const [disks, setDisks] = useState([]);
    const [nics, setNics] = useState([]);
    const [cdroms, setCdroms] = useState([]);
    const [tab, setTab] = useState('overview');

    const [loading, setLoading] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);

    // 🔒 controle de ação
    const [acting, setActing] = useState(null); // start | stop | restart | sync
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        setInitialLoad(true);
        loadVm(false);
        return () => stopPolling();
    }, [id]);

    async function loadVm(isPolling = false) {
        try {
            if (!isPolling && initialLoad) {
                setLoading(true);
            }

            const { data } = await api.get(`/vm/${id}/detail`);
            setVm(data.vm);
            setHardware(data.hardware);
            setDisks(data.disks || []);
            setNics(data.nics || []);
            setCdroms(data.cdroms || []);
        } catch {
            navigate('/');
        } finally {
            if (!isPolling && initialLoad) {
                setLoading(false);
                setInitialLoad(false);
            }
        }
    }

    function startPolling() {
        stopPolling();
        pollRef.current = setInterval(async () => {
            await loadVm(true);
            setProgress(p => Math.min(p + 15, 95));
        }, 2000);
    }

    function stopPolling() {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }

    async function action(endpoint) {
        if (acting) return;

        try {
            setActing(endpoint);
            setProgress(10);

            await api.post(`/vm/${id}/${endpoint}`);
            startPolling();
        } catch (err) {
            console.error(err);
            setActing(null);
            setProgress(0);
        }
    }

    // libera ações quando VM estabiliza
    useEffect(() => {
        if (!acting || !vm) return;

        const stable =
            vm.status === 'POWERED_ON' ||
            vm.status === 'POWERED_OFF';

        if (stable) {
            stopPolling();
            setProgress(100);
            setTimeout(() => {
                setActing(null);
                setProgress(0);
            }, 500);
        }
    }, [vm, acting]);


    useEffect(() => {
        // não atualiza automaticamente se houver ação em andamento
        if (acting) return;

        const interval = setInterval(() => {
            loadVm(true); // refresh silencioso
        }, 20000); // 20 segundos

        return () => clearInterval(interval);
    }, [acting, id]);


    if (loading || !vm) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-400">
                <div className="p-6">Carregando VM…</div>
            </div>
        );
    }

    const toolsOk = vm.tools_status === 'RUNNING';
    const isoMounted = cdroms.some(c => c.iso_file);
    const nicConnected = nics.some(n => n.connected);




    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <main className="max-w-7xl mx-auto p-6 space-y-6">

                {/* HEADER */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded bg-slate-800 hover:bg-slate-700"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div>
                        <h1 className="text-2xl font-semibold flex items-center gap-2">
                            <Server className="w-5 h-5 text-sky-400" />
                            {vm.name}
                        </h1>
                        <p className="text-slate-400 text-sm">
                            {vm.os} • {vm.hostname || '—'}
                        </p>
                    </div>

                    <span className={`ml-auto px-3 py-1 text-xs rounded ${statusColor(vm.status)}`}>
                        {vm.status}
                    </span>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-2">
                    <ActionButton
                        icon={<Power />}
                        label="Power On"
                        color="emerald"
                        disabled={acting || vm.status === 'POWERED_ON'}
                        onClick={() => action('start')}
                    />
                    <ActionButton
                        icon={<Power />}
                        label="Power Off"
                        color="red"
                        disabled={acting || vm.status !== 'POWERED_ON'}
                        onClick={() => action('stop')}
                    />
                    <ActionButton
                        icon={<RotateCcw />}
                        label="Reboot"
                        color="amber"
                        disabled={acting || vm.status !== 'POWERED_ON'}
                        onClick={() => action('restart')}
                    />
                    <ActionButton
                        icon={<RefreshCw />}
                        label="Sync"
                        color="sky"
                        disabled={acting}
                        onClick={() => action('sync')}
                    />
                </div>

                {/* PROGRESS */}
                {acting && (
                    <div className="w-full bg-slate-800 rounded h-2 overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${actionColor(acting)}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                {/* TABS */}
                <div className="flex gap-6 border-b border-slate-800 text-sm">
                    {['overview', 'network', 'storage', 'tools'].map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`pb-2 capitalize ${
                                tab === t
                                    ? 'border-b-2 border-sky-500 text-sky-400'
                                    : 'text-slate-400'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* OVERVIEW */}
                {tab === 'overview' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <StatusItem label="State" value={vm.status} />
                            <StatusItem label="Tools" value={vm.tools_status || '—'} />
                            <StatusItem
                                label="Last Sync"
                                value={vm.last_sync_at ? new Date(vm.last_sync_at).toLocaleString() : '—'}
                            />
                            <StatusItem label="Provider" value={vm.provider_host} />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card title="Overview">
                                <Info label="OS" value={vm.os} />
                                <Info label="IP Address" value={vm.ip_address || '—'} />
                                <Info label="Datastore" value={disks[0]?.datastore || '—'} />
                                <Info label="Network" value={nics[0]?.network_name || '—'} />
                                <Info label="VM ID" value={vm.provider_vm_id} />
                            </Card>

                            <Card title="Hardware" className="lg:col-span-2">
                                <HardwareItem icon={<Cpu />} label="CPU" value={`${vm.cpu} vCPU`} />
                                <HardwareItem icon={<MemoryStick />} label="Memory" value={`${vm.memory_mb / 1024} GB`} />
                                <HardwareItem icon={<HardDrive />} label="Disk" value={`${vm.disk_gb} GB`} />
                                <Info label="Firmware" value={hardware?.firmware} />
                                <Info label="Boot" value={hardware?.boot_type} />
                            </Card>
                        </div>

                        <Card title="Health / System">
                            <HealthItem ok={toolsOk} label="VMware Tools" />
                            <HealthItem ok={!isoMounted} label="ISO Mounted" warn />
                            <HealthItem ok={nicConnected} label="Network Connected" />
                        </Card>
                    </>
                )}

                {/* NETWORK */}
                {tab === 'network' && (
                    <Card title="Network Interfaces">
                        {nics.map(n => (
                            <Info
                                key={n.id}
                                label={`${n.label} (${n.mac_address})`}
                                value={n.network_name}
                            />
                        ))}
                    </Card>
                )}

                {/* STORAGE */}
                {tab === 'storage' && (
                    <Card title="Storage">
                        {disks.map(d => (
                            <Info
                                key={d.id}
                                label={d.label}
                                value={`${Math.round(d.capacity_bytes / 1024 / 1024 / 1024)} GB • ${d.datastore}`}
                            />
                        ))}
                    </Card>
                )}

                {/* TOOLS */}
                {tab === 'tools' && (
                    <Card title="VMware Tools">
                        <Info label="Status" value={vm.tools_status} />
                        <Info label="Version" value={vm.tools_version || '—'} />
                        <Info label="Version Status" value={vm.tools_version_status || '—'} />
                    </Card>
                )}

            </main>
        </div>
    );
}

/* ================= HELPERS ================= */

function statusColor(status) {
    switch (status) {
        case 'POWERED_ON': return 'bg-emerald-600';
        case 'POWERED_OFF': return 'bg-slate-600';
        case 'RESTARTING': return 'bg-amber-500';
        case 'SUSPENDED': return 'bg-yellow-600';
        default: return 'bg-slate-700';
    }
}

function actionColor(action) {
    switch (action) {
        case 'start': return 'bg-emerald-500';
        case 'stop': return 'bg-red-500';
        case 'restart': return 'bg-amber-500';
        case 'sync': return 'bg-sky-500';
        default: return 'bg-slate-500';
    }
}

/* ================= COMPONENTS ================= */

function ActionButton({ icon, label, onClick, disabled, color }) {
    const colors = {
        emerald: 'bg-emerald-600 hover:bg-emerald-700',
        red: 'bg-red-600 hover:bg-red-700',
        amber: 'bg-amber-500 hover:bg-amber-600',
        sky: 'bg-sky-600 hover:bg-sky-700',
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition
                ${disabled
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : `${colors[color]} text-white`
            }`}
        >
            {icon}
            {label}
        </button>
    );
}

function Card({ title, children, className = '' }) {
    return (
        <div className={`bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3 ${className}`}>
            <h3 className="text-sm font-semibold text-slate-400 uppercase">
                {title}
            </h3>
            {children}
        </div>
    );
}

function Info({ label, value }) {
    return (
        <div className="flex justify-between text-sm">
            <span className="text-slate-400">{label}</span>
            <span>{value || '—'}</span>
        </div>
    );
}

function HardwareItem({ icon, label, value }) {
    return (
        <div className="flex items-center gap-3 text-sm">
            <div className="text-slate-400">{icon}</div>
            <span className="flex-1 text-slate-400">{label}</span>
            <span>{value}</span>
        </div>
    );
}

function StatusItem({ label, value }) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded p-4">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="text-sm font-medium">{value}</p>
        </div>
    );
}

function HealthItem({ ok, label, warn }) {
    return (
        <div className="flex items-center gap-2 text-sm">
            {ok
                ? <ShieldCheck className="w-4 h-4 text-emerald-500" />
                : warn
                    ? <AlertTriangle className="w-4 h-4 text-amber-400" />
                    : <AlertTriangle className="w-4 h-4 text-red-500" />
            }
            {label}
        </div>
    );
}
