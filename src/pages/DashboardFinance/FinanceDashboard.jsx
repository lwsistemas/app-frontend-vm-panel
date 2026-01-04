import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
    RefreshCcw,
    DollarSign,
    Receipt,
    AlertTriangle,
    TrendingUp,
    Users,
    Server,
    Layers,
    ExternalLink,
    Ticket,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import axios from "axios";
import ReactApexChart from "react-apexcharts";

// ====================== Utils ======================
function cls(...arr) {
    return arr.filter(Boolean).join(" ");
}

function fmtMoney(v, currency = "USD") {
    if (v === null || v === undefined) return "—";
    const n = Number(v);
    if (Number.isNaN(n)) return "—";
    return `${n.toFixed(2)} ${currency}`;
}

function safeNum(n) {
    const x = Number(n);
    return Number.isFinite(x) ? x : 0;
}

function pickCurrency() {
    return "USD";
}

function sortTypes(byType = []) {
    return [...byType].sort((a, b) => {
        const aActive = safeNum(a.active);
        const bActive = safeNum(b.active);
        if (bActive !== aActive) return bActive - aActive;

        const aOpen = safeNum(a.open_total);
        const bOpen = safeNum(b.open_total);
        if (bOpen !== aOpen) return bOpen - aOpen;

        const aMrr = safeNum(a.estimated_mrr);
        const bMrr = safeNum(b.estimated_mrr);
        return bMrr - aMrr;
    });
}

function isPrivilegedRole(role) {
    const r = String(role || "").toLowerCase();
    return ["root", "admin", "support"].includes(r);
}

function normalizeDailyLabels(labels = []) {
    return labels.map((x) => {
        const s = String(x || "");
        if (s.length >= 10) return s.slice(5, 10);
        return s;
    });
}

// ====================== Apex Theme ======================
function apexBaseOptions() {
    return {
        chart: {
            toolbar: { show: false },
            zoom: { enabled: false },
            foreColor: "#94a3b8",
            fontFamily: "Inter, ui-sans-serif, system-ui",
        },
        grid: {
            borderColor: "rgba(255,255,255,0.06)",
            strokeDashArray: 4,
        },
        dataLabels: { enabled: false },
        tooltip: { theme: "dark" },
        legend: { labels: { colors: "#cbd5e1" } },
        xaxis: {
            labels: { style: { colors: "#94a3b8" } },
            axisBorder: { color: "rgba(255,255,255,0.08)" },
            axisTicks: { color: "rgba(255,255,255,0.08)" },
        },
        yaxis: { labels: { style: { colors: "#94a3b8" } } },
    };
}

// ====================== Alerts ======================
function buildInternalAlerts(summary, currency) {
    const out = [];
    const kpis = summary?.kpis || {};
    const inv = summary?.inventorySummary || {};

    const overdueTotal = safeNum(kpis.overdue_total);
    const openTotal = safeNum(kpis.open_total);
    const unpaid = safeNum(inv.services_unpaid_active);
    const mrr = safeNum(inv.estimated_mrr);

    if (overdueTotal > 0) {
        out.push({
            key: "OVERDUE_TOTAL",
            tone: "red",
            title: "Faturas vencidas",
            desc: `Existe total vencido de ${fmtMoney(overdueTotal, currency)}.`,
        });
    }

    if (openTotal > 0) {
        out.push({
            key: "OPEN_TOTAL",
            tone: "amber",
            title: "Faturas em aberto",
            desc: `Existe total em aberto de ${fmtMoney(openTotal, currency)}.`,
        });
    }

    if (unpaid > 0) {
        out.push({
            key: "UNPAID_SERVICES",
            tone: "red",
            title: "Serviços ativos sem pagamento",
            desc: `${unpaid} serviços ativos marcados como unpaid_active.`,
        });
    }

    if (mrr <= 0) {
        out.push({
            key: "MRR_ZERO",
            tone: "slate",
            title: "MRR zerado",
            desc: `Estimated MRR está ${fmtMoney(mrr, currency)}.`,
        });
    }

    return out;
}

// ====================== Page ======================
export default function FinanceDashboard() {
    const navigate = useNavigate();

    // ✅ Hooks SEMPRE no topo
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [err, setErr] = useState(null);
    const [typesExpanded, setTypesExpanded] = useState(false);

    const currency = useMemo(() => pickCurrency(), []);

    // ✅ Derivações com fallback seguro (não depende de summary existir)
    const scope = summary?.scope || {};
    const range = summary?.range || {};
    const kpis = summary?.kpis || {};
    const inventory = summary?.inventorySummary || {};
    const charts = summary?.charts || {};
    const topDebtors = summary?.topDebtors || [];
    const backendAlerts = Array.isArray(summary?.alerts) ? summary.alerts : [];

    const privileged = useMemo(() => isPrivilegedRole(scope.role), [scope.role]);

    const byTypeSorted = useMemo(() => sortTypes(inventory.byType || []), [inventory.byType]);
    const typesTop = useMemo(() => byTypeSorted.slice(0, 4), [byTypeSorted]);
    const typesRest = useMemo(() => byTypeSorted.slice(4), [byTypeSorted]);

    const internalAlerts = useMemo(() => buildInternalAlerts(summary, currency), [summary, currency]);

    const mergedAlerts = useMemo(() => {
        const mappedBackend = backendAlerts.map((a, idx) => ({
            key: `BACK_${idx}`,
            tone: "red",
            title: "Alerta (backend)",
            desc: typeof a === "string" ? a : JSON.stringify(a),
        }));
        return [...internalAlerts, ...mappedBackend];
    }, [backendAlerts, internalAlerts]);

    // ====================== Apex data (com fallback seguro) ======================
    const cashflowPaid = charts?.cashflowPaid || { labels: [], series: [] };
    const cashflowPaidLabels = cashflowPaid.labels || [];
    const cashflowPaidSeries = useMemo(
        () =>
            (cashflowPaid.series || []).map((s) => ({
                name: s.name,
                data: (s.data || []).map((v) => safeNum(v)),
            })),
        [cashflowPaid.series]
    );

    const cashflowOpenDue = charts?.cashflowOpenDue || { labels: [], series: [] };
    const openDueLabels = cashflowOpenDue.labels || [];
    const openDueSeries = useMemo(
        () =>
            (cashflowOpenDue.series || []).map((s) => ({
                name: s.name,
                data: (s.data || []).map((v) => safeNum(v)),
            })),
        [cashflowOpenDue.series]
    );

    const revenueByType = charts?.revenueByType || { labels: [], series: [] };
    const revenueLabels = revenueByType.labels || [];
    const revenueSeries = useMemo(
        () =>
            (revenueByType.series || []).map((s) => ({
                name: s.name,
                data: (s.data || []).map((v) => safeNum(v)),
            })),
        [revenueByType.series]
    );

    const invByStatus = charts?.invoicesByStatus || { labels: [], series: [] };
    const invStatusLabels = invByStatus.labels || [];
    const invStatusSeries = useMemo(() => {
        const raw = invByStatus.series?.[0]?.data || [];
        return raw.map((v) => safeNum(v));
    }, [invByStatus.series]);

    // ====================== Apex options (SEM depender de return) ======================
    const areaPaidOptions = useMemo(() => {
        const base = apexBaseOptions();
        return {
            ...base,
            chart: { ...base.chart, type: "area", height: 280 },
            stroke: { curve: "smooth", width: 2 },
            fill: {
                type: "gradient",
                gradient: {
                    shadeIntensity: 0.35,
                    opacityFrom: 0.55,
                    opacityTo: 0.05,
                    stops: [0, 90, 100],
                },
            },
            xaxis: { ...base.xaxis, categories: normalizeDailyLabels(cashflowPaidLabels) },
            tooltip: { ...base.tooltip, y: { formatter: (val) => fmtMoney(val, currency) } },
        };
    }, [cashflowPaidLabels, currency]);

    const stackedBarOptions = useMemo(() => {
        const base = apexBaseOptions();
        return {
            ...base,
            chart: { ...base.chart, type: "bar", stacked: true, height: 280 },
            plotOptions: {
                bar: { borderRadius: 6, columnWidth: "60%" },
            },
            xaxis: { ...base.xaxis, categories: normalizeDailyLabels(openDueLabels) },
            tooltip: { ...base.tooltip, y: { formatter: (val) => fmtMoney(val, currency) } },
        };
    }, [openDueLabels, currency]);

    const revenueBarOptions = useMemo(() => {
        const base = apexBaseOptions();
        return {
            ...base,
            chart: { ...base.chart, type: "bar", stacked: true, height: 360 },
            plotOptions: {
                bar: {
                    horizontal: true,
                    borderRadius: 6,
                    barHeight: "65%",
                },
            },
            xaxis: { ...base.xaxis, categories: revenueLabels },
            tooltip: { ...base.tooltip, y: { formatter: (val) => fmtMoney(val, currency) } },
            legend: { ...base.legend, position: "bottom" },
        };
    }, [revenueLabels, currency]);

    const donutOptions = useMemo(() => {
        const base = apexBaseOptions();
        return {
            ...base,
            chart: { ...base.chart, type: "donut", height: 320 },
            labels: invStatusLabels,
            stroke: { width: 0 },
            plotOptions: {
                pie: {
                    donut: {
                        size: "72%",
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                label: "Invoices",
                                color: "#cbd5e1",
                                formatter: (w) => {
                                    const t = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                                    return String(t);
                                },
                            },
                        },
                    },
                },
            },
            tooltip: { ...base.tooltip, y: { formatter: (val) => `${val} invoices` } },
            legend: { ...base.legend, position: "bottom" },
        };
    }, [invStatusLabels]);

    // ====================== Load ======================
    async function load() {
        setLoading(true);
        setErr(null);

        try {
            const authKey = localStorage.getItem("authKey");
            const url = `${
                import.meta.env.VITE_API_URL || "http://localhost:4430"
            }/dashboard/finance/summary`;

            const { data } = await axios.get(url, {
                headers: { Authorization: `Bearer ${authKey}` },
            });

            if (!data?.ok) throw new Error("Resposta inválida");
            setSummary(data);
        } catch (e) {
            console.error(e);
            setErr(e?.message || "Falha ao carregar finance summary");
            Swal.fire("Erro", "Falha ao carregar dashboard financeiro", "error");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    // ====================== Now: safe returns (no hooks below) ======================
    if (loading) {
        return <div className="p-6 text-slate-400">Carregando dashboard financeiro...</div>;
    }

    if (!summary) {
        return (
            <div className="p-6 text-slate-400">
                Dashboard indisponível.
                {err ? <span className="ml-2 text-red-400">({err})</span> : null}
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* HEADER */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                    <div className="text-lg font-semibold text-slate-100">Dashboard Financeiro</div>
                    <div className="text-xs text-slate-400 flex flex-wrap gap-2">
            <span>
              Range:{" "}
                <span className="text-slate-200 font-semibold">
                {range.from} → {range.to}
              </span>
            </span>
                        <span className="opacity-50">•</span>
                        <span>
              Group: <span className="text-slate-200 font-semibold">{range.groupBy}</span>
            </span>
                        <span className="opacity-50">•</span>
                        <span>
              Role: <span className="text-slate-200 font-semibold">{scope.role}</span>
            </span>
                        <span className="opacity-50">•</span>
                        <span>
              Owner: <span className="text-slate-200 font-semibold">{scope.owner_id ?? "GLOBAL"}</span>
            </span>
                    </div>
                </div>

                <button
                    onClick={load}
                    className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold"
                >
          <span className="flex items-center gap-2">
            <RefreshCcw size={16} />
            Atualizar
          </span>
                </button>
            </div>

            {/* TELEMETRIA STRIP */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 px-4 py-3">
                <div className="flex flex-wrap gap-2 items-center">
                    <MiniChip label="Paid Count" value={kpis.paid_count ?? 0} tone="emerald" />
                    <MiniChip label="Open Count" value={kpis.open_count ?? 0} tone="amber" />
                    <MiniChip label="Overdue Count" value={kpis.overdue_count ?? 0} tone="red" />
                    <MiniChip label="Services Active" value={inventory.services_active ?? 0} tone="sky" />
                    <MiniChip label="MRR" value={fmtMoney(inventory.estimated_mrr, currency)} tone="slate" />
                    <MiniChip label="Avg Ticket" value={fmtMoney(inventory.avg_ticket_service, currency)} tone="slate" />
                </div>
            </div>

            {/* KPI STRIP */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KpiCard title="Recebido" icon={<DollarSign size={16} className="text-emerald-300" />} value={fmtMoney(kpis.paid_total, currency)} hint={`${kpis.paid_count || 0} invoices`} tone="emerald" />
                <KpiCard title="Em Aberto" icon={<Receipt size={16} className="text-amber-300" />} value={fmtMoney(kpis.open_total, currency)} hint={`${kpis.open_count || 0} invoices`} tone="amber" />
                <KpiCard title="Vencido" icon={<AlertTriangle size={16} className="text-red-300" />} value={fmtMoney(kpis.overdue_total, currency)} hint={`${kpis.overdue_count || 0} invoices`} tone="red" />
                <KpiCard title="Refund" icon={<TrendingUp size={16} className="text-slate-300" />} value={fmtMoney(kpis.refund_total, currency)} hint={`${kpis.refund_count || 0} invoices`} tone="slate" />
            </div>

            {/* PRIVILEGED ONLY */}
            {privileged ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Panel title="Inventory Summary" subtitle="Serviços e MRR" icon={<Layers size={16} className="text-sky-300" />}>
                        <div className="grid grid-cols-2 gap-3">
                            <MiniStat label="Services Total" value={inventory.services_total ?? 0} />
                            <MiniStat label="Active" value={inventory.services_active ?? 0} />
                            <MiniStat label="Suspended" value={inventory.services_suspended ?? 0} />
                            <MiniStat label="Unpaid Active" value={inventory.services_unpaid_active ?? 0} />
                        </div>

                        <div className="mt-4 border-t border-white/10 pt-4 space-y-2">
                            <MiniStat label="Estimated MRR" value={fmtMoney(inventory.estimated_mrr, currency)} strong />
                            <MiniStat label="Avg ticket service" value={fmtMoney(inventory.avg_ticket_service, currency)} />
                        </div>
                    </Panel>

                    <Panel title="Top Debtors" subtitle="Devedores (open/overdue)" icon={<Users size={16} className="text-sky-300" />}>
                        <DebtorsList
                            data={topDebtors}
                            currency={currency}
                            onOpenInvoices={(ownerId) => navigate(`/invoices?owner_id=${ownerId}&status=pending`)}
                            onTicket={(ownerId) => Swal.fire("Em breve", `Cobrança via ticket (owner_id=${ownerId})`, "info")}
                        />
                    </Panel>

                    <Panel title="Alerts" subtitle="Operacional + backend" icon={<AlertTriangle size={16} className="text-red-300" />}>
                        {mergedAlerts.length === 0 ? (
                            <div className="text-sm text-slate-400">Nenhum alerta no período.</div>
                        ) : (
                            <div className="space-y-2">
                                {mergedAlerts.map((a) => (
                                    <AlertItem key={a.key} tone={a.tone} title={a.title} desc={a.desc} />
                                ))}
                            </div>
                        )}
                    </Panel>
                </div>
            ) : null}

            {/* Revenue by Type - ALL */}
            <Panel
                title="Revenue by Type"
                subtitle="Paid/Open/Overdue por tipo"
                icon={<Server size={16} className="text-sky-300" />}
                right={
                    byTypeSorted.length > 4 ? (
                        <button
                            onClick={() => setTypesExpanded((p) => !p)}
                            className="text-xs px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 font-semibold"
                        >
              <span className="inline-flex items-center gap-2">
                {typesExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {typesExpanded ? "Recolher" : "Ver todos"}
              </span>
                        </button>
                    ) : null
                }
            >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <TypeBreakdown byType={typesTop} currency={currency} />
                    {typesExpanded && typesRest.length > 0 ? (
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3 max-h-[520px] overflow-auto">
                            <TypeBreakdown byType={typesRest} currency={currency} compact />
                        </div>
                    ) : (
                        <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
                            Tipos restantes recolhidos.
                            <div className="text-xs text-slate-500 mt-2">
                                Clique em <span className="text-slate-200 font-semibold">Ver todos</span> para expandir.
                            </div>
                        </div>
                    )}
                </div>
            </Panel>

            {/* CHARTS (ALL) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Panel title="Cashflow Paid" subtitle="Recebidos no período" icon={<TrendingUp size={16} className="text-emerald-300" />}>
                    {cashflowPaidSeries.length ? (
                        <ReactApexChart options={areaPaidOptions} series={cashflowPaidSeries} type="area" height={280} />
                    ) : (
                        <Empty text="Sem dados para cashflow paid." />
                    )}
                </Panel>

                <Panel title="Open vs Overdue" subtitle="Abertos vs vencidos no período" icon={<AlertTriangle size={16} className="text-amber-300" />}>
                    {openDueSeries.length ? (
                        <ReactApexChart options={stackedBarOptions} series={openDueSeries} type="bar" height={280} />
                    ) : (
                        <Empty text="Sem dados para open/overdue." />
                    )}
                </Panel>

                <Panel title="Invoices by Status" subtitle="Distribuição por status" icon={<Receipt size={16} className="text-sky-300" />}>
                    {invStatusSeries.length ? (
                        <ReactApexChart options={donutOptions} series={invStatusSeries} type="donut" height={320} />
                    ) : (
                        <Empty text="Sem dados para status." />
                    )}
                </Panel>

                <Panel title="Revenue by Type (Chart)" subtitle="Stacked por tipo" icon={<Layers size={16} className="text-sky-300" />}>
                    {revenueSeries.length ? (
                        <ReactApexChart options={revenueBarOptions} series={revenueSeries} type="bar" height={360} />
                    ) : (
                        <Empty text="Sem dados para revenue by type." />
                    )}
                </Panel>
            </div>
        </div>
    );
}

// ====================== Components ======================
function Panel({ title, subtitle, icon, right, children }) {
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
                {right ? <div className="text-xs text-slate-500">{right}</div> : null}
            </div>
            {children}
        </div>
    );
}

function KpiCard({ title, value, hint, icon, tone = "slate" }) {
    return (
        <div
            className={cls(
                "rounded-2xl border bg-gradient-to-b from-slate-950 to-slate-900 p-4",
                tone === "emerald" && "border-emerald-700/30",
                tone === "amber" && "border-amber-700/30",
                tone === "red" && "border-red-700/30",
                tone === "slate" && "border-white/10"
            )}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="text-xs uppercase tracking-wide text-slate-500">{title}</div>
                {icon}
            </div>
            <div className="text-2xl font-bold text-slate-100">{value}</div>
            <div className="text-xs text-slate-400 mt-1">{hint}</div>
        </div>
    );
}

function MiniStat({ label, value, strong }) {
    return (
        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <div className="text-[11px] text-slate-500">{label}</div>
            <div className={cls("text-sm", strong ? "text-slate-100 font-bold" : "text-slate-200")}>
                {value}
            </div>
        </div>
    );
}

function MiniChip({ label, value, tone = "slate" }) {
    return (
        <span
            className={cls(
                "text-[11px] px-3 py-2 rounded-xl border bg-black/20 inline-flex items-center gap-2",
                tone === "emerald" && "border-emerald-700/40 text-emerald-200",
                tone === "amber" && "border-amber-700/40 text-amber-200",
                tone === "red" && "border-red-700/40 text-red-200",
                tone === "sky" && "border-sky-700/40 text-sky-200",
                tone === "slate" && "border-white/10 text-slate-300"
            )}
        >
      <span className="opacity-80">{label}:</span>
      <span className="text-slate-100 font-semibold">{value}</span>
    </span>
    );
}

function AlertItem({ tone, title, desc }) {
    return (
        <div
            className={cls(
                "rounded-xl border px-4 py-3",
                tone === "red" && "border-red-800/40 bg-red-900/10 text-red-200",
                tone === "amber" && "border-amber-800/40 bg-amber-900/10 text-amber-200",
                tone === "slate" && "border-white/10 bg-black/20 text-slate-300"
            )}
        >
            <div className="text-sm font-semibold">{title}</div>
            <div className="text-xs opacity-90 mt-1">{desc}</div>
        </div>
    );
}

function Empty({ text }) {
    return (
        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-slate-400">
            {text}
        </div>
    );
}

function TypeBreakdown({ byType, currency, compact }) {
    if (!byType?.length) return <div className="text-sm text-slate-400">Sem dados.</div>;

    return (
        <div className={cls("space-y-2", compact && "opacity-90")}>
            {byType.map((t) => (
                <div key={t.type} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-sm text-slate-100 font-semibold">{t.label}</div>
                            <div className="text-xs text-slate-500">type: {t.type}</div>
                        </div>
                        <span className="text-xs text-slate-400">
              Active: <span className="text-slate-200 font-semibold">{t.active}</span>
            </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3">
                        <MiniStat label="Paid" value={fmtMoney(t.paid_total, currency)} />
                        <MiniStat label="Open" value={fmtMoney(t.open_total, currency)} />
                        <MiniStat label="Overdue" value={fmtMoney(t.overdue_total, currency)} />
                    </div>

                    <div className="mt-3">
                        <MiniStat label="Estimated MRR" value={fmtMoney(t.estimated_mrr, currency)} strong />
                    </div>
                </div>
            ))}
        </div>
    );
}

function DebtorsList({ data, currency, onOpenInvoices, onTicket }) {
    if (!data?.length) return <div className="text-sm text-slate-400">Sem devedores no período.</div>;

    return (
        <div className="space-y-2">
            {data.map((d) => (
                <div key={d.owner_id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-sm text-slate-100 font-semibold truncate">
                                {d.customer?.name || `Owner #${d.owner_id}`}
                            </div>
                            <div className="text-xs text-slate-500 truncate">{d.customer?.email || "—"}</div>
                        </div>
                        <span className="text-xs text-slate-400">
              Owner: <span className="text-slate-200 font-semibold">{d.owner_id}</span>
            </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3">
                        <MiniStat label="Open" value={fmtMoney(d.open_total, currency)} strong />
                        <MiniStat label="Overdue" value={fmtMoney(d.overdue_total, currency)} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <MiniStat label="Invoices overdue" value={d.invoices_overdue ?? 0} />
                        <MiniStat label="Unpaid services" value={d.unpaid_active_services ?? 0} />
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                        <button
                            onClick={() => onOpenInvoices?.(d.owner_id)}
                            className="text-xs px-3 py-2 rounded-xl border border-sky-700/40 bg-sky-900/10 hover:bg-sky-900/15 text-sky-200 font-semibold"
                        >
              <span className="inline-flex items-center gap-2">
                <ExternalLink size={14} />
                Ver invoices
              </span>
                        </button>

                        <button
                            onClick={() => onTicket?.(d.owner_id)}
                            className="text-xs px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 font-semibold opacity-80"
                            title="Vai virar ticket pro DC"
                        >
              <span className="inline-flex items-center gap-2">
                <Ticket size={14} />
                Cobrar (ticket)
              </span>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
