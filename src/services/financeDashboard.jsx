// src/services/financeDashboard.jsx
import api from "./index.jsx";

/**
 * Finance Dashboard API
 *
 * GET /dashboard/finance/summary
 *
 * Params (todos opcionais):
 *  - from: "YYYY-MM-DD"
 *  - to: "YYYY-MM-DD"
 *  - groupBy: "day" | "week" | "month"
 *  - currency: "USD" | "BRL" | ...
 *  - owner_id: number (somente privileged no backend)
 *
 * Retorno:
 *  {
 *    ok: true,
 *    range: { from, to, groupBy },
 *    scope: { owner_id, role },
 *    kpis: {...},
 *    inventorySummary: {...},
 *    charts: {...},
 *    topDebtors: [...],
 *    alerts: [...]
 *  }
 */
export async function getFinanceSummary(params = {}) {
    const { data } = await api.get("/dashboard/finance/summary", { params });
    return data;
}

export default {
    getFinanceSummary,
};
