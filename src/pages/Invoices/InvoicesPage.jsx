// src/pages/Invoices/InvoicesPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Search, RefreshCcw, Plus } from "lucide-react";
import Swal from "sweetalert2";

import InvoicesApi from "../../services/invoices";
import InvoiceStatusBadge from "./InvoiceStatusBadge";
import { useAuth } from "../../context/AuthContext.jsx";

function cls(...arr) {
    return arr.filter(Boolean).join(" ");
}

export default function InvoicesPage() {
    const navigate = useNavigate();
    const { isPrivileged } = useAuth();

    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);

    // filtros
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");

    // paginação (contrato backend)
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

    const queryParams = useMemo(() => {
        const p = { page, limit };
        if (search?.trim()) p.search = search.trim();
        if (status !== "all") p.status = status;
        return p;
    }, [page, limit, search, status]);

    async function load() {
        setLoading(true);
        try {
            const res = await InvoicesApi.list(queryParams);

            // ✅ contrato: { ok, data, meta }
            setItems(Array.isArray(res?.data) ? res.data : []);
            setMeta(res?.meta || { page, limit, total: 0, pages: 1 });
        } catch (err) {
            console.error(err);
            Swal.fire("Erro", "Falha ao carregar invoices", "error");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryParams]);

    function goDetail(id) {
        navigate(`/invoices/${id}`);
    }

    function prevPage() {
        setPage((p) => Math.max(1, p - 1));
    }

    function nextPage() {
        setPage((p) => Math.min(meta.pages || 1, p + 1));
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl border border-white/10 bg-white/5">
                        <FileText className="w-5 h-5 text-sky-300" />
                    </div>
                    <div>
                        <div className="text-lg font-semibold text-slate-100">Invoices</div>
                        <div className="text-xs text-slate-400">
                            Controle financeiro, cobranças e histórico
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={load}
                        className={cls(
                            "px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold",
                            loading ? "opacity-60 cursor-not-allowed" : ""
                        )}
                        disabled={loading}
                    >
                        <span className="flex items-center gap-2">
                            <RefreshCcw size={16} />
                            Atualizar
                        </span>
                    </button>

                    {/* Novo: botão Criar Invoice controlado pela autoridade do auth/me */}
                    {isPrivileged ? (
                        <button
                            onClick={() => navigate("/invoices/new")}
                            className="ml-2 px-3 py-2 rounded-xl border border-emerald-700/40 bg-emerald-900/10 hover:bg-emerald-900/15 text-sm font-semibold text-emerald-200 flex items-center gap-2"
                            title="Criar Invoice (privileged only)"
                        >
                            <Plus size={14} />
                            Nova Invoice
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Filters */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 p-4">
                <div className="flex flex-wrap gap-3 items-center">
                    {/* Search */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/20 min-w-[260px] flex-1">
                        <Search size={16} className="text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="bg-transparent outline-none text-sm text-slate-200 w-full"
                            placeholder="Buscar por número, id, notas..."
                        />
                    </div>

                    {/* Status */}
                    <select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 rounded-xl border border-white/10 bg-black/20 text-sm text-slate-200 outline-none"
                    >
                        <option value="all">Todos status</option>
                        {/* ✅ status oficiais do backend */}
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                        <option value="canceled">Canceled</option>
                        <option value="refunded">Refunded</option>
                    </select>

                    {/* Meta */}
                    <div className="text-xs text-slate-400 ml-auto">
                        Total:{" "}
                        <span className="text-slate-200 font-semibold">{meta.total}</span>
                        {" · "}
                        Página:{" "}
                        <span className="text-slate-200 font-semibold">{meta.page}</span>/
                        {meta.pages}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 overflow-hidden">
                <div className="overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-black/20">
                        <tr className="text-left text-xs text-slate-400">
                            <th className="px-4 py-3">ID</th>
                            <th className="px-4 py-3">Número</th>
                            <th className="px-4 py-3">Cliente</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Total</th>
                            <th className="px-4 py-3">Vencimento</th>
                            <th className="px-4 py-3">Emissão</th>
                            <th className="px-4 py-3">Criado</th>
                            <th className="px-4 py-3 text-right">Ações</th>
                        </tr>
                        </thead>

                        <tbody>
                        {loading ? (
                            <tr>
                                <td className="px-4 py-6 text-slate-400" colSpan={9}>
                                    Carregando...
                                </td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td className="px-4 py-6 text-slate-400" colSpan={9}>
                                    Nenhuma invoice encontrada.
                                </td>
                            </tr>
                        ) : (
                            items.map((inv) => (
                                <tr
                                    key={inv.id}
                                    className="border-t border-white/5 hover:bg-white/5 cursor-pointer"
                                    onClick={() => goDetail(inv.id)}
                                >
                                    <td className="px-4 py-3 font-mono text-slate-200">
                                        {inv.id}
                                    </td>

                                    <td className="px-4 py-3 text-slate-200 font-semibold">
                                        {inv.number || "—"}
                                    </td>

                                    {/* ✅ Cliente */}
                                    <td className="px-4 py-3">
                                        <div className="min-w-0">
                                            <div className="text-slate-200 font-semibold truncate max-w-[360px]">
                                                {inv.customer?.name || `Owner #${inv.owner_id}`}
                                            </div>
                                            <div className="text-xs text-slate-500 truncate max-w-[360px]">
                                                {inv.customer?.email || "—"}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3">
                                        <InvoiceStatusBadge status={inv.status} />
                                    </td>

                                    <td className="px-4 py-3 text-slate-200 font-semibold">
                                        {inv.total} {inv.currency}
                                    </td>

                                    <td className="px-4 py-3 text-slate-300">
                                        {inv.due_at ? new Date(inv.due_at).toLocaleDateString() : "—"}
                                    </td>

                                    <td className="px-4 py-3 text-slate-300">
                                        {inv.issued_at ? new Date(inv.issued_at).toLocaleDateString() : "—"}
                                    </td>

                                    <td className="px-4 py-3 text-slate-500">
                                        {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "—"}
                                    </td>

                                    {/* ✅ botão dentro de TD (HTML válido) */}
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            className="text-sky-300 hover:underline"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                goDetail(inv.id);
                                            }}
                                        >
                                            Ver
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-black/10">
                    <button
                        onClick={prevPage}
                        disabled={page <= 1 || loading}
                        className={cls(
                            "px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold",
                            page <= 1 || loading ? "opacity-50 cursor-not-allowed" : ""
                        )}
                    >
                        Anterior
                    </button>

                    <div className="text-xs text-slate-400">
                        Página{" "}
                        <span className="text-slate-200 font-semibold">{meta.page}</span> de{" "}
                        <span className="text-slate-200 font-semibold">{meta.pages}</span>
                    </div>

                    <button
                        onClick={nextPage}
                        disabled={page >= meta.pages || loading}
                        className={cls(
                            "px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold",
                            page >= meta.pages || loading ? "opacity-50 cursor-not-allowed" : ""
                        )}
                    >
                        Próxima
                    </button>
                </div>
            </div>
        </div>
    );
}
