import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { ArrowLeft, RefreshCw, CreditCard, ReceiptText, ListChecks } from "lucide-react";

import { getInvoice } from "../../services/invoices";
import InvoiceStatusBadge from "./InvoiceStatusBadge";

// ✅ NOVO: actions + modal payment
import InvoiceActions from "./components/InvoiceActions";

function cls(...arr) {
    return arr.filter(Boolean).join(" ");
}

function money(currency, value) {
    if (value === null || value === undefined) return `${currency} 0`;
    return `${currency} ${Number(value).toFixed(2)}`;
}

function dateOnly(iso) {
    if (!iso) return "-";
    return String(iso).slice(0, 10);
}

export default function InvoiceDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [invoice, setInvoice] = useState(null);

    async function load() {
        setLoading(true);
        try {
            const res = await getInvoice().get(id);
            setInvoice(res.data);
        } catch (err) {
            console.error(err);
            Swal.fire("Erro", "Invoice não encontrada", "error");
            navigate("/invoices");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line
    }, [id]);

    const payments = useMemo(() => {
        // swagger: pode vir invoice.payments ou ser buscado separado
        const arr = invoice?.payments || invoice?.invoice_payments || [];
        return Array.isArray(arr) ? arr : [];
    }, [invoice]);

    const items = useMemo(() => {
        const arr = invoice?.items || invoice?.invoice_items || [];
        return Array.isArray(arr) ? arr : [];
    }, [invoice]);

    const paidTotal = useMemo(() => {
        return payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    }, [payments]);

    const remaining = useMemo(() => {
        const total = Number(invoice?.total || 0);
        return Math.max(total - paidTotal, 0);
    }, [invoice, paidTotal]);

    if (loading) {
        return <div className="p-6 text-slate-400">Carregando invoice...</div>;
    }

    if (!invoice) return null;

    return (
        <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate("/invoices")}
                        className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center"
                        title="Voltar"
                    >
                        <ArrowLeft size={16} />
                    </button>

                    <div>
                        <div className="text-lg font-semibold text-slate-100">
                            Invoice {invoice.number || `#${invoice.id}`}
                        </div>
                        <div className="text-xs text-slate-400">
                            Detalhe da fatura · ID {invoice.id}
                        </div>
                    </div>

                    <div className="ml-2">
                        <InvoiceStatusBadge status={invoice.status} />
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                    {/* ✅ Actions oficiais */}
                    <InvoiceActions invoice={invoice} onRefresh={load} />

                    <button
                        onClick={load}
                        className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm flex items-center gap-2"
                        title="Atualizar"
                    >
                        <RefreshCw size={16} />
                        Atualizar
                    </button>
                </div>
            </div>

            {/* KPI STRIP */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-slate-400">Total</div>
                    <div className="mt-2 text-2xl font-semibold text-slate-100">
                        {money(invoice.currency, invoice.total)}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                        Emitida: <span className="text-slate-300 font-mono">{dateOnly(invoice.issued_at)}</span>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-slate-400">Pago</div>
                    <div className="mt-2 text-2xl font-semibold text-emerald-200">
                        {money(invoice.currency, paidTotal)}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                        Pagamentos: <span className="text-slate-300">{payments.length}</span>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-slate-400">Restante</div>
                    <div className={cls("mt-2 text-2xl font-semibold", remaining > 0 ? "text-orange-200" : "text-slate-100")}>
                        {money(invoice.currency, remaining)}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                        Vencimento: <span className="text-slate-300 font-mono">{dateOnly(invoice.due_at)}</span>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* LEFT */}
                <div className="xl:col-span-2 space-y-4">
                    {/* CLIENT / META */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-slate-200">
                            <ReceiptText size={18} className="text-slate-300" />
                            <span className="text-sm font-semibold">Dados</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                                <div className="text-xs text-slate-400">Cliente</div>
                                <div className="text-slate-100">{invoice.owner_name || "-"}</div>
                            </div>

                            <div>
                                <div className="text-xs text-slate-400">Moeda</div>
                                <div className="text-slate-100 font-mono">{invoice.currency || "-"}</div>
                            </div>

                            <div>
                                <div className="text-xs text-slate-400">Emitida</div>
                                <div className="text-slate-100 font-mono">{dateOnly(invoice.issued_at)}</div>
                            </div>

                            <div>
                                <div className="text-xs text-slate-400">Vencimento</div>
                                <div className="text-slate-100 font-mono">{dateOnly(invoice.due_at)}</div>
                            </div>
                        </div>
                    </div>

                    {/* ITEMS */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center gap-2 text-slate-200 mb-3">
                            <ListChecks size={18} className="text-slate-300" />
                            <span className="text-sm font-semibold">Items</span>
                            <span className="text-xs text-slate-500 ml-2">({items.length})</span>
                        </div>

                        {items.length === 0 ? (
                            <div className="text-xs text-slate-500">Sem items.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-slate-400">
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-2 pr-3">Descrição</th>
                                        <th className="text-right py-2 pr-3">Qtd</th>
                                        <th className="text-right py-2 pr-3">Preço</th>
                                        <th className="text-right py-2">Total</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {items.map((it) => (
                                        <tr key={it.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                            <td className="py-3 pr-3 text-slate-100">
                                                {it.description || it.name || "-"}
                                                {it.sku ? (
                                                    <div className="text-xs text-slate-500 font-mono mt-1">{it.sku}</div>
                                                ) : null}
                                            </td>
                                            <td className="py-3 pr-3 text-right text-slate-300 font-mono">
                                                {Number(it.qty || it.quantity || 1)}
                                            </td>
                                            <td className="py-3 pr-3 text-right text-slate-300 font-mono">
                                                {money(invoice.currency, it.unit_price || it.price || 0)}
                                            </td>
                                            <td className="py-3 text-right text-slate-100 font-mono">
                                                {money(invoice.currency, it.total || (Number(it.unit_price || it.price || 0) * Number(it.qty || it.quantity || 1)))}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* PAYMENTS */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center gap-2 text-slate-200 mb-3">
                            <CreditCard size={18} className="text-slate-300" />
                            <span className="text-sm font-semibold">Payments</span>
                            <span className="text-xs text-slate-500 ml-2">({payments.length})</span>
                        </div>

                        {payments.length === 0 ? (
                            <div className="text-xs text-slate-500">Nenhum pagamento registrado.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-slate-400">
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-2 pr-3">Método</th>
                                        <th className="text-left py-2 pr-3">Gateway</th>
                                        <th className="text-left py-2 pr-3">TXID</th>
                                        <th className="text-left py-2 pr-3">Pago em</th>
                                        <th className="text-right py-2">Valor</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {payments.map((p) => (
                                        <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                            <td className="py-3 pr-3 text-slate-100">{p.method || "manual"}</td>
                                            <td className="py-3 pr-3 text-slate-300">{p.gateway || "-"}</td>
                                            <td className="py-3 pr-3 text-slate-300 font-mono">{p.txid || "-"}</td>
                                            <td className="py-3 pr-3 text-slate-300 font-mono">{dateOnly(p.paid_at || p.createdAt)}</td>
                                            <td className="py-3 text-right text-slate-100 font-mono">
                                                {money(invoice.currency, p.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT */}
                <div className="space-y-4">
                    {/* TOTALS */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                        <div className="text-sm font-semibold text-slate-100">Totais</div>

                        <div className="flex justify-between text-sm">
                            <span className="text-slate-300">Subtotal</span>
                            <span className="font-mono text-slate-100">{money(invoice.currency, invoice.subtotal)}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-slate-300">Desconto</span>
                            <span className="font-mono text-slate-100">{money(invoice.currency, invoice.discount)}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-slate-300">Taxas</span>
                            <span className="font-mono text-slate-100">{money(invoice.currency, invoice.tax)}</span>
                        </div>

                        <div className="border-t border-white/10 pt-2 flex justify-between font-semibold">
                            <span className="text-slate-100">Total</span>
                            <span className="font-mono text-slate-100">{money(invoice.currency, invoice.total)}</span>
                        </div>
                    </div>

                    {/* NOTES / META */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                        <div className="text-sm font-semibold text-slate-100">Meta</div>
                        <div className="text-xs text-slate-400">
                            Status e regra de pagamento seguem o backend. Pagamentos podem ser parciais.
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-400">
                            <div>
                                <div className="text-slate-500">Criada</div>
                                <div className="font-mono text-slate-200">{dateOnly(invoice.createdAt)}</div>
                            </div>
                            <div>
                                <div className="text-slate-500">Atualizada</div>
                                <div className="font-mono text-slate-200">{dateOnly(invoice.updatedAt)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
