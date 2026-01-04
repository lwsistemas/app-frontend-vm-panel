import React, { useEffect, useState } from "react";
import { FileText, Search } from "lucide-react";
import Swal from "sweetalert2";

import { listInvoices } from "../../services/invoices";
import InvoiceStatusBadge from "./InvoiceStatusBadge";
import InvoiceActions from "./components/InvoiceActions.jsx";

export default function InvoicesPage() {
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({ page: 1, limit: 25, total: 0 });

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");

    // debounce simples
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    async function load(page = 1) {
        setLoading(true);
        try {
            const res = await listInvoices({
                page,
                limit: meta.limit,
                search: debouncedSearch,
                status,
            });

            setRows(res.data || []);
            setMeta(res.pagination || { ...meta, page });
        } catch (err) {
            console.error(err);
            Swal.fire("Erro", "Erro ao carregar invoices", "error");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load(1);
        // eslint-disable-next-line
    }, [debouncedSearch, status]);

    return (
        <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <FileText size={18} />
                </div>
                <div>
                    <h1 className="text-lg font-semibold">Invoices</h1>
                    <p className="text-xs text-slate-400">
                        Controle financeiro • faturas emitidas
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap items-center">
                <div className="relative">
                    <Search
                        className="absolute left-3 top-2.5 text-slate-400"
                        size={14}
                    />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar invoice..."
                        className="pl-8 pr-3 py-2 text-sm rounded-xl bg-black/30 border border-white/10"
                    />
                </div>

                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="py-2 px-3 text-sm rounded-xl bg-black/30 border border-white/10"
                >
                    <option value="">Todos status</option>
                    <option value="pending">Em aberto</option>
                    <option value="paid">Paga</option>
                    <option value="overdue">Vencida</option>
                    <option value="canceled">Cancelada</option>
                    <option value="refunded">Refund</option>
                    <option value="draft">Draft</option>
                </select>

                {/* Pagination */}
                <div className="ml-auto flex items-center gap-2">
                    <button
                        onClick={() => load(Math.max(meta.page - 1, 1))}
                        className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
                        disabled={loading || meta.page <= 1}
                    >
                        Prev
                    </button>

                    <span className="text-xs text-slate-400">
            Page <span className="text-slate-200">{meta.page}</span>
                        {" • "}
                        Total <span className="text-slate-200">{meta.total}</span>
          </span>

                    <button
                        onClick={() => load(meta.page + 1)}
                        className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
                        disabled={loading}
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="text-xs text-slate-400 bg-black/20">
                    <tr>
                        <th className="px-4 py-2 text-left">Número</th>
                        <th className="px-4 py-2 text-left">Cliente</th>
                        <th className="px-4 py-2 text-left">Valor</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Vencimento</th>
                        <th className="px-4 py-2 text-right">Ações</th>
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-white/5">
                    {loading ? (
                        <tr>
                            <td colSpan={6} className="px-4 py-6 text-slate-400">
                                Carregando...
                            </td>
                        </tr>
                    ) : rows.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-4 py-6 text-slate-400">
                                Nenhuma invoice encontrada
                            </td>
                        </tr>
                    ) : (
                        rows.map((inv) => (
                            <tr key={inv.id} className="hover:bg-white/5">
                                <td className="px-4 py-3 font-mono">
                                    {inv.number || `#${inv.id}`}
                                </td>
                                <td className="px-4 py-3">{inv.owner_name || "-"}</td>
                                <td className="px-4 py-3 font-mono">
                                    {inv.currency} {inv.total}
                                </td>
                                <td className="px-4 py-3">
                                    <InvoiceStatusBadge status={inv.status} />
                                </td>
                                <td className="px-4 py-3 font-mono">
                                    {inv.due_at ? String(inv.due_at).slice(0, 10) : "-"}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <InvoiceActions invoice={inv} onRefresh={() => load(meta.page)} />
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
