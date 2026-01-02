import api from "./index";

export default {
    async list(params = {}) {
        const { data } = await api.get("/invoices", { params });
        return data;
    },

    async pay(id) {
        const { data } = await api.post(`/invoices/${id}/pay`);
        return data;
    },

    async cancel(id) {
        const { data } = await api.post(`/invoices/${id}/cancel`);
        return data;
    },
};
