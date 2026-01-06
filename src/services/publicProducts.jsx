// src/services/publicProducts.jsx
import api from "../services";

const PublicProductsApi = {
    list: async (params = {}) => {
        // params: { plan_id, sku, status, limit, page }
        const { data } = await api.get("/public/products", { params });
        return data;
    },

    get: async (id) => {
        const { data } = await api.get(`/public/products/${id}`);
        return data;
    },
};

export default PublicProductsApi;
