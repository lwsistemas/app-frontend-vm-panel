// src/components/public/CartDrawer.jsx
import { useEffect, useMemo, useState } from "react";
import { X, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import ShopApi from "../../../../services/shop.jsx"; // ajuste o caminho se necessário

const LOCAL_KEY = "vm_panel_shop_cart_v1";

function cls(...arr) {
    return arr.filter(Boolean).join(" ");
}

function loadCart() {
    try {
        const raw = localStorage.getItem(LOCAL_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error("loadCart error", e);
        return [];
    }
}

function saveCart(cart) {
    try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(cart));
    } catch (e) {
        console.error("saveCart error", e);
    }
    // notify listeners
    try { window.dispatchEvent(new Event("vm-panel-cart-updated")); } catch (e) {}
}

export default function CartDrawer({ open = false, onClose = () => {}, onCheckoutSuccess = () => {} }) {
    const [cart, setCart] = useState([]);
    const [loadingCheckout, setLoadingCheckout] = useState(false);

    useEffect(() => {
        setCart(loadCart());
    }, [open]);

    useEffect(() => {
        // keep UI updated if other tabs change cart
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

    const subtotal = useMemo(() => {
        return (cart.reduce((acc, it) => acc + (Number(it.unit_price || 0) * Number(it.qty || 0)), 0) || 0).toFixed(2);
    }, [cart]);

    function updateQty(index, next) {
        setCart((prev) => {
            const copy = [...prev];
            copy[index].qty = Math.max(0, Number(next) || 0);
            const filtered = copy.filter(i => i.qty > 0);
            saveCart(filtered);
            return filtered;
        });
    }

    function removeIndex(index) {
        setCart((prev) => {
            const filtered = prev.filter((_, i) => i !== index);
            saveCart(filtered);
            return filtered;
        });
    }

    function clearCartConfirmed() {
        Swal.fire({
            title: "Limpar carrinho?",
            text: "Todos os itens serão removidos.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sim, limpar",
            cancelButtonText: "Cancelar",
        }).then(res => {
            if (res.isConfirmed) {
                saveCart([]);
                setCart([]);
            }
        });
    }

    // Helper to build checkout payload for ShopApi
    function buildCheckoutPayload(ownerId, notes = "") {
        return {
            customer: { owner_id: ownerId },
            currency: cart[0]?.currency || "USD",
            items: cart.map(it => ({
                plan_id: it.plan_id,
                qty: Number(it.qty || 1),
                customization: (it.meta && it.meta.custom) ? it.meta.custom : null,
                description: it.description,
                unit_price: Number(it.unit_price)
            })),
            notes,
            metadata: { source: "public_catalog_cart" },
        };
    }

    async function handleCheckout() {
        if (!cart.length) {
            Swal.fire("Carrinho vazio", "Adicione pelo menos um plano.", "warning");
            return;
        }

        // ask for owner_id + notes
        const { value } = await Swal.fire({
            title: "Checkout - Teste",
            html:
                `<input id="owner_id" class="swal2-input" placeholder="Owner ID (ex: 2 = cliente1)">
         <input id="notes" class="swal2-input" placeholder="Notes (optional)">`,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: "Confirmar",
            preConfirm: () => {
                const ownerId = document.getElementById("owner_id").value;
                const notes = document.getElementById("notes").value;
                if (!ownerId) {
                    Swal.showValidationMessage("Informe owner_id para teste (ex: 2)");
                    return null;
                }
                return { owner_id: Number(ownerId), notes: notes || "" };
            },
        });

        if (!value) return;

        const payload = buildCheckoutPayload(value.owner_id, value.notes);

        // inner function does the actual call (and optionally retries with provided shopKey)
        async function doCheckout(shopKey) {
            setLoadingCheckout(true);
            try {
                const res = await ShopApi.checkout(payload, { shopKeyOverride: shopKey });
                // success
                if (res?.invoice) {
                    Swal.fire("OK", "Invoice criada: " + (res.invoice.number || res.invoice.id), "success");
                    saveCart([]); setCart([]); onClose(); onCheckoutSuccess(res);
                    return;
                }
                if (res?.payment?.payment_link) {
                    Swal.fire("OK", "Link de pagamento: " + res.payment.payment_link, "success");
                    saveCart([]); setCart([]); onClose(); onCheckoutSuccess(res);
                    return;
                }
                // fallback success
                Swal.fire("OK", "Checkout realizado", "success");
                saveCart([]); setCart([]); onClose(); onCheckoutSuccess(res);
            } catch (err) {
                console.error("[CartDrawer] checkout error", err);

                // Price mismatch -> show server details
                if (err?.response?.status === 409) {
                    const details = err.response.data?.error?.details || err.response.data;
                    const msg = typeof details === "string" ? details : JSON.stringify(details, null, 2);
                    await Swal.fire({
                        title: "Preço divergente",
                        html: `<pre style="text-align:left; white-space:pre-wrap;">${msg}</pre>`,
                        icon: "warning",
                        width: 800,
                    });
                    return;
                }

                // Unauthorized or Forbidden -> ask for shop api key and retry
                if (err?.response?.status === 401 || err?.response?.status === 403) {
                    const { value: apiKey } = await Swal.fire({
                        title: "Shop API key necessária",
                        input: "text",
                        inputLabel: "Cole a chave do shop (x-api-key)",
                        inputPlaceholder: "x-api-key...",
                        showCancelButton: true,
                    });
                    if (!apiKey) {
                        Swal.fire("Cancelado", "Checkout cancelado (chave necessária)", "info");
                        return;
                    }
                    try { localStorage.setItem("shop_api_key", apiKey); } catch (e) {}
                    // retry once with provided key
                    await doCheckout(apiKey);
                    return;
                }

                // other errors
                Swal.fire("Erro", err?.response?.data?.error?.message || err?.message || "Falha no checkout", "error");
            } finally {
                setLoadingCheckout(false);
            }
        }

        // first attempt without forcing key (ShopApi will pick env or localStorage if present)
        await doCheckout(null);
    }

    return (
        <div className={`fixed inset-0 z-50 transition-all ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
            <div className={`absolute inset-0 bg-black/60 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
            <div className={`absolute right-0 top-0 h-full w-full md:w-[420px] bg-slate-950 border-l border-white/10 shadow-xl transition-transform transform ${open ? "translate-x-0" : "translate-x-full"}`}>

                <div className="p-4 flex items-center justify-between border-b border-white/10">
                    <div className="text-lg font-semibold text-slate-100">Carrinho</div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => { if (cart.length && confirm("Limpar carrinho?")) { saveCart([]); setCart([]); } }} className="text-xs text-slate-400">Limpar</button>
                        <button onClick={onClose} className="p-2 rounded-lg border border-white/10 bg-white/5"><X size={16} /></button>
                    </div>
                </div>

                <div className="p-4 flex flex-col gap-3 h-[calc(100%-180px)] overflow-auto">
                    {!cart.length ? (
                        <div className="text-slate-400">Carrinho vazio. Adicione planos.</div>
                    ) : cart.map((it, idx) => (
                        <div key={idx} className="rounded-xl border border-white/10 p-3 bg-gradient-to-b from-slate-900 to-slate-950">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-sm text-slate-200 font-semibold">{it.description}</div>
                                    <div className="text-xs text-slate-400 mt-1">{it.type || it.plan_code || "plan"}</div>
                                </div>

                                <div className="text-right">
                                    <div className="text-sm font-semibold text-slate-100">{Number(it.unit_price).toFixed(2)} {it.currency || "USD"}</div>
                                    <div className="text-xs text-slate-400 mt-1">Total: {(Number(it.unit_price) * Number(it.qty)).toFixed(2)}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-3">
                                <input type="number" min="1" value={it.qty} onChange={(e) => updateQty(idx, e.target.value)} className="w-20 px-2 py-1 rounded-xl border border-white/10 bg-black/20 text-sm text-slate-100" />
                                <button onClick={() => removeIndex(idx)} className="ml-auto px-2 py-1 rounded-xl border border-rose-700/30 bg-rose-900/10 text-xs text-rose-200 inline-flex items-center gap-2">
                                    <Trash2 size={14}/> Remover
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-400">Subtotal</div>
                        <div className="text-lg font-semibold text-slate-100">{subtotal}</div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                        <button onClick={handleCheckout} disabled={loadingCheckout} className="w-full px-4 py-2 rounded-xl border border-emerald-700/40 bg-emerald-900/10 text-emerald-200 font-semibold">
                            {loadingCheckout ? "Processando..." : "Checkout"}
                        </button>
                    </div>

                    <div className="mt-2 text-xs text-slate-400">Checkout tenta o endpoint <code>/shop/checkout</code>. Será solicitada chave do shop se necessário.</div>
                </div>
            </div>
        </div>
    );
}
