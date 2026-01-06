// src/services/shop.jsx
import api from "./index.jsx";

/**
 * SHOP SERVICE (ÚNICO)
 * - usa api padrão
 * - /shop/* para catalogo/checkout
 * - /prices/calc para cálculo (rota global no backend)
 */

const Shop = {
    // PLANS (PUBLIC)
    plans: {
        list: (params = {}) =>
            api.get("/shop/plans", { params }).then((r) => r.data),

        get: (id, params = {}) =>
            api.get(`/shop/plans/${id}`, { params }).then((r) => r.data),
    },

    // PRODUCTS (PUBLIC)
    products: {
        list: (params = {}) =>
            api.get("/shop/products", { params }).then((r) => r.data),

        get: (id, params = {}) =>
            api.get(`/shop/products/${id}`, { params }).then((r) => r.data),
    },

    // ✅ PRICE CALC (GLOBAL)
    prices: {
        calc: (payload) =>
            api.post("/prices/calc", payload).then((r) => r.data),
    },

    // AUTH (se usar depois)
    auth: {
        register: (payload) => api.post("/shop/users", payload).then((r) => r.data),
        login: (payload) => api.post("/shop/users/login", payload).then((r) => r.data),
        me: () => api.get("/shop/users/me").then((r) => r.data),
    },

    // CHECKOUT
    checkout: {
        create: (payload, { idempotencyKey } = {}) => {
            const headers = {};
            if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
            return api.post("/shop/checkout", payload, { headers }).then((r) => r.data);
        },
    },
};

export default Shop;
