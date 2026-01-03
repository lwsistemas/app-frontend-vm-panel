// src/services/dashboard.js
import api from "../services";

export async function getDashboardSummary(params = {}) {
    const { data } = await api.get("/dashboard/summary", { params });
    return data;
}
