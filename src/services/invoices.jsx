// src/services/invoices.jsx
import api from "../services";

// LIST
export async function listInvoices(params = {}) {
    const { data } = await api.get("/invoices", { params });
    return data;
}

// DETAIL
export async function getInvoice(id) {
    const { data } = await api.get(`/invoices/${id}`);
    return data;
}

// UPDATE (se usar)
export async function updateInvoice(id, payload) {
    const { data } = await api.put(`/invoices/${id}`, payload);
    return data;
}

// STATUS (oficial)
export async function setInvoiceStatus(id, status) {
    const { data } = await api.patch(`/invoices/${id}/status`, { status });
    return data;
}

// ITEMS
export async function addInvoiceItem(invoiceId, payload) {
    const { data } = await api.post(`/invoices/${invoiceId}/items`, payload);
    return data;
}

export async function updateInvoiceItem(invoiceId, itemId, payload) {
    const { data } = await api.put(`/invoices/${invoiceId}/items/${itemId}`, payload);
    return data;
}

export async function deleteInvoiceItem(invoiceId, itemId) {
    const { data } = await api.delete(`/invoices/${invoiceId}/items/${itemId}`);
    return data;
}

// PAYMENTS
export async function listInvoicePayments(invoiceId) {
    const { data } = await api.get(`/invoices/${invoiceId}/payments`);
    return data;
}

export async function addInvoicePayment(invoiceId, payload) {
    // payload mínimo: { amount, method, paid_at? }
    const { data } = await api.post(`/invoices/${invoiceId}/payments`, payload);
    return data;
}
