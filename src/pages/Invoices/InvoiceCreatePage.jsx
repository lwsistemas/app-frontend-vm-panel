// src/pages/Invoices/InvoiceCreatePage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { ArrowLeft, FileText, Plus, Trash2 } from "lucide-react";

import InvoicesApi from "../../services/invoices";
import InvoiceItemModal from "./components/InvoiceItemModal";
import InvoiceClientSelect from "./components/InvoiceClientSelect";
import { useAuth } from "../../context/AuthContext.jsx"; // correto

function cls(...arr) {
    return arr.filter(Boolean).join(" ");
}

function toNumber(val) {
    const n = Number(val);
    return Number.isNaN(n) ? null : n;
}

function isPrivileged(role) {
    return ["root", "admin", "finance"].includes(String(role || "").toLowerCase());
}

/**
 * Gera number auto no formato: INV-YYYYMMDD-XXXX (XXXX = seq diário de 4 dígitos salvo em localStorage)
 * Ex: INV-20260105-0001
 */
function generateInvoiceNumber() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const key = `invoice_seq_${yyyy}${mm}${dd}`;

    let seq = Number(localStorage.getItem(key) || 0);
    seq = seq + 1;
    localStorage.setItem(key, String(seq));

    const seqStr = String(seq).padStart(4, "0");
    return `INV-${yyyy}${mm}${dd}-${seqStr}`;
}

/** Normaliza meta para o formato que o backend aceita (string ou null) */
function normalizeMetaForBackend(m) {
    if (m === null || m === undefined) return null;
    if (typeof m === "string") {
        // se já for string, mantém
        return m;
    }
    try {
        return JSON.stringify(m);
    } catch {
        return null;
    }
}

export default function InvoiceCreatePage() {
    const navigate = useNavigate();
    const { me } = useAuth(); // useAuth do contexto, expõe `me`
    const privileged = isPrivileged(me?.role);

    const [saving, setSaving] = useState(false);

    // invoice fields
    const [number, setNumber] = useState(""); // agora auto
    const [currency, setCurrency] = useState("USD");
    const [issuedAt, setIssuedAt] = useState(() => new Date().toISOString().slice(0, 10));
    const [dueAt, setDueAt] = useState(() => new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10));
    const [notes, setNotes] = useState("");

    // owner selection (for privileged)
    const [ownerId, setOwnerId] = useState(""); // selected owner id (string)

    // items (local draft before create)
    const [items, setItems] = useState([]);
    const [itemModalOpen, setItemModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // gerar número automático ao montar
    useEffect(() => {
        // se já tiver um number (state preservado), não sobrescreve
        if (!number) {
            setNumber(generateInvoiceNumber());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // subtotal/total calculation (live)
    const subtotal = useMemo(() => {
        const sum = items.reduce((acc, it) => {
            const q = toNumber(it.qty) ?? 0;
            const u = toNumber(it.unit_price) ?? 0;
            return acc + q * u;
        }, 0);
        return Number(sum);
    }, [items]);

    // tax placeholder (currently zero). If you have tax rules, add here.
    const taxRate = 0; // e.g. 0.0 for no tax
    const taxes = +(subtotal * taxRate).toFixed(2);
    const total = +(subtotal + taxes).toFixed(2);

    // Add item (from modal)
    async function addItem(payload) {
        setItems((prev) => [
            ...prev,
            {
                ...payload,
                _tmp_id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                total: ((payload.qty ?? 0) * (payload.unit_price ?? 0)).toFixed(2),
            },
        ]);
        setItemModalOpen(false);
    }

    // edit existing tmp item
    function editTmpItem(item) {
        setEditingItem(item);
        setItemModalOpen(true);
    }

    async function updateTmpItem(payload) {
        setItems((prev) =>
            prev.map((it) =>
                it._tmp_id === editingItem._tmp_id
                    ? { ...it, ...payload, total: ((payload.qty ?? 0) * (payload.unit_price ?? 0)).toFixed(2) }
                    : it
            )
        );
        setEditingItem(null);
        setItemModalOpen(false);
    }

    async function removeTmpItem(tmpId) {
        const ok = await Swal.fire({
            title: "Remover item?",
            text: "Isso remove só do rascunho (a fatura ainda não foi criada).",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Remover",
            cancelButtonText: "Cancelar",
        });

        if (!ok.isConfirmed) return;
        setItems((prev) => prev.filter((x) => x._tmp_id !== tmpId));
    }

    // Submit create invoice
    async function submit() {
        // validações básicas em PT-BR
        if (!number || !String(number).trim()) {
            return Swal.fire("Atenção", "Número é obrigatório.", "warning");
        }

        if (items.length === 0) {
            const confirmNoItems = await Swal.fire({
                title: "Criar fatura sem itens?",
                text: "Deseja criar a fatura sem itens adicionados?",
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Criar mesmo assim",
                cancelButtonText: "Voltar",
            });
            if (!confirmNoItems.isConfirmed) return;
        }

        // prepare payload - normalizando tipos e meta conforme backend espera
        const payload = {
            number: String(number).trim(),
            currency: String(currency || "USD").trim(),
            issued_at: issuedAt ? new Date(issuedAt).toISOString() : undefined,
            due_at: dueAt ? new Date(dueAt).toISOString() : undefined,
            notes: notes ? String(notes).trim() : undefined,
            items: items.map((it) => ({
                type: it.type || undefined,
                ref_id: it.ref_id !== undefined && it.ref_id !== null ? Number(it.ref_id) : undefined,
                description: String(it.description || ""),
                qty: Number(it.qty || 0),
                unit_price: Number(it.unit_price || 0),
                meta: normalizeMetaForBackend(it.meta),
            })),
        };

        setSaving(true);
        try {
            // if privileged and selected ownerId -> pass as query param owner_id
            const params = {};
            if (privileged && ownerId) params.owner_id = ownerId;

            const res = await InvoicesApi.create(payload, Object.keys(params).length ? params : undefined);
            const invoiceId = res?.invoice?.id || res?.id;
            Swal.fire("OK", "Fatura criada com sucesso", "success");
            if (invoiceId) return navigate(`/invoices/${invoiceId}`);
            return navigate("/invoices");
        } catch (err) {
            console.error(err);
            Swal.fire("Erro", err?.response?.data?.error?.message || "Falha ao criar fatura", "error");
        } finally {
            setSaving(false);
        }
    }

    // quick handler to edit tmp item
    function onEditTmpItem(tmpId) {
        const it = items.find((x) => x._tmp_id === tmpId);
        if (!it) return;
        setEditingItem(it);
        setItemModalOpen(true);
    }

    return (
        <div className="space-y-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10" title="Voltar">
                        <ArrowLeft size={16} />
                    </button>

                    <div className="p-3 rounded-2xl border border-white/10 bg-white/5 shrink-0">
                        <FileText className="w-5 h-5 text-sky-300" />
                    </div>

                    <div className="min-w-0">
                        <div className="text-lg font-semibold text-slate-100 flex items-center gap-3 min-w-0">
                            <span className="truncate">Nova Fatura</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                            Subtotal (prévia): <span className="text-slate-200 font-semibold">{subtotal.toFixed(2)}</span>{" "}
                            <span className="text-slate-400">{currency}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={() => setItemModalOpen(true)} className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold">
            <span className="flex items-center gap-2">
              <Plus size={16} />
              Adicionar Item
            </span>
                    </button>

                    <button
                        onClick={submit}
                        disabled={saving}
                        className={cls(
                            "px-4 py-2 rounded-xl border text-sm font-semibold",
                            saving ? "border-white/10 bg-white/5 text-slate-500 opacity-60 cursor-not-allowed" : "border-emerald-700/40 bg-emerald-900/10 hover:bg-emerald-900/15 text-emerald-200"
                        )}
                    >
                        {saving ? "Salvando..." : "Criar Fatura"}
                    </button>
                </div>
            </div>

            <Card title="Dados da Fatura">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {privileged ? (
                        <Field label="Cliente (selecionar)">
                            <InvoiceClientSelect value={ownerId} onChange={(v) => setOwnerId(v)} disabled={!privileged} placeholder="Pesquisar cliente por nome/email..." />
                        </Field>
                    ) : (
                        <div className="md:col-span-2 text-xs text-slate-400">
                            Faturas criadas como: <span className="text-slate-200 font-semibold">{me?.name || me?.login || `Owner #${me?.id}`}</span>
                        </div>
                    )}

                    <Field label="Número (gerado automaticamente)">
                        <input
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            readOnly
                            className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/20 text-slate-100 text-sm"
                        />
                    </Field>

                    <Field label="Currency">
                        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-slate-100 text-sm">
                            <option value="USD">USD</option>
                            <option value="BRL">BRL</option>
                            <option value="EUR">EUR</option>
                        </select>
                    </Field>

                    <Field label="Emitida em">
                        <input type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-slate-100 text-sm" />
                    </Field>

                    <Field label="Vencimento">
                        <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-slate-100 text-sm" />
                    </Field>

                    <Field label="Observações" className="md:col-span-2">
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-slate-100 text-sm" placeholder="Observações / termos / etc..." />
                    </Field>
                </div>
            </Card>

            <Card title={`Itens (${items.length})`} subtitle="Itens que serão enviados junto no create">
                {items.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-xs text-slate-400">
                        Nenhum item adicionado. Você pode criar a fatura vazia e adicionar itens depois.
                    </div>
                ) : (
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-black/20">
                            <tr className="text-left text-xs text-slate-400">
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">ref_id</th>
                                <th className="px-4 py-3">Descrição</th>
                                <th className="px-4 py-3">Qty</th>
                                <th className="px-4 py-3">Unit</th>
                                <th className="px-4 py-3">Total</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                            </thead>
                            <tbody>
                            {items.map((it) => (
                                <tr key={it._tmp_id} className="border-t border-white/5">
                                    <td className="px-4 py-3 text-slate-300">{it.type || "—"}</td>
                                    <td className="px-4 py-3 text-slate-300">{it.ref_id ?? "—"}</td>
                                    <td className="px-4 py-3 text-slate-200">{it.description}</td>
                                    <td className="px-4 py-3 text-slate-300">{it.qty}</td>
                                    <td className="px-4 py-3 text-slate-300">{it.unit_price}</td>
                                    <td className="px-4 py-3 text-slate-200 font-semibold">{it.total} {currency}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center gap-2 justify-end">
                                            <button onClick={() => onEditTmpItem(it._tmp_id)} className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold">Editar</button>
                                            <button onClick={() => removeTmpItem(it._tmp_id)} className="px-3 py-2 rounded-xl border border-rose-700/40 bg-rose-900/10 hover:bg-rose-900/15 text-xs font-semibold text-rose-200">
                                                <Trash2 size={14} /> Remover
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Totals */}
                <div className="mt-4 flex items-center justify-end gap-4">
                    <div className="text-sm text-slate-400">Subtotal</div>
                    <div className="text-lg font-bold text-slate-100">{subtotal.toFixed(2)} {currency}</div>
                </div>

                <div className="mt-2 flex items-center justify-end gap-4">
                    <div className="text-sm text-slate-400">Impostos</div>
                    <div className="text-lg font-bold text-slate-100">{taxes.toFixed(2)} {currency}</div>
                </div>

                <div className="mt-2 flex items-center justify-end gap-4">
                    <div className="text-sm text-slate-400">Total</div>
                    <div className="text-2xl font-bold text-slate-200">{total.toFixed(2)} {currency}</div>
                </div>
            </Card>

            <InvoiceItemModal
                open={itemModalOpen}
                mode={editingItem ? "edit" : "create"}
                initial={editingItem}
                currency={currency}
                onClose={() => {
                    setItemModalOpen(false);
                    setEditingItem(null);
                }}
                onSubmit={async (payload) => {
                    if (editingItem) {
                        await updateTmpItem(payload);
                    } else {
                        await addItem(payload);
                    }
                }}
            />
        </div>
    );
}

/* ======== UI Helpers ======== */

function Card({ title, children, subtitle }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 p-4">
            <div className="mb-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">{title}</div>
                {subtitle ? <div className="text-[11px] text-slate-400 mt-1">{subtitle}</div> : null}
            </div>
            {children}
        </div>
    );
}

function Field({ label, children, className }) {
    return (
        <div className={cls("space-y-1.5", className)}>
            <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
            {children}
        </div>
    );
}
