// src/pages/Invoices/PlansPage.jsx
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Plus, RefreshCcw, Pencil, Power } from "lucide-react";

import PlansApi from "../../services/plans.jsx"; // ✅ service global
import PlanModal from "./components/PlanModal.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

function cls(...arr) {
    return arr.filter(Boolean).join(" ");
}

export default function PlansPage() {
    const { isPrivileged } = useAuth();

    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({ page: 1, limit: 50, total: 0, pages: 0 });

    // filtros
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [type, setType] = useState("");
    const [billingType, setBillingType] = useState("");

    // modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create"); // create|edit
    const [editing, setEditing] = useState(null);

    async function load(page = 1) {
        setLoading(true);
        try {
            const res = await PlansApi.list({
                page,
                limit: meta.limit,
                search: search || undefined,
                status: status || undefined,
                type: type || undefined,
                billing_type: billingType || undefined,
            });

            setRows(res?.data || []);
            setMeta(res?.meta || { page: 1, limit: 50, total: 0, pages: 0 });
        } catch (err) {
            console.error(err);
            Swal.fire("Erro", "Falha ao carregar planos", "error");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function openCreate() {
        setEditing(null);
        setModalMode("create");
        setModalOpen(true);
    }

    function openEdit(plan) {
        setEditing(plan);
        setModalMode("edit");
        setModalOpen(true);
    }

    async function submit(payload) {
        try {
            if (modalMode === "edit" && editing?.id) {
                await PlansApi.update(editing.id, payload);
                Swal.fire("OK", "Plano atualizado", "success");
            } else {
                await PlansApi.create(payload);
                Swal.fire("OK", "Plano criado", "success");
            }

            setModalOpen(false);
            setEditing(null);
            await load(meta.page || 1);
        } catch (err) {
            console.error(err);

            const msg =
                err?.response?.data?.error?.message ||
                err?.response?.data?.message ||
                "Falha ao salvar plano";

            Swal.fire("Erro", msg, "error");
        }
    }

    async function toggleStatus(plan) {
        const next = plan.status === "active" ? "inactive" : "active";

        const ok = await Swal.fire({
            title: `Mudar status para ${next}?`,
            text: `${plan.code} (${plan.name})`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Confirmar",
            cancelButtonText: "Cancelar",
        });

        if (!ok.isConfirmed) return;

        try {
            await PlansApi.setStatus(plan.id, next);
            Swal.fire("OK", "Status atualizado", "success");
            await load(meta.page || 1);
        } catch (err) {
            console.error(err);
            Swal.fire("Erro", "Falha ao atualizar status", "error");
        }
    }

    function applyFilters() {
        load(1);
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                    <div className="text-lg font-semibold text-slate-100 truncate">Plans</div>
                    <div className="text-xs text-slate-400 mt-1">
                        Catálogo global de planos/serviços faturáveis.
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => load(meta.page || 1)}
                        className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold"
                        title="Atualizar"
                    >
                        <span className="inline-flex items-center gap-2">
                            <RefreshCcw size={16} />
                            Atualizar
                        </span>
                    </button>

                    {/* ✅ BOTÃO CRIAR PLANO */}
                    {isPrivileged ? (
                        <button
                            onClick={openCreate}
                            className="px-3 py-2 rounded-xl border border-emerald-700/40 bg-emerald-900/10 hover:bg-emerald-900/15 text-sm font-semibold text-emerald-200"
                            title="Criar Plano"
                        >
                            <span className="inline-flex items-center gap-2">
                                <Plus size={16} />
                                Criar Plano
                            </span>
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Filters */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-slate-100 text-sm"
                        placeholder="search: code ou name"
                    />

                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-slate-100 text-sm"
                    >
                        <option value="">status: all</option>
                        <option value="active">active</option>
                        <option value="inactive">inactive</option>
                    </select>

                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-slate-100 text-sm"
                    >
                        <option value="">type: all</option>
                        <option value="manual">manual</option>
                        <option value="vm">vm</option>
                        <option value="ip">ip</option>
                        <option value="storage">storage</option>
                        <option value="license">license</option>
                        <option value="addon">addon</option>
                    </select>

                    <select
                        value={billingType}
                        onChange={(e) => setBillingType(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-slate-100 text-sm"
                    >
                        <option value="">billing: all</option>
                        <option value="one_time">one_time</option>
                        <option value="recurring">recurring</option>
                    </select>

                    <button
                        onClick={applyFilters}
                        className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold"
                    >
                        Aplicar
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-100">
                        Results <span className="text-xs text-slate-400 font-normal">({meta.total || 0})</span>
                    </div>

                    <div className="text-xs text-slate-400">
                        Page {meta.page || 1} / {meta.pages || 1}
                    </div>
                </div>

                <div className="overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-black/20">
                        <tr className="text-left text-xs text-slate-400">
                            <th className="px-4 py-3">Code</th>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Billing</th>
                            <th className="px-4 py-3">Price</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                        </thead>

                        <tbody>
                        {loading ? (
                            <tr>
                                <td className="px-4 py-6 text-slate-400" colSpan={7}>
                                    Carregando...
                                </td>
                            </tr>
                        ) : rows.length === 0 ? (
                            <tr>
                                <td className="px-4 py-6 text-slate-400" colSpan={7}>
                                    Nenhum plano encontrado.
                                </td>
                            </tr>
                        ) : (
                            rows.map((p) => (
                                <tr key={p.id} className="border-t border-white/5">
                                    <td className="px-4 py-3 font-mono text-slate-200">{p.code}</td>
                                    <td className="px-4 py-3 text-slate-100 font-semibold">{p.name}</td>
                                    <td className="px-4 py-3 text-slate-300">{p.type}</td>
                                    <td className="px-4 py-3 text-slate-300">
                                        {p.billing_type}
                                        {p.billing_type === "recurring" && p.interval ? (
                                            <span className="text-slate-500"> · {p.interval}</span>
                                        ) : null}
                                    </td>
                                    <td className="px-4 py-3 text-slate-200 font-semibold">
                                        {p.default_price} <span className="text-slate-500">{p.currency}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                            <span
                                                className={cls(
                                                    "px-2 py-1 rounded-lg text-xs font-semibold border",
                                                    p.status === "active"
                                                        ? "border-emerald-700/40 bg-emerald-900/10 text-emerald-200"
                                                        : "border-white/10 bg-white/5 text-slate-400"
                                                )}
                                            >
                                                {p.status}
                                            </span>
                                    </td>

                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2 justify-end">
                                            {isPrivileged ? (
                                                <>
                                                    <button
                                                        onClick={() => openEdit(p)}
                                                        className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200"
                                                        title="Editar"
                                                    >
                                                            <span className="inline-flex items-center gap-2">
                                                                <Pencil size={14} />
                                                                Editar
                                                            </span>
                                                    </button>

                                                    <button
                                                        onClick={() => toggleStatus(p)}
                                                        className={cls(
                                                            "px-3 py-2 rounded-xl border text-xs font-semibold",
                                                            p.status === "active"
                                                                ? "border-amber-700/40 bg-amber-900/10 hover:bg-amber-900/15 text-amber-200"
                                                                : "border-emerald-700/40 bg-emerald-900/10 hover:bg-emerald-900/15 text-emerald-200"
                                                        )}
                                                        title="Ativar/Inativar"
                                                    >
                                                            <span className="inline-flex items-center gap-2">
                                                                <Power size={14} />
                                                                {p.status === "active" ? "Inativar" : "Ativar"}
                                                            </span>
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-xs text-slate-500">—</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                        Total: <span className="text-slate-300 font-semibold">{meta.total || 0}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => load(Math.max(1, (meta.page || 1) - 1))}
                            disabled={(meta.page || 1) <= 1}
                            className={cls(
                                "px-3 py-2 rounded-xl border text-sm font-semibold",
                                (meta.page || 1) <= 1
                                    ? "border-white/10 bg-white/5 text-slate-600 opacity-60 cursor-not-allowed"
                                    : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-200"
                            )}
                        >
                            Prev
                        </button>

                        <button
                            onClick={() => load(Math.min(meta.pages || 1, (meta.page || 1) + 1))}
                            disabled={(meta.page || 1) >= (meta.pages || 1)}
                            className={cls(
                                "px-3 py-2 rounded-xl border text-sm font-semibold",
                                (meta.page || 1) >= (meta.pages || 1)
                                    ? "border-white/10 bg-white/5 text-slate-600 opacity-60 cursor-not-allowed"
                                    : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-200"
                            )}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            <PlanModal
                open={modalOpen}
                mode={modalMode}
                initial={editing}
                onClose={() => {
                    setModalOpen(false);
                    setEditing(null);
                }}
                onSubmit={submit}
            />
        </div>
    );
}
