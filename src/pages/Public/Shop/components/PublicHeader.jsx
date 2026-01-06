// src/pages/Public/Shop/components/CartDrawer.jsx
import { useEffect, useMemo, useState } from "react";
import { X, Trash2, ShoppingCart, Minus, Plus, BadgeDollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LOCAL_KEY = "vm_panel_shop_cart_v1";

function cls(...arr) {
    return arr.filter(Boolean).join(" ");
}

function safeParse(raw, fallback) {
    try {
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

// ✅ Carrinho padrão: { items: [] }
function loadCart() {
    const raw = localStorage.getItem(LOCAL_KEY);
    const parsed = safeParse(raw, { items: [] });

    if (Array.isArray(parsed)) {
        // compat: formato antigo (array)
        return { items: parsed };
    }

    if (!parsed || typeof parsed !== "object") return { items: [] };
    if (!Array.isArray(parsed.items)) parsed.items = [];

    return parsed;
}

function saveCart(cart) {
    try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(cart));
    } catch (e) {
        console.error("saveCart error", e);
    }
    try {
        window.dispatchEvent(new Event("vm-panel-cart-updated"));
    } catch (e) {}
}

function money(v, cur = "USD") {
    const n = Number(v || 0);
    return `${n.toFixed(2)} ${cur}`;
}

function itemTitle(it) {
    return (
        it?.meta?.name ||
        it?.description ||
        it?.name ||
        it?.meta?.code ||
        it?.code ||
        `Item`
    );
}

function itemSubtitle(it) {
    const type = it?.meta?.type || it?.type || "plan";
    const billing = it?.meta?.billing_type || it?.billing_type;
    const interval = it?.meta?.interval || it?.interval;

    if (billing === "recurring" && interval) return `${type} · recurring / ${interval}`;
    if (billing) return `${type} · ${billing}`;
    return `${type}`;
}

function itemTotal(it) {
    const qty = Math.max(1, Number(it.qty || 1));
    const unit = Number(it.unit_price || 0);
    const total = it.total_price != null ? Number(it.total_price) : unit * qty;
    return Number.isFinite(total) ? total : 0;
}

export default function CartDrawer({ open = false, onClose = () => {} }) {
    const nav = useNavigate();
    const [cart, setCart] = useState({ items: [] });

    useEffect(() => {
        if (open) setCart(loadCart());
    }, [open]);

    useEffect(() => {
        function onUpdate() {
            setCart(loadCart());
        }
        window.addEventListener("storage", onUpdate);
        window.addEventListener("vm-panel-cart-updated", onUpdate);
        return () => {
            window.removeEventListener("storage", onUpdate);
            window.removeEventListener("vm-panel-cart-updated", onUpdate);
        };
    }, []);

    const items = cart?.items || [];

    const currency = useMemo(() => {
        return items?.[0]?.meta?.currency || items?.[0]?.currency || "USD";
    }, [items]);

    const subtotal = useMemo(() => {
        const sum = items.reduce((acc, it) => acc + itemTotal(it), 0);
        return sum;
    }, [items]);

    function setItems(nextItems) {
        const next = { items: nextItems };
        setCart(next);
        saveCart(next);
    }

    function removeIndex(idx) {
        const next = items.filter((_, i) => i !== idx);
        setItems(next);
    }

    function clearCart() {
        setItems([]);
    }

    function updateQty(idx, nextQty) {
        const qty = Math.max(1, Number(nextQty || 1));
        const next = items.map((it, i) => (i === idx ? { ...it, qty } : it));

        // recalcula total local só pra UI ficar correta
        const fixed = next.map((it) => {
            const unit = Number(it.unit_price || 0);
            const q = Math.max(1, Number(it.qty || 1));
            const total = it.total_price != null ? Number(it.total_price) : unit * q;
            return { ...it, total_price: total };
        });

        setItems(fixed);
    }

    function bumpQty(idx, dir) {
        const cur = Math.max(1, Number(items[idx]?.qty || 1));
        updateQty(idx, cur + dir);
    }

    function goCheckout() {
        if (!items.length) return;
        onClose();
        nav("/shop/checkout");
    }

    useEffect(() => {
        function openCart() {
            setDrawerOpen(true);
        }
        window.addEventListener("vm-panel-cart-open", openCart);
        return () => window.removeEventListener("vm-panel-cart-open", openCart);
    }, []);


    return (
        <div className={cls("fixed inset-0 z-50 transition-all", open ? "pointer-events-auto" : "pointer-events-none")}>
            <div
                className={cls("absolute inset-0 bg-black/60 transition-opacity", open ? "opacity-100" : "opacity-0")}
                onClick={onClose}
            />

            <div
                className={cls(
                    "absolute right-0 top-0 h-full w-full md:w-[440px] border-l border-white/10 shadow-xl transition-transform transform",
                    "bg-gradient-to-b from-slate-950 via-slate-950 to-black",
                    open ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* header */}
                <div className="p-4 flex items-center justify-between border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl border border-white/10 bg-white/5">
                            <ShoppingCart size={16} />
                        </div>
                        <div>
                            <div className="text-lg font-semibold text-slate-100">Carrinho</div>
                            <div className="text-xs text-slate-500">{items.length} item(s)</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {items.length > 0 && (
                            <button
                                onClick={clearCart}
                                className="text-xs text-slate-400 hover:text-slate-200 px-2 py-2 rounded-xl border border-white/10 bg-white/5"
                            >
                                Limpar
                            </button>
                        )}

                        <button onClick={onClose} className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* body */}
                <div className="p-4 flex flex-col gap-3 h-[calc(100%-190px)] overflow-auto">
                    {!items.length ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-400">
                            Carrinho vazio. Adicione planos no catálogo.
                        </div>
                    ) : (
                        items.map((it, idx) => {
                            const title = itemTitle(it);
                            const subtitle = itemSubtitle(it);
                            const unit = Number(it.unit_price || 0);
                            const total = itemTotal(it);
                            const qty = Math.max(1, Number(it.qty || 1));

                            const custom = it?.customization || it?.meta?.custom || null;

                            return (
                                <div
                                    key={idx}
                                    className="rounded-2xl border border-white/10 p-4 bg-gradient-to-b from-slate-900/80 to-slate-950"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="text-sm text-slate-100 font-semibold truncate">{title}</div>
                                            <div className="text-xs text-slate-400 mt-1">{subtitle}</div>

                                            {custom && (
                                                <div className="mt-2 text-[11px] text-slate-500">
                                                    custom:{" "}
                                                    <span className="text-slate-300">
                                                        {custom.cores ? `${custom.cores}c` : ""}{" "}
                                                        {custom.memory_gb ? `${custom.memory_gb}gb` : ""}{" "}
                                                        {custom.disk_gb ? `${custom.disk_gb}gb` : ""}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-right shrink-0">
                                            <div className="text-sm font-semibold text-slate-100">{money(unit, it.currency || currency)}</div>
                                            <div className="text-xs text-slate-400 mt-1">Total: {money(total, it.currency || currency)}</div>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center gap-2">
                                        <button
                                            onClick={() => bumpQty(idx, -1)}
                                            className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
                                            title="Diminuir"
                                        >
                                            <Minus size={14} />
                                        </button>

                                        <input
                                            type="number"
                                            min="1"
                                            value={qty}
                                            onChange={(e) => updateQty(idx, e.target.value)}
                                            className="w-20 px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-sm text-slate-100"
                                        />

                                        <button
                                            onClick={() => bumpQty(idx, 1)}
                                            className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
                                            title="Aumentar"
                                        >
                                            <Plus size={14} />
                                        </button>

                                        <button
                                            onClick={() => removeIndex(idx)}
                                            className="ml-auto px-3 py-2 rounded-xl border border-rose-700/30 bg-rose-900/10 text-xs text-rose-200 inline-flex items-center gap-2 hover:bg-rose-900/20"
                                        >
                                            <Trash2 size={14} />
                                            Remover
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* footer */}
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <BadgeDollarSign size={16} className="opacity-80" />
                            Subtotal
                        </div>
                        <div className="text-lg font-semibold text-slate-100">{money(subtotal, currency)}</div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                        <button
                            onClick={goCheckout}
                            disabled={!items.length}
                            className={cls(
                                "w-full px-4 py-2 rounded-xl border font-semibold",
                                items.length
                                    ? "border-emerald-700/40 bg-emerald-900/10 text-emerald-200 hover:bg-white/5"
                                    : "border-white/10 bg-white/5 text-slate-500 cursor-not-allowed"
                            )}
                        >
                            Finalizar
                        </button>
                    </div>

                    <div className="mt-2 text-[11px] text-slate-500">
                        Checkout vai para <code>/shop/checkout</code>. Login/registro é feito lá.
                    </div>
                </div>
            </div>
        </div>
    );
}
