// src/services/invoices.jsx
import api from "../services";

const InvoicesApi = {
    // LIST
    list: async (params = {}) => {
        const { data } = await api.get("/invoices", { params });
        return data;
    },

    // CREATE ✅ (faltava)
    create: async (payload, params = {}) => {
        // params opcional: { owner_id } -> privileged pode criar para outro owner via querystring
        const { data } = await api.post("/invoices", payload, { params });
        return data;
    },

    // DETAIL
    get: async (id) => {
        const { data } = await api.get(`/invoices/${id}`);
        return data;
    },

    // UPDATE (se usar)
    update: async (id, payload) => {
        const { data } = await api.put(`/invoices/${id}`, payload);
        return data;
    },

    // STATUS (oficial)
    setStatus: async (id, status) => {
        const { data } = await api.patch(`/invoices/${id}/status`, { status });
        return data;
    },

    // ITEMS
    addItem: async (invoiceId, payload) => {
        const { data } = await api.post(`/invoices/${invoiceId}/items`, payload);
        return data;
    },

    updateItem: async (invoiceId, itemId, payload) => {
        const { data } = await api.put(`/invoices/${invoiceId}/items/${itemId}`, payload);
        return data;
    },

    deleteItem: async (invoiceId, itemId) => {
        const { data } = await api.delete(`/invoices/${invoiceId}/items/${itemId}`);
        return data;
    },

    // PAYMENTS
    listPayments: async (invoiceId) => {
        const { data } = await api.get(`/invoices/${invoiceId}/payments`);
        return data;
    },

    addPayment: async (invoiceId, payload) => {
        // payload: { amount: number, method: string, reference?: string }
        const { data } = await api.post(`/invoices/${invoiceId}/payments`, payload);
        return data;
    },
};

export default InvoicesApi;
