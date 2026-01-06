// src/services/publicPlans.jsx
import api from "../services"; // usa o mesmo client; se tiver auth interceptor, ok (GET sem header continua)

const PublicPlansApi = {
    list: async (params = {}) => {
        // retorna { ok, data, meta }
        const { data } = await api.get("/public/plans", { params });
        return data;
    },

    get: async (id) => {
        // opcional: se você quiser, pode criar /public/plans/:id no backend
        const { data } = await api.get(`/public/plans/${id}`);
        return data;
    },
};

export default PublicPlansApi;
