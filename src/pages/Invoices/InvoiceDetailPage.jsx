// src/pages/Invoices/InvoiceDetailPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import {
    ArrowLeft,
    FileText,
    RefreshCcw,
    Plus,
    Copy,
    ExternalLink,
    CreditCard,
    ClipboardList,
    DollarSign,
    Pencil,
    Trash2,
} from "lucide-react";

import InvoicesApi from "../../services/invoices";
import InvoiceStatusBadge from "./InvoiceStatusBadge";
import PaymentStatusBadge from "./PaymentStatusBadge";
import InvoiceItemModal from "./components/InvoiceItemModal.jsx";
import InvoiceActions from "./components/InvoiceActions.jsx";

function cls(...arr) {
    return arr.filter(Boolean).join(" ");
}

function fmtDate(d) {
    if (!d) return "—";
    try {
        return new Date(d).toLocaleDateString();
    } catch {
        return "—";
    }
}

function fmtDateTime(d) {
    if (!d) return "—";
    try {
        return new Date(d).toLocaleString();
    } catch {
        return "—";
    }
}

function toMoneyString(value) {
    if (value === null || value === undefined) return "—";
    if (typeof value === "number") return value.toFixed(2);
    return String(value);
}

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

export default function InvoiceDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);

    const [invoice, setInvoice] = useState(null);
    const [customer, setCustomer] = useState(null);
    const [items, setItems] = useState([]);
    const [payments, setPayments] = useState([]);
    const [totals, setTotals] = useState(null);
    const [permissions, setPermissions] = useState(null);

    // Modal item
    const [itemOpen, setItemOpen] = useState(false);
    const [itemMode, setItemMode] = useState("create"); // create|edit
    const [itemEditing, setItemEditing] = useState(null);

    async function load() {
        setLoading(true);
        try {
            const res = await InvoicesApi.get(id);

            setInvoice(res?.invoice || null);
            setCustomer(res?.customer || null);
            setItems(Array.isArray(res?.items) ? res.items : []);
            setPayments(Array.isArray(res?.payments) ? res.payments : []);
            setTotals(res?.totals || null);
            setPermissions(res?.permissions || null);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const currency = invoice?.currency || "USD";
    const canAddPayment = permissions?.can_add_payment === true;

    // ✅ regra correta: backend manda
    const canEditItems = permissions?.can_edit === true;

    const progress = useMemo(() => {
        const total = totals?.total ?? 0;
        const paid = totals?.paid ?? 0;
        if (!total) return 0;
        return clamp((paid / total) * 100, 0, 100);
    }, [totals]);

    async function copyToClipboard(text, label = "Copiado") {
        try {
            await navigator.clipboard.writeText(text);
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: label,
                showConfirmButton: false,
                timer: 1600,
            });
        } catch (err) {
            console.error(err);
            Swal.fire("Erro", "Não foi possível copiar", "error");
        }
    }

    function openCreateItem() {
        setItemMode("create");
        setItemEditing(null);
        setItemOpen(true);
    }

    function openEditItem(it) {
        setItemMode("edit");
        setItemEditing(it);
        setItemOpen(true);
    }

    async function submitItem(payload) {
        try {
            if (itemMode === "edit" && itemEditing?.id) {
                await InvoicesApi.updateItem(id, itemEditing.id, payload);
                Swal.fire("OK", "Item atualizado", "success");
            } else {
                await InvoicesApi.addItem(id, payload);
                Swal.fire("OK", "Item adicionado", "success");
            }

            setItemOpen(false);
            setItemEditing(null);
            await load();
        } catch (err) {
            console.error(err);
            Swal.fire("Erro", "Falha ao salvar item", "error");
        }
    }

    async function deleteItem(it) {
        const ok = await Swal.fire({
            title: "Remover item?",
            text: `Item #${it.id} será removido da invoice.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Remover",
            cancelButtonText: "Cancelar",
        });

        if (!ok.isConfirmed) return;

        try {
            await InvoicesApi.deleteItem(id, it.id);
            Swal.fire("OK", "Item removido", "success");
            await load();
        } catch (err) {
            console.error(err);
            Swal.fire("Erro", "Falha ao remover item", "error");
        }
    }

    if (loading) return <div className="p-6 text-slate-400">Carregando invoice...</div>;
    if (!invoice) return <div className="p-6 text-slate-400">Invoice não encontrada.</div>;

    return (
        <div className="space-y-5">
            {/* HEADER */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
                        title="Voltar"
                    >
                        <ArrowLeft size={16} />
                    </button>

                    <div className="p-3 rounded-2xl border border-white/10 bg-white/5 shrink-0">
                        <FileText className="w-5 h-5 text-sky-300" />
                    </div>

                    <div className="min-w-0">
                        <div className="text-lg font-semibold text-slate-100 flex items-center gap-3 min-w-0">
                            <span className="truncate">{invoice.number || `Invoice #${invoice.id}`}</span>
                            <InvoiceStatusBadge status={invoice.status} />
                        </div>

                        <div className="text-xs text-slate-400 flex flex-wrap gap-2">
                            <span>
                                Cliente:{" "}
                                <span className="text-slate-200 font-semibold">
                                    {customer?.name || `Owner #${invoice.owner_id}`}
                                </span>
                            </span>

                            {customer?.email ? (
                                <>
                                    <span className="opacity-50">•</span>
                                    <span className="text-slate-400">{customer.email}</span>
                                </>
                            ) : null}

                            <span className="opacity-50">•</span>

                            <span>
                                Total:{" "}
                                <span className="text-slate-200 font-semibold">
                                    {toMoneyString(invoice.total)} {currency}
                                </span>
                            </span>

                            <span className="opacity-50">•</span>

                            <span>
                                Due:{" "}
                                <span className="text-slate-200 font-semibold">{fmtDate(invoice.due_at)}</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* ACTIONS (status + pay) */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={load}
                        className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold"
                    >
                        <span className="flex items-center gap-2">
                            <RefreshCcw size={16} />
                            Atualizar
                        </span>
                    </button>

                    {/* ✅ Status/Pay actions com permissions do backend */}
                    <InvoiceActions invoice={invoice} permissions={permissions} onRefresh={load} />

                    {/* Add Item rápido no header */}
                    {canEditItems ? (
                        <button
                            onClick={openCreateItem}
                            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold"
                            title="Adicionar item"
                        >
                            <span className="flex items-center gap-2">
                                <Plus size={16} />
                                Add Item
                            </span>
                        </button>
                    ) : null}

                    {/* badge para clareza */}
                    {!canEditItems ? (
                        <span className="text-[11px] text-slate-400 border border-white/10 bg-black/20 px-3 py-2 rounded-xl">
                            Itens bloqueados por permissions
                        </span>
                    ) : null}
                </div>
            </div>

            {/* KPI STRIP */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card title="Total" icon={<DollarSign size={16} className="text-sky-300" />}>
                    <div className="text-2xl font-bold text-slate-100">
                        {toMoneyString(invoice.total)}{" "}
                        <span className="text-sm text-slate-400 font-semibold">{currency}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                        Subtotal: <span className="text-slate-200 font-semibold">{toMoneyString(invoice.subtotal)}</span>
                    </div>
                </Card>

                <Card title="Paid" icon={<CreditCard size={16} className="text-emerald-300" />}>
                    <div className="text-2xl font-bold text-slate-100">
                        {toMoneyString(totals?.paid ?? 0)}{" "}
                        <span className="text-sm text-slate-400 font-semibold">{currency}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Pagamentos confirmados</div>
                </Card>

                <Card title="Due" icon={<CreditCard size={16} className="text-amber-300" />}>
                    <div className="text-2xl font-bold text-slate-100">
                        {toMoneyString(totals?.due ?? 0)}{" "}
                        <span className="text-sm text-slate-400 font-semibold">{currency}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Saldo em aberto</div>
                </Card>

                <Card title="Timeline" icon={<FileText size={16} className="text-slate-300" />}>
                    <div className="text-sm text-slate-200 font-semibold">
                        Issued: <span className="text-slate-400 font-normal">{fmtDate(invoice.issued_at)}</span>
                    </div>
                    <div className="text-sm text-slate-200 font-semibold mt-1">
                        Due: <span className="text-slate-400 font-normal">{fmtDate(invoice.due_at)}</span>
                    </div>
                    <div className="text-sm text-slate-200 font-semibold mt-1">
                        Paid: <span className="text-slate-400 font-normal">{fmtDate(invoice.paid_at)}</span>
                    </div>
                </Card>
            </div>

            {/* PROGRESS */}
            <Card title="Progress (Paid / Total)">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>Pago</span>
                    <span className="text-slate-200 font-semibold">{progress.toFixed(0)}%</span>
                </div>
                <div className="h-3 rounded-full bg-black/30 border border-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500/70 to-sky-500/70" style={{ width: `${progress}%` }} />
                </div>
            </Card>

            {/* PAYMENT LINKS / PIX */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card title="Payment Link" subtitle="Link de pagamento (gateway)" icon={<ExternalLink size={16} className="text-sky-300" />}>
                    {invoice.payment_link ? (
                        <div className="space-y-3">
                            <div className="text-xs text-slate-300 break-all">{invoice.payment_link}</div>
                            <div className="flex gap-2">
                                <button
                                    className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold"
                                    onClick={() => window.open(invoice.payment_link, "_blank")}
                                >
                                    Abrir
                                </button>
                                <button
                                    className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold"
                                    onClick={() => copyToClipboard(invoice.payment_link, "Link copiado")}
                                >
                                    <span className="inline-flex items-center gap-2">
                                        <Copy size={16} /> Copiar
                                    </span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <EmptyHint text="Sem payment_link (ainda não gerado)." />
                    )}
                </Card>

                <Card title="PIX Copy & Paste" subtitle="Chave/código copia e cola" icon={<Copy size={16} className="text-emerald-300" />}>
                    {invoice.pix_copy_paste ? (
                        <div className="space-y-3">
                            <div className="text-xs text-slate-300 break-all">{invoice.pix_copy_paste}</div>
                            <button
                                className="px-3 py-2 rounded-xl border border-emerald-700/40 bg-emerald-900/10 hover:bg-emerald-900/15 text-sm font-semibold text-emerald-200"
                                onClick={() => copyToClipboard(invoice.pix_copy_paste, "PIX copiado")}
                            >
                                <span className="inline-flex items-center gap-2">
                                    <Copy size={16} /> Copiar PIX
                                </span>
                            </button>
                        </div>
                    ) : (
                        <EmptyHint text="Sem pix_copy_paste (ainda não gerado)." />
                    )}
                </Card>

                <Card title="PIX QRCode" subtitle="QR em texto/base64 (se existir)" icon={<ExternalLink size={16} className="text-amber-300" />}>
                    {invoice.pix_qrcode ? (
                        <div className="space-y-3">
                            <div className="text-xs text-slate-300 break-all line-clamp-5">{invoice.pix_qrcode}</div>
                            <button
                                className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold"
                                onClick={() => copyToClipboard(invoice.pix_qrcode, "QRCode copiado")}
                            >
                                <span className="inline-flex items-center gap-2">
                                    <Copy size={16} /> Copiar QR
                                </span>
                            </button>
                        </div>
                    ) : (
                        <EmptyHint text="Sem pix_qrcode (ainda não gerado)." />
                    )}
                </Card>
            </div>

            {/* ITEMS */}
            <Section
                title="Items"
                icon={<ClipboardList size={16} className="text-sky-300" />}
                count={items.length}
            >
                <Table
                    head={["ID", "Type", "Produto", "Descrição", "Qty", "Unit", "Total", "Atualizado", "Ações"]}
                    empty="Nenhum item."
                >
                    {items.map((it) => (
                        <tr key={it.id} className="border-t border-white/5">
                            <td className="px-4 py-3 font-mono text-slate-200">{it.id}</td>
                            <td className="px-4 py-3 text-slate-300">{it.type || "—"}</td>

                            <td className="px-4 py-3">
                                <div className="min-w-0">
                                    <div className="text-slate-200 font-semibold truncate max-w-[340px]">
                                        {it.product?.name || it.product?.hostname || (it.ref_id ? `#${it.ref_id}` : "—")}
                                    </div>

                                    {it.product?.status ? (
                                        <div className="text-xs text-slate-500 truncate max-w-[340px]">
                                            {it.product.status} · CPU {it.product.cpu ?? "—"} · RAM {it.product.memory_mb ?? "—"} MB
                                        </div>
                                    ) : (
                                        <div className="text-xs text-slate-600 truncate max-w-[340px]">ref_id: {it.ref_id ?? "—"}</div>
                                    )}
                                </div>
                            </td>

                            <td className="px-4 py-3 text-slate-200">{it.description || "—"}</td>
                            <td className="px-4 py-3 text-slate-300">{it.qty ?? "—"}</td>
                            <td className="px-4 py-3 text-slate-300">{it.unit_price ?? "—"}</td>
                            <td className="px-4 py-3 text-slate-200 font-semibold">{it.total ?? "—"}</td>
                            <td className="px-4 py-3 text-slate-500">{fmtDateTime(it.updated_at)}</td>

                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2 justify-end">
                                    <button
                                        onClick={() => openEditItem(it)}
                                        disabled={!canEditItems}
                                        className={cls(
                                            "px-3 py-2 rounded-xl border text-xs font-semibold",
                                            canEditItems
                                                ? "border-white/10 bg-white/5 hover:bg-white/10 text-slate-200"
                                                : "border-white/10 bg-white/5 text-slate-500 opacity-60 cursor-not-allowed"
                                        )}
                                        title={!canEditItems ? "Sem permissão" : "Editar item"}
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <Pencil size={14} /> Editar
                                        </span>
                                    </button>

                                    <button
                                        onClick={() => deleteItem(it)}
                                        disabled={!canEditItems}
                                        className={cls(
                                            "px-3 py-2 rounded-xl border text-xs font-semibold",
                                            canEditItems
                                                ? "border-rose-700/40 bg-rose-900/10 hover:bg-rose-900/15 text-rose-200"
                                                : "border-white/10 bg-white/5 text-slate-500 opacity-60 cursor-not-allowed"
                                        )}
                                        title={!canEditItems ? "Sem permissão" : "Remover item"}
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <Trash2 size={14} /> Remover
                                        </span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Section>

            {/* PAYMENTS */}
            <Section
                title="Payments"
                icon={<CreditCard size={16} className="text-sky-300" />}
                count={payments.length}
                right={
                    !canAddPayment ? (
                        <span className="text-[11px] text-slate-400 border border-white/10 bg-black/20 px-3 py-2 rounded-xl">
                            Ações bloqueadas por permissions
                        </span>
                    ) : null
                }
            >
                <Table
                    head={["ID", "Status", "Method", "Amount", "Reference", "Paid at", "Criado"]}
                    empty="Nenhum pagamento."
                >
                    {payments.map((p) => (
                        <tr key={p.id} className="border-t border-white/5">
                            <td className="px-4 py-3 font-mono text-slate-200">{p.id}</td>

                            <td className="px-4 py-3">
                                <PaymentStatusBadge status={p.status} />
                            </td>

                            <td className="px-4 py-3 text-slate-300">{p.method || "—"}</td>

                            <td className="px-4 py-3 text-slate-200 font-semibold">
                                {toMoneyString(p.amount)} {p.currency || currency}
                            </td>

                            <td className="px-4 py-3 text-slate-300">{p.reference || p.txid || "—"}</td>

                            <td className="px-4 py-3 text-slate-300">{fmtDateTime(p.paid_at)}</td>

                            <td className="px-4 py-3 text-slate-500">{fmtDateTime(p.created_at)}</td>
                        </tr>
                    ))}
                </Table>
            </Section>

            {/* MODAL ITEM */}
            <InvoiceItemModal
                open={itemOpen}
                mode={itemMode}
                initial={itemEditing}
                currency={currency}
                onClose={() => {
                    setItemOpen(false);
                    setItemEditing(null);
                }}
                onSubmit={submitItem}
            />
        </div>
    );
}

/* ================= UI COMPONENTS ================= */

function Card({ title, subtitle, icon, children }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500 flex items-center gap-2">
                        {icon}
                        {title}
                    </div>
                    {subtitle ? <div className="text-[11px] text-slate-400 mt-1">{subtitle}</div> : null}
                </div>
            </div>
            {children}
        </div>
    );
}

function EmptyHint({ text }) {
    return (
        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-xs text-slate-400">
            {text}
        </div>
    );
}

function Section({ title, icon, count, children, right }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    {icon}
                    {title}
                    <span className="text-xs text-slate-400 font-normal">({count})</span>
                </div>
                <div className="flex items-center gap-2">{right}</div>
            </div>
            {children}
        </div>
    );
}

function Table({ head = [], empty = "Sem dados", children }) {
    const hasRows = Array.isArray(children) ? children.length > 0 : !!children;

    return (
        <div className="overflow-auto">
            <table className="w-full text-sm">
                <thead className="bg-black/20">
                <tr className="text-left text-xs text-slate-400">
                    {head.map((h) => (
                        <th key={h} className="px-4 py-3">
                            {h}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {!hasRows ? (
                    <tr>
                        <td className="px-4 py-6 text-slate-400" colSpan={head.length || 1}>
                            {empty}
                        </td>
                    </tr>
                ) : (
                    children
                )}
                </tbody>
            </table>
        </div>
    );
}
