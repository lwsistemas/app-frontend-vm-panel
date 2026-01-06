// src/pages/Public/PlanDetailSimPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PublicHeader from "./components/PublicHeader.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import PresetPanel from "./components/PresetPanel.jsx";
import Swal from "sweetalert2";
import { ArrowLeft } from "lucide-react";

import PricesApi from "../../../services/prices.jsx";
import ShopApi from "../../../services/shop.jsx";
import PublicProductsApi from "../../../services/publicProducts.jsx";

const LOCAL_KEY = "vm_panel_shop_cart_v1";

/* fakePlans left as before or kept minimal */
const fakePlans = [
    {
        id: 101,
        code: "VM_MEDIUM_CUSTOM",
        name: "VM Custom - Base Medium",
        type: "vm",
        billing_type: "recurring",
        interval: "month",
        default_price: 20.0,
        currency: "USD",
        description: "Base VM Medium. Customize CPU, RAM, Disk and addons.",
        meta: {
            default_cores: 2,
            default_memory_gb: 4,
            default_disk_gb: 80,
            per_core_price: 8.0,
            per_gb_ram_price: 1.5,
            per_100gb_disk_price: 5.0,
            windows_price: 12.0,
            backup_price_per_vm: 3.0,
            public_ip_price: 5.0,
            disk_types: { ssd: { multiplier: 1.0 }, nvme: { multiplier: 1.3 }, hdd: { multiplier: 0.6 } },
            min_cores: 1,
            max_cores: 64,
            min_memory_gb: 1,
            max_memory_gb: 512,
            presets: {
                small: { label: "Small", cores: 2, memory_gb: 4, disk_gb: 80, price: 10.0 },
                medium: { label: "Medium", cores: 4, memory_gb: 8, disk_gb: 160, price: 20.0 },
                large: { label: "Large", cores: 8, memory_gb: 16, disk_gb: 320, price: 40.0 }
            }
        }
    }
];

function currencyFmt(v, currency = "USD") {
    try {
        return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(v || 0));
    } catch {
        return `${Number(v || 0).toFixed(2)} ${currency}`;
    }
}

function saveCart(cart) {
    try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(cart));
    } catch (e) {
        console.error("saveCart error", e);
    }
    window.dispatchEvent(new Event("vm-panel-cart-updated"));
}

function loadCart() {
    try {
        const raw = localStorage.getItem(LOCAL_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export default function PlanDetailSimPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const plan = useMemo(() => {
        if (id) return fakePlans.find((p) => String(p.id) === String(id)) || fakePlans[0];
        return fakePlans[0];
    }, [id]);

    const meta = plan.meta || {};

    // presets / customizer state (same as before)
    const [selectedPresetKey, setSelectedPresetKey] = useState(Object.keys(meta.presets || {})[0] || null);
    const [cores, setCores] = useState(() => (meta.presets && meta.presets[selectedPresetKey]?.cores) ?? meta.default_cores ?? 1);
    const [memoryGb, setMemoryGb] = useState(() => (meta.presets && meta.presets[selectedPresetKey]?.memory_gb) ?? meta.default_memory_gb ?? 1);
    const [diskGb, setDiskGb] = useState(() => (meta.presets && meta.presets[selectedPresetKey]?.disk_gb) ?? meta.default_disk_gb ?? 20);
    const [diskType, setDiskType] = useState(meta.default_disk_type ?? (Object.keys(meta.disk_types || { ssd: {} })[0] || "ssd"));
    const [windows, setWindows] = useState(false);
    const [backup, setBackup] = useState(false);
    const [publicIpCount, setPublicIpCount] = useState(0);
    const [qty, setQty] = useState(1);

    // UI
    const [cartOpen, setCartOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [serverCalc, setServerCalc] = useState(null);
    const [serverCalcLoading, setServerCalcLoading] = useState(false);

    // products for this plan
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);

    // sync cart count
    useEffect(() => {
        function onCartUpdate() {
            const items = loadCart();
            setCartCount(items.reduce((a, i) => a + Number(i.qty || 0), 0));
        }
        onCartUpdate();
        window.addEventListener("vm-panel-cart-updated", onCartUpdate);
        window.addEventListener("storage", onCartUpdate);
        return () => {
            window.removeEventListener("vm-panel-cart-updated", onCartUpdate);
            window.removeEventListener("storage", onCartUpdate);
        };
    }, []);

    // load products for plan
    useEffect(() => {
        async function loadProducts() {
            setProductsLoading(true);
            try {
                const res = await PublicProductsApi.list({ plan_id: plan.id, status: "active" });
                if (res?.ok) setProducts(res.data || []);
                else setProducts([]);
            } catch (err) {
                console.error("loadProducts error", err);
                setProducts([]);
            } finally {
                setProductsLoading(false);
            }
        }
        loadProducts();
    }, [plan.id]);

    // local quick price (same as before)
    const localPrice = useMemo(() => {
        const base = Number(plan.default_price || 0);
        const perCore = Number(meta.per_core_price || 0);
        const perGbRam = Number(meta.per_gb_ram_price || 0);
        const per100Gb = Number(meta.per_100gb_disk_price || 0);
        const diskUnit = Number(meta.disk_unit_gb || 100);
        const extraCores = Math.max(0, cores - (meta.default_cores || 0));
        const coreCost = extraCores * perCore;
        const extraRam = Math.max(0, memoryGb - (meta.default_memory_gb || 0));
        const ramCost = extraRam * perGbRam;
        const diskDelta = Math.max(0, diskGb - (meta.default_disk_gb || 0));
        const diskUnits = diskUnit > 0 ? Math.ceil(diskDelta / diskUnit) : 0;
        const diskCost = diskUnits * per100Gb;
        const diskMultiplier = (meta.disk_types && meta.disk_types[diskType] && meta.disk_types[diskType].multiplier) || 1;
        const diskCostAdj = diskCost * diskMultiplier;
        const windowsCost = windows ? Number(meta.windows_price || 0) : 0;
        const backupCost = backup ? Number((meta.backup_price_per_vm ?? meta.backup_price_per_server) || 0) : 0;
        const ipCost = Number(publicIpCount || 0) * Number(meta.public_ip_price || 0);
        const single = base + coreCost + ramCost + diskCostAdj + windowsCost + backupCost + ipCost;
        return {
            single: Math.round(single * 100) / 100,
            total: Math.round(single * Number(qty || 1) * 100) / 100,
            breakdown: { base, coreCost, ramCost, diskCost, diskMultiplier, diskCostAdj, windowsCost, backupCost, ipCost }
        };
    }, [plan, meta, cores, memoryGb, diskGb, diskType, windows, backup, publicIpCount, qty]);

    // server calc
    async function fetchServerPrice({ usePreset = false, qtyToFetch = qty, presetKey = null, product } = {}) {
        setServerCalcLoading(true);
        try {
            if (product && product.price != null) {
                // product has snapshot price, return that quickly
                const fakeBreakdown = { base: Number(product.price) };
                const result = { unit_price: Number(product.price), total_price: Number(product.price) * Number(qtyToFetch || 1), breakdown: fakeBreakdown, pricing_version: "sku-v1" };
                setServerCalc(result);
                return result;
            }

            let custom = null;
            if (product && product.meta) {
                // try to derive custom from product.meta if present
                // product.meta could include preset values under meta.preset or similar
                const pm = product.meta;
                if (pm && typeof pm === "object") {
                    custom = {
                        cores: pm.cores ?? pm.default_cores,
                        memory_gb: pm.memory_gb ?? pm.default_memory_gb,
                        disk_gb: pm.disk_gb ?? pm.default_disk_gb,
                        disk_type: pm.disk_type ?? meta.default_disk_type,
                        windows: pm.windows || false,
                        backup: pm.backup || false,
                        public_ip_count: pm.public_ip_count || 0
                    };
                }
            }

            if (usePreset && presetKey) {
                const p = meta.presets && meta.presets[presetKey];
                if (p) {
                    custom = {
                        cores: p.cores,
                        memory_gb: p.memory_gb,
                        disk_gb: p.disk_gb,
                        disk_type: p.disk_type ?? meta.default_disk_type,
                        windows: p.windows || false,
                        backup: p.backup || false,
                        public_ip_count: p.public_ip_count || 0
                    };
                }
            }

            if (!custom) {
                custom = { cores, memory_gb: memoryGb, disk_gb: diskGb, disk_type: diskType, windows, backup, public_ip_count: publicIpCount };
            }

            const res = await PricesApi.calc({
                plan_id: plan.id,
                qty: Number(qtyToFetch || 1),
                custom
            });

            if (res?.ok && res.price) {
                setServerCalc(res.price);
                return res.price;
            } else {
                setServerCalc(null);
                throw new Error("Invalid calc response");
            }
        } catch (err) {
            console.error("fetchServerPrice error", err);
            setServerCalc(null);
            Swal.fire("Erro", "Falha ao calcular preço no servidor", "error");
            return null;
        } finally {
            setServerCalcLoading(false);
        }
    }

    // add product SKU to cart
    async function addProductToCart(product, count = 1) {
        try {
            if (!product) return;
            // if product.price exists, use it; else call server calc with product.meta
            const calc = await fetchServerPrice({ qtyToFetch: count, product });
            if (!calc) return;

            const cart = loadCart();
            const item = {
                plan_id: plan.id,
                product_id: product.id,
                plan_code: plan.code,
                description: `${plan.name} — ${product.sku}`,
                qty: Number(count || 1),
                unit_price: Number(calc.unit_price),
                currency: plan.currency || "USD",
                type: plan.type,
                meta: {
                    is_custom: false,
                    preset_key: product.preset_key || null,
                    product_meta: product.meta || null,
                    price_breakdown: calc.breakdown,
                    pricing_version: calc.pricing_version
                }
            };

            const key = item.plan_id + "|" + item.product_id + "|" + (item.meta.product_meta && JSON.stringify(item.meta.product_meta) || "");
            const idx = cart.findIndex(c => (c.plan_id + "|" + (c.product_id || "") + "|" + (c.meta && JSON.stringify(c.meta.product_meta) || "")) === key);
            if (idx >= 0) cart[idx].qty = Number(cart[idx].qty || 0) + Number(item.qty);
            else cart.push(item);

            saveCart(cart);
            Swal.fire("Adicionado", "SKU adicionado ao carrinho", "success");
            setCartOpen(true);
        } catch (err) {
            console.error("addProductToCart error", err);
            Swal.fire("Erro", "Falha ao adicionar SKU", "error");
        }
    }

    // buy product directly
    async function buyProductNow(product) {
        try {
            const calc = await fetchServerPrice({ product, qtyToFetch: 1 });
            if (!calc) return;

            const ok = await Swal.fire({
                title: "Confirmar compra",
                html: `<div style="text-align:left"><b>SKU:</b> ${product.sku}<br/><b>Unit:</b> ${currencyFmt(calc.unit_price, plan.currency)}</div>`,
                showCancelButton: true,
                confirmButtonText: "Confirmar"
            });
            if (!ok.isConfirmed) return;

            const payload = {
                customer: { owner_id: 2 },
                currency: plan.currency || "USD",
                items: [{
                    plan_id: plan.id,
                    product_id: product.id,
                    qty: 1,
                    customization: product.meta || null,
                    description: `${plan.name} — ${product.sku}`,
                    unit_price: calc.unit_price
                }],
                notes: "Shop buy SKU (simulação)"
            };

            const res = await ShopApi.checkout(payload);
            if (res?.invoice) Swal.fire("OK", `Invoice criada: ${res.invoice.number || res.invoice.id}`, "success");
            else if (res?.payment?.payment_link) Swal.fire("OK", `Link pagamento: ${res.payment.payment_link}`, "success");
            else Swal.fire("OK", "Checkout realizado", "success");
        } catch (err) {
            console.error("buyProductNow", err);
            Swal.fire("Erro", "Falha no checkout", "error");
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
            <PublicHeader cartCount={cartCount} onOpenCart={() => setCartOpen(true)} />

            <main className="max-w-6xl mx-auto p-6">
                <div className="mb-6">
                    <button onClick={() => navigate(-1)} className="text-slate-400 text-sm mb-2 flex items-center gap-2">
                        <ArrowLeft size={14} /> Voltar
                    </button>

                    <div className="rounded-2xl border border-white/10 p-6 bg-gradient-to-b from-slate-950 to-slate-900">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Left: Plan info + presets */}
                            <div className="lg:col-span-2">
                                <div className="text-xs text-slate-400 uppercase">{plan.code}</div>
                                <div className="text-2xl font-semibold text-slate-100 mt-1">{plan.name}</div>
                                <div className="text-sm text-slate-300 mt-3">{plan.description}</div>

                                <div className="mt-6">
                                    <PresetPanel
                                        plan={plan}
                                        selectedKey={selectedPresetKey}
                                        onSelectPreset={(key) => {
                                            setSelectedPresetKey(key);
                                            fetchServerPrice({ usePreset: true, presetKey: key, qtyToFetch: 1 });
                                        }}
                                        onCustomizePreset={(key, preset) => {
                                            setSelectedPresetKey(key);
                                            setCores(preset.cores ?? meta.default_cores ?? 1);
                                            setMemoryGb(preset.memory_gb ?? meta.default_memory_gb ?? 1);
                                            setDiskGb(preset.disk_gb ?? meta.default_disk_gb ?? 20);
                                            setDiskType(preset.disk_type ?? meta.default_disk_type ?? "ssd");
                                            setWindows(Boolean(preset.windows));
                                            setBackup(Boolean(preset.backup));
                                            setPublicIpCount(preset.public_ip_count || 0);
                                            fetchServerPrice({ usePreset: false, qtyToFetch: 1 });
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Right: Product SKU list + customizer */}
                            <div className="lg:col-span-2">
                                <div className="rounded-xl border border-white/10 p-4 bg-black/20">
                                    <div className="text-xs text-slate-400 mb-3">SKUs Disponíveis</div>

                                    {/* list products */}
                                    <div className="grid grid-cols-1 gap-3 mb-4">
                                        {productsLoading ? (
                                            <div className="text-slate-400">Carregando SKUs...</div>
                                        ) : !products.length ? (
                                            <div className="text-slate-400">Nenhum SKU disponível para esse plano.</div>
                                        ) : products.map((prod) => (
                                            <div key={prod.id} className="p-3 rounded-xl border border-white/5 bg-slate-900 flex items-center justify-between">
                                                <div>
                                                    <div className="font-semibold text-slate-100">{prod.sku}</div>
                                                    <div className="text-xs text-slate-400 mt-1">{prod.preset_key || "—"} · {prod.meta && prod.meta.region ? prod.meta.region : ''}</div>
                                                    <div className="text-xs text-slate-400 mt-1">Stock: {prod.stock === null ? '∞' : prod.stock}</div>
                                                </div>

                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-slate-100">{prod.price != null ? Number(prod.price).toFixed(2) : '—'}</div>
                                                    <div className="mt-2 flex gap-2">
                                                        <button onClick={() => addProductToCart(prod)} disabled={prod.stock === 0} className="px-3 py-1 rounded bg-emerald-800/20 text-emerald-200 text-sm">
                                                            Adicionar SKU
                                                        </button>
                                                        <button onClick={() => buyProductNow(prod)} disabled={prod.stock === 0} className="px-3 py-1 rounded border text-sm">
                                                            Comprar
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* separator */}
                                    <div className="border-t border-white/10 my-4" />

                                    {/* customizer UI (as previous) */}
                                    <div className="text-xs text-slate-400">Customizar</div>

                                    <div className="mt-3 space-y-3">
                                        <div>
                                            <label className="text-xs text-slate-300">Cores (vCPU)</label>
                                            <input type="range" min={Math.max(1, meta.min_cores || 1)} max={meta.max_cores || 64} value={cores} onChange={(e) => setCores(Number(e.target.value))} />
                                            <div className="text-sm text-slate-200">Cores: {cores}</div>
                                        </div>

                                        <div>
                                            <label className="text-xs text-slate-300">Memória (GB)</label>
                                            <input type="range" min={Math.max(1, meta.min_memory_gb || 1)} max={meta.max_memory_gb || 512} value={memoryGb} onChange={(e) => setMemoryGb(Number(e.target.value))} />
                                            <div className="text-sm text-slate-200">RAM: {memoryGb} GB</div>
                                        </div>

                                        <div>
                                            <label className="text-xs text-slate-300">Disco (GB)</label>
                                            <input type="range" min={Math.max(20, meta.min_disk_gb || 20)} max={meta.max_disk_gb || 2000} step={10} value={diskGb} onChange={(e) => setDiskGb(Number(e.target.value))} />
                                            <div className="text-sm text-slate-200">Disk: {diskGb} GB</div>
                                        </div>

                                        <div>
                                            <label className="text-xs text-slate-300">Tipo de Disco</label>
                                            <select value={diskType} onChange={(e) => setDiskType(e.target.value)} className="w-36 px-2 py-1 rounded-xl bg-black/20 border border-white/10 text-slate-200">
                                                {Object.keys(meta.disk_types || { ssd: {} }).map(dt => <option key={dt} value={dt}>{dt}</option>)}
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <label className="text-xs text-slate-300 flex items-center gap-2"><input type="checkbox" checked={windows} onChange={(e) => setWindows(e.target.checked)} /> Windows</label>
                                            <label className="text-xs text-slate-300 flex items-center gap-2"><input type="checkbox" checked={backup} onChange={(e) => setBackup(e.target.checked)} /> Backup</label>
                                        </div>

                                        <div>
                                            <label className="text-xs text-slate-300">IPs públicos</label>
                                            <input type="number" min={0} max={10} value={publicIpCount} onChange={(e) => setPublicIpCount(Number(e.target.value))} className="w-24 px-2 py-1 rounded-xl bg-black/20 border border-white/10 text-slate-200" />
                                        </div>

                                        <div>
                                            <label className="text-xs text-slate-300">Quantidade</label>
                                            <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} className="w-24 px-2 py-1 rounded-xl bg-black/20 border border-white/10 text-slate-200" />
                                        </div>
                                    </div>

                                    <div className="mt-4 border-t border-white/10 pt-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs text-slate-400">Preço local (estimado)</div>
                                            <div className="text-lg font-semibold text-slate-100">{currencyFmt(localPrice.single, plan.currency)}</div>
                                        </div>

                                        <div className="mt-2 flex items-center justify-between">
                                            <div className="text-xs text-slate-400">Total local</div>
                                            <div className="text-xl font-bold text-emerald-300">{currencyFmt(localPrice.total, plan.currency)}</div>
                                        </div>

                                        <div className="mt-3 grid gap-2">
                                            <div className="flex gap-2">
                                                <button onClick={() => addCustomToCart()} className="flex-1 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-200">Adicionar Custom</button>
                                                <button onClick={() => buyNowCustom()} className="flex-1 px-4 py-2 rounded-xl border border-white/10 bg-sky-500/10 text-sky-100 font-semibold">Comprar Custom</button>
                                            </div>
                                        </div>

                                        <div className="mt-3 text-xs text-slate-400">
                                            {serverCalc ? (
                                                <div>
                                                    <div><b>Preço servidor:</b> {currencyFmt(serverCalc.unit_price, plan.currency)} / unidade</div>
                                                    <div className="text-xs text-slate-300 mt-1">Último cálculo no servidor (v{serverCalc.pricing_version})</div>
                                                </div>
                                            ) : (
                                                <div className="text-xs">Clique em "Adicionar" ou "Comprar" para calcular o preço no servidor.</div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckoutSuccess={() => {}} />
        </div>
    );
}
