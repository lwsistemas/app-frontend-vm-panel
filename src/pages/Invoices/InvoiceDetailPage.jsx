import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { ArrowLeft } from "lucide-react";

import InvoicesApi from "../../services/invoices";
import InvoiceStatusBadge from "./InvoiceStatusBadge";

export default function InvoiceDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [invoice, setInvoice] = useState(null);

    async function load() {
        setLoading(true);
        try {
            const res = await InvoicesApi.get(id);
            setInvoice(res.data);
        } catch (err) {
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

    if (loading) {
        return (
            <div className="p-6 text-slate-400">
                Carregando invoice...
            </div>
        );
    }

    if (!invoice) return null;

    return (
        <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate("/invoices")}
                        className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center"
                    >
                        <ArrowLeft size={16} />
                    </button>

                    <div>
                        <div className="text-lg font-semibold">
                            Invoice {invoice.number}
                        </div>
                        <div className="text-xs text-slate-400">
                            Detalhe da fatura
                        </div>
                    </div>
                </div>

                <InvoiceStatusBadge status={invoice.status} />
            </div>

            {/* Body */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                    <div className="text-xs text-slate-400">Cliente</div>
                    <div className="text-sm">{invoice.owner_name || "-"}</div>

                    <div className="text-xs text-slate-400 mt-3">Vencimento</div>
                    <div className="text-sm font-mono">
                        {invoice.due_at?.slice(0, 10)}
                    </div>

                    <div className="text-xs text-slate-400 mt-3">Emitida em</div>
                    <div className="text-sm font-mono">
                        {invoice.issued_at?.slice(0, 10)}
                    </div>
                </div>

                {/* Right */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span className="font-mono">
              {invoice.currency} {invoice.subtotal}
            </span>
                    </div>

                    <div className="flex justify-between text-sm">
                        <span>Desconto</span>
                        <span className="font-mono">
              {invoice.currency} {invoice.discount}
            </span>
                    </div>

                    <div className="flex justify-between text-sm">
                        <span>Taxas</span>
                        <span className="font-mono">
              {invoice.currency} {invoice.tax}
            </span>
                    </div>

                    <div className="border-t border-white/10 pt-2 flex justify-between font-semibold">
                        <span>Total</span>
                        <span className="font-mono">
              {invoice.currency} {invoice.total}
            </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
