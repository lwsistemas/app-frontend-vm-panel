// src/pages/Public/PlansPublicPage.jsx
import { useEffect, useState, useMemo } from "react";
import PublicPlansApi from "../../../services/publicPlans.jsx";
import PublicHeader from "./components/PublicHeader.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import Swal from "sweetalert2";
import { Plus } from "lucide-react";

function cls(...arr) { return arr.filter(Boolean).join(" "); }
const LOCAL_KEY = "vm_panel_shop_cart_v1";

export default function PlansPublicPage() {
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState([]);
    const [meta, setMeta] = useState({ page: 1, pages: 0, total: 0, limit: 12 });

    const [search, setSearch] = useState("");
    const [type, setType] = useState("");

    const [cartOpen, setCartOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        load();
        syncCartCount();
        // eslint-disable-next-line
    }, [meta.page, meta.limit]);

    function loadCartFromStorage() {
        try {
            const raw = localStorage.getItem(LOCAL_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    }
    function syncCartCount() {
        const c = loadCartFromStorage();
        setCartCount(c.reduce((a, i) => a + Number(i.qty || 0), 0));
    }

    async function load({ page = meta.page, limit = meta.limit } = {}) {
        setLoading(true);
        try {
            const params = { page, limit, search: search || undefined, type: type || undefined };
            const res = await PublicPlansApi.list(params);
            setPlans(Array.isArray(res.data) ? res.data : []);
            setMeta(res.meta || { page: 1, limit, total: 0, pages: 0 });
        } catch (err) {
            console.error(err);
            Swal.fire("Erro", "Falha ao carregar planos", "error");
        } finally {
            setLoading(false);
        }
    }

    function addToCart(plan) {
        const cart = loadCartFromStorage();
        const existingIndex = cart.findIndex(c => Number(c.plan_id) === Number(plan.id));
        if (existingIndex >= 0) {
            cart[existingIndex].qty = Number(cart[existingIndex].qty || 0) + 1;
        } else {
            cart.push({
                plan_id: plan.id,
                plan_code: plan.code,
                description: plan.name,
                qty: 1,
                unit_price: Number(plan.default_price || 0),
                currency: plan.currency || "USD",
                type: plan.type,
            });
        }
        localStorage.setItem(LOCAL_KEY, JSON.stringify(cart));
        syncCartCount();
        setCartOpen(true);
        Swal.fire({ icon: "success", title: "Adicionado", text: plan.name });
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
            <PublicHeader cartCount={cartCount} onOpenCart={() => setCartOpen(true)} />

            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-100">Catálogo de Plans</h1>
                        <p className="text-sm text-slate-400 mt-1">Escolha um plano e adicione ao carrinho.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar" className="px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-slate-200" />
                        <select value={type} onChange={(e) => setType(e.target.value)} className="px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-slate-200">
                            <option value="">Todos os tipos</option>
                            <option value="vm">vm</option>
                            <option value="ip">ip</option>
                            <option value="storage">storage</option>
                            <option value="backup">backup</option>
                            <option value="license">license</option>
                            <option value="service">service</option>
                        </select>
                        <button onClick={() => load({ page: 1 })} className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm">Buscar</button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-slate-400">Carregando...</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {plans.map(p => (
                            <div key={p.id} className="rounded-2xl border border-white/10 p-4 bg-gradient-to-b from-slate-950 to-slate-900">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="text-xs text-slate-400">{p.code}</div>
                                        <div className="text-lg font-semibold text-slate-100">{p.name}</div>
                                        <div className="text-xs text-slate-500 mt-1">{p.type} · {p.billing_type}{p.interval ? ` · ${p.interval}` : ''}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-slate-100">{Number(p.default_price || 0).toFixed(2)}</div>
                                        <div className="text-xs text-slate-400">{p.currency}</div>
                                    </div>
                                </div>

                                {p.description ? <div className="text-sm text-slate-300 mt-3">{p.description}</div> : null}

                                <div className="mt-4 flex items-center gap-2">
                                    <button onClick={() => addToCart(p)} className="px-3 py-2 rounded-xl border border-emerald-700/40 bg-emerald-900/10 text-emerald-200 flex items-center gap-2">
                                        <Plus size={14}/> Adicionar
                                    </button>

                                    <a href={`/plans/${p.id}`} className="ml-auto text-xs text-slate-400">Ver detalhes</a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-6 flex items-center justify-between">
                    <div className="text-xs text-slate-400">Total: {meta.total || 0}</div>
                    <div className="flex items-center gap-2">
                        <button disabled={meta.page <= 1} onClick={() => setMeta(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))} className="px-3 py-2 rounded-xl border border-white/10 bg-white/5">Prev</button>
                        <div className="text-xs text-slate-400">Página {meta.page} / {meta.pages}</div>
                        <button disabled={meta.page >= meta.pages} onClick={() => setMeta(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))} className="px-3 py-2 rounded-xl border border-white/10 bg-white/5">Next</button>
                    </div>
                </div>
            </main>

            <CartDrawer open={cartOpen} onClose={() => { setCartOpen(false); syncCartCount(); }} onCheckoutSuccess={() => { syncCartCount(); }} />
        </div>
    );
}
