// src/services/plans.jsx
import api from "./index.jsx";

const PlansApi = {
    list: async (params = {}) => {
        const { data } = await api.get("/plans", { params });
        return data;
    },

    get: async (id) => {
        const { data } = await api.get(`/plans/${id}`);
        return data;
    },

    create: async (payload) => {
        const { data } = await api.post("/plans", payload);
        return data;
    },

    update: async (id, payload) => {
        const { data } = await api.put(`/plans/${id}`, payload);
        return data;
    },

    setStatus: async (id, status) => {
        const { data } = await api.patch(`/plans/${id}/status`, { status });
        return data;
    },
};

export default PlansApi;
