// src/pages/vm/VmCreate.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services";
import useUsersSimple from "../../hooks/useUsersSimple";

// Ícones (heavy UI)
import {
    ArrowLeft,
    Server,
    Boxes,
    Cpu,
    MemoryStick,
    HardDrive,
    User,
    Network,
    Layers3,
    CheckCircle2,
    AlertTriangle,
    Loader2,
} from "lucide-react";

// ⚠️ Você já usa isso no arquivo atual (mantive).
// Se o caminho do hook for outro no teu projeto, ajusta aqui.
import useTaskProgress from "../../hooks/useTaskProgress";

// ⚠️ Você já usa isso no arquivo atual (mantive).
// Se o componente for outro caminho/nome, ajusta aqui.
import GlobalLoader from "../../components/GlobalLoader";

function cls(...arr) {
    return arr.filter(Boolean).join(" ");
}

function Section({ title, icon, subtitle, children, right }) {
    return (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="flex items-start justify-between gap-4 p-4 border-b border-slate-800 bg-slate-950/30">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl border border-slate-800 bg-slate-950/60">
                        {icon}
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-slate-100">{title}</div>
                        {subtitle ? (
                            <div className="text-xs text-slate-400 mt-1">{subtitle}</div>
                        ) : null}
                    </div>
                </div>
                {right}
            </div>
            <div className="p-4">{children}</div>
        </div>
    );
}

function Field({ label, hint, children }) {
    return (
        <div>
            <div className="flex items-end justify-between">
                <label className="text-sm text-slate-300">{label}</label>
                {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
            </div>
            <div className="mt-2">{children}</div>
        </div>
    );
}

function Input({ value, onChange, placeholder, type = "text", disabled }) {
    return (
        <input
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            type={type}
            disabled={disabled}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-600/40"
        />
    );
}

function Select({ value, onChange, disabled, children }) {
    return (
        <select
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-600/40"
        >
            {children}
        </select>
    );
}

function SummaryRow({ label, value, tone = "zinc" }) {
    const toneMap = {
        zinc: "text-slate-200",
        emerald: "text-emerald-200",
        orange: "text-orange-200",
        red: "text-red-200",
        sky: "text-sky-200",
    };

    return (
        <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">{label}</span>
            <span className={cls("font-medium", toneMap[tone] || toneMap.zinc)}>
        {value ?? "—"}
      </span>
        </div>
    );
}

export default function VmCreatePage() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));

    const isPrivileged = ["root", "admin", "support"].includes(user?.role);
    const canPickOwner = ["root", "admin"].includes(user?.role);

    const { users } = useUsersSimple(canPickOwner);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [optionsLoading, setOptionsLoading] = useState(true);
    const [templates, setTemplates] = useState([]);
    const [hosts, setHosts] = useState([]);

    const defaultCluster = "";
    const defaultHost = "";

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
        name: "",
        hostname: "",
        template_id: "",
        cluster_id: "",
        host_id: "",
        cpu: 2,
        memory_mb: 2048,
        disk_gb: 40,
        owner_id: user?.id || "",
    });

    function update(field, value) {
        setForm((prev) => ({
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
        setForm((prev) => ({
            ...prev,
            name: base,
            hostname: base,
        }));
    }, []);

    // ✅ LOAD HOSTS/OPTIONS
    useEffect(() => {
        if (!isPrivileged) return;

        async function loadOptions() {
            try {
                setOptionsLoading(true);
                setError("");

                // ⚠️ teu arquivo atual usa /vm/create/options
                const { data } = await api.get("/vm/create/options");

                const hsts = data?.hosts || [];
                setHosts(hsts);

                // cluster default (visual)
                const clusterList = [...new Set(hsts.map((h) => h.cluster_name).filter(Boolean))].sort();
                const clusterDefault = clusterList[0] || defaultCluster;

                // host default
                const hostsCluster = hsts
                    .filter((h) => h.cluster_name === clusterDefault && h.status === "active")
                    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

                const hostDefault = hostsCluster[0]?.provider_host_id || defaultHost;

                // templates do host default
                const tpls = await loadTemplates(hostDefault);
                setTemplates(tpls);

                setForm((prev) => ({
                    ...prev,
                    cluster_id: clusterDefault,
                    host_id: hostDefault,
                    template_id: tpls[0]?.id || "",
                }));
            } catch (e) {
                setError(e.response?.data?.error || "Erro ao carregar opções");
            } finally {
                setOptionsLoading(false);
            }
        }

        loadOptions();
    }, [isPrivileged]);

    // ✅ CLUSTERS (visual)
    const clusters = useMemo(() => {
        return [...new Set(hosts.map((h) => h.cluster_name).filter(Boolean))].sort();
    }, [hosts]);

    const hostsByCluster = useMemo(() => {
        if (!form.cluster_id) return [];
        return hosts
            .filter((h) => h.cluster_name === form.cluster_id && h.status === "active")
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }, [hosts, form.cluster_id]);

    // ✅ AO TROCAR CLUSTER → TROCA HOST
    async function updateCluster(clusterId) {
        const filteredHosts = hosts
            .filter((h) => h.cluster_name === clusterId && h.status === "active")
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        const nextHost = filteredHosts[0]?.provider_host_id || "";

        const tpls = await loadTemplates(nextHost);
        setTemplates(tpls);

        setForm((prev) => ({
            ...prev,
            cluster_id: clusterId,
            host_id: nextHost,
            template_id: tpls[0]?.id || "",
        }));
    }

    // ✅ AO TROCAR HOST → BUSCA TEMPLATES DO HOST
    async function updateHost(hostId) {
        update("host_id", hostId);

        const tpls = await loadTemplates(hostId);
        setTemplates(tpls);

        setForm((prev) => ({
            ...prev,
            template_id: tpls[0]?.id || "",
        }));
    }

    function validate() {
        if (!form.host_id) return "Host é obrigatório";
        if (!form.template_id) return "Template é obrigatório";
        if (!form.name) return "Nome é obrigatório";
        if (!form.hostname) return "Hostname é obrigatório";
        if (!form.cpu || Number(form.cpu) < 1) return "CPU inválida";
        if (!form.memory_mb || Number(form.memory_mb) < 256) return "Memória inválida";
        if (!form.disk_gb || Number(form.disk_gb) < 10) return "Disco inválido";
        if (!form.owner_id) return "Dono é obrigatório";
        return "";
    }

    async function submit() {
        setError("");

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

                // ⚠️ Contrato do swagger diz que owner_id não deveria vir no body.
                // Mas teu fluxo atual usa e tá funcionando, então NÃO vou quebrar.
                owner_id: Number(form.owner_id),
            };

            const { data } = await api.post("/vm/create", payload);

            // backend pode devolver vm.id
            if (data?.vm?.id) {
                navigate(`/vm/${data.vm.id}`);
            } else {
                navigate("/vms");
            }
        } catch (e) {
            setError(e.response?.data?.error || "Erro ao criar VM");
        } finally {
            setLoading(false);
        }
    }

    // --- Preview / Summary ---
    const selectedHost = useMemo(() => {
        return hostsByCluster.find((h) => String(h.provider_host_id) === String(form.host_id)) || null;
    }, [hostsByCluster, form.host_id]);

    const selectedTemplate = useMemo(() => {
        return templates.find((t) => String(t.id) === String(form.template_id)) || null;
    }, [templates, form.template_id]);

    const validationError = useMemo(() => validate(), [form, hostsByCluster, templates]);

    if (!isPrivileged) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-lg font-semibold">Sem permissão</h2>
                <p className="text-slate-400 mt-2">
                    Apenas root/admin/suporte podem criar VMs.
                </p>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Background pesado (padrão InventoryPage) */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950 to-black" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(16,185,129,0.08),transparent_55%)]" />
            </div>

            <div className="p-6 space-y-5">
                {/* Header / Action bar */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="text-xs text-slate-500">VMs / Criar</div>
                        <h1 className="text-2xl font-semibold text-slate-100">Provisionar Nova VM</h1>
                        <div className="text-sm text-slate-400 mt-1">
                            Clone de template via vCenter. Operação registrada como task.
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <GlobalLoader
                            visible={showLoader}
                            title="Criando VM"
                            subtitle="Clonando template no vCenter…"
                            progress={task.total ? Math.round((task.completed / task.total) * 100) : 0}
                            status={task.status}
                        />

                        <button
                            onClick={() => navigate("/vms")}
                            className="px-4 py-2 rounded-xl bg-slate-900/70 border border-slate-800 hover:bg-white/5 transition font-medium flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Voltar
                        </button>

                        <button
                            onClick={submit}
                            disabled={loading || optionsLoading || !!validationError}
                            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 transition font-semibold disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Criar VM
                        </button>
                    </div>
                </div>

                {/* Alert erro */}
                {error && (
                    <div className="bg-red-950/40 border border-red-800 text-red-200 p-4 rounded-2xl flex items-start gap-3">
                        <div className="p-2 rounded-xl border border-red-800/60 bg-red-950/40">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold">Erro</div>
                            <div className="text-sm text-red-200/90 mt-1">{error}</div>
                        </div>
                    </div>
                )}

                {/* Grid principal */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                    {/* LEFT: Form */}
                    <div className="xl:col-span-8 space-y-4">
                        <Section
                            title="Identidade"
                            subtitle="Nome e hostname do guest. Isso vira contrato operacional."
                            icon={<Layers3 className="w-5 h-5 text-sky-300" />}
                            right={
                                <div className="text-xs text-slate-500">
                                    {optionsLoading ? "Carregando opções..." : "Pronto"}
                                </div>
                            }
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Nome" hint="único por cluster">
                                    <Input
                                        value={form.name}
                                        onChange={(e) => update("name", e.target.value)}
                                        placeholder="vm-xxx"
                                    />
                                </Field>

                                <Field label="Hostname" hint="DNS/guest">
                                    <Input
                                        value={form.hostname}
                                        onChange={(e) => update("hostname", e.target.value)}
                                        placeholder="vm-xxx"
                                    />
                                </Field>
                            </div>
                        </Section>

                        <Section
                            title="Destino"
                            subtitle="Cluster → Host define o target do clone."
                            icon={<Server className="w-5 h-5 text-cyan-300" />}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Cluster" hint="visual / backend valida">
                                    {optionsLoading ? (
                                        <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-500">
                                            Carregando clusters...
                                        </div>
                                    ) : (
                                        <Select
                                            value={form.cluster_id}
                                            onChange={(e) => updateCluster(e.target.value)}
                                        >
                                            <option value="">Selecione...</option>
                                            {clusters.map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                        </Select>
                                    )}
                                </Field>

                                <Field label="Host" hint="ativo no cluster">
                                    {!form.cluster_id ? (
                                        <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-500">
                                            Selecione um cluster primeiro
                                        </div>
                                    ) : optionsLoading ? (
                                        <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-500">
                                            Carregando hosts...
                                        </div>
                                    ) : (
                                        <Select
                                            value={form.host_id}
                                            onChange={(e) => updateHost(e.target.value)}
                                        >
                                            <option value="">Selecione...</option>
                                            {hostsByCluster.map((h) => (
                                                <option key={h.provider_host_id} value={h.provider_host_id}>
                                                    {h.name} • {h.location} • {h.host_ip}
                                                </option>
                                            ))}
                                        </Select>
                                    )}
                                </Field>
                            </div>

                            {selectedHost ? (
                                <div className="mt-4 p-3 rounded-2xl border border-slate-800 bg-slate-950/40 text-xs text-slate-300">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500">Host selecionado</span>
                                        <span className="text-slate-200 font-medium">{selectedHost.name}</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                                        <SummaryRow label="IP" value={selectedHost.host_ip || "—"} tone="sky" />
                                        <SummaryRow label="Location" value={selectedHost.location || "—"} />
                                        <SummaryRow label="Provider Host ID" value={selectedHost.provider_host_id || "—"} />
                                    </div>
                                </div>
                            ) : null}
                        </Section>

                        <Section
                            title="Template"
                            subtitle="O clone nasce daqui. Template muda de acordo com o host."
                            icon={<Boxes className="w-5 h-5 text-emerald-300" />}
                        >
                            <Field label="Template (por host)" hint="os / cluster / nome">
                                {optionsLoading ? (
                                    <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-500">
                                        Carregando templates...
                                    </div>
                                ) : (
                                    <Select
                                        value={form.template_id}
                                        onChange={(e) => update("template_id", e.target.value)}
                                        disabled={!form.host_id}
                                    >
                                        <option value="">Selecione...</option>
                                        {templates.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name} • {t.os} • {t.cluster_name}
                                            </option>
                                        ))}
                                    </Select>
                                )}
                            </Field>

                            {selectedTemplate ? (
                                <div className="mt-4 p-3 rounded-2xl border border-slate-800 bg-slate-950/40 text-xs text-slate-300">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500">Template selecionado</span>
                                        <span className="text-slate-200 font-medium">{selectedTemplate.name}</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                                        <SummaryRow label="OS" value={selectedTemplate.os || "—"} />
                                        <SummaryRow label="Cluster" value={selectedTemplate.cluster_name || "—"} />
                                        <SummaryRow label="Template ID" value={selectedTemplate.id || "—"} tone="emerald" />
                                    </div>
                                </div>
                            ) : null}
                        </Section>

                        <Section
                            title="Recursos"
                            subtitle="CPU/Memória/Disco. O clone pode ajustar pós-template."
                            icon={<Cpu className="w-5 h-5 text-orange-300" />}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Field label="CPU" hint="vCPU">
                                    <Input
                                        type="number"
                                        value={form.cpu}
                                        onChange={(e) => update("cpu", e.target.value)}
                                        placeholder="2"
                                    />
                                </Field>

                                <Field label="Memória (MB)" hint="mín 256">
                                    <Input
                                        type="number"
                                        value={form.memory_mb}
                                        onChange={(e) => update("memory_mb", e.target.value)}
                                        placeholder="2048"
                                    />
                                </Field>

                                <Field label="Disco (GB)" hint="mín 10">
                                    <Input
                                        type="number"
                                        value={form.disk_gb}
                                        onChange={(e) => update("disk_gb", e.target.value)}
                                        placeholder="40"
                                    />
                                </Field>
                            </div>
                        </Section>

                        <Section
                            title="Proprietário"
                            subtitle="Regra: subconta vive no owner do pai. Root/Admin pode escolher."
                            icon={<User className="w-5 h-5 text-slate-300" />}
                        >
                            <Field label="Dono" hint={canPickOwner ? "selecionável" : "fixo"}>
                                {canPickOwner ? (
                                    <Select
                                        value={form.owner_id}
                                        onChange={(e) => update("owner_id", e.target.value)}
                                    >
                                        <option value="">Selecione...</option>
                                        {users.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.name} ({u.role})
                                            </option>
                                        ))}
                                    </Select>
                                ) : (
                                    <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300">
                                        {user?.name} (ID {user?.id})
                                    </div>
                                )}
                            </Field>
                        </Section>
                    </div>

                    {/* RIGHT: Summary / Validation */}
                    <div className="xl:col-span-4 space-y-4">
                        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-slate-800 bg-slate-950/30">
                                <div className="text-sm font-semibold text-slate-100">Resumo do Provisionamento</div>
                                <div className="text-xs text-slate-400 mt-1">
                                    O que vai ser enviado pro backend (contrato).
                                </div>
                            </div>

                            <div className="p-4 space-y-3">
                                <SummaryRow label="Nome" value={form.name || "—"} tone="sky" />
                                <SummaryRow label="Hostname" value={form.hostname || "—"} />
                                <SummaryRow label="Cluster" value={form.cluster_id || "—"} />
                                <SummaryRow label="Host" value={form.host_id || "—"} />
                                <SummaryRow label="Template" value={selectedTemplate?.name || form.template_id || "—"} />
                                <div className="my-3 border-t border-slate-800" />
                                <SummaryRow label="CPU" value={`${form.cpu || 0} vCPU`} tone="orange" />
                                <SummaryRow label="Memória" value={`${form.memory_mb || 0} MB`} tone="orange" />
                                <SummaryRow label="Disco" value={`${form.disk_gb || 0} GB`} tone="orange" />
                                <div className="my-3 border-t border-slate-800" />
                                <SummaryRow label="Owner" value={form.owner_id || "—"} />
                            </div>

                            <div className="p-4 border-t border-slate-800 bg-slate-950/30">
                                {validationError ? (
                                    <div className="flex items-start gap-3 text-xs text-orange-200">
                                        <div className="p-2 rounded-xl border border-orange-500/25 bg-orange-500/10">
                                            <AlertTriangle className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-semibold">Pendência</div>
                                            <div className="text-orange-200/90 mt-1">{validationError}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-3 text-xs text-emerald-200">
                                        <div className="p-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-semibold">Pronto para criar</div>
                                            <div className="text-emerald-200/90 mt-1">
                                                Campos obrigatórios preenchidos.
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Card de contexto: endpoint + regra */}
                        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
                            <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                                <Network className="w-4 h-4 text-sky-300" />
                                Contrato de API
                            </div>

                            <div className="text-xs text-slate-400 mt-2 space-y-2">
                                <div>
                                    <span className="text-slate-500">GET options:</span>{" "}
                                    <span className="text-slate-200">/vm/create/options</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">GET templates:</span>{" "}
                                    <span className="text-slate-200">/vm/templates?host_id=</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">POST create:</span>{" "}
                                    <span className="text-slate-200">/vm/create</span>
                                </div>
                                <div className="pt-2 text-[11px] text-slate-500">
                                    ⚠️ owner_id no body será removido quando backend fechar o contrato.
                                </div>
                            </div>
                        </div>

                        {/* Quick actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate("/vms")}
                                className="flex-1 px-4 py-2 rounded-xl bg-slate-900/70 border border-slate-800 hover:bg-white/5 transition font-medium"
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={submit}
                                disabled={loading || optionsLoading || !!validationError}
                                className="flex-1 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                Criar VM
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
