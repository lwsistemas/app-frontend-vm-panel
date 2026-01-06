// src/services/prices.jsx
import api from "../services"; // seu api client central

const PricesApi = {
    calc: async (payload) => {
        // payload: { plan_id, qty, custom }
        const { data } = await api.post("/prices/calc", payload);
        return data;
    },
};

export default PricesApi;
