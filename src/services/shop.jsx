import api from "./index.jsx";

/**
 * SHOP SERVICE (ÚNICO)
 * Usa a instância api padrão (baseURL + interceptors)
 */

const Shop = {
    // PUBLIC
    plans: {
        list: () => api.get("/shop/plans").then(r => r.data),
        get: (id) => api.get(`/shop/plans/${id}`).then(r => r.data),
    },

    // PUBLIC
    products: {
        list: () => api.get("/shop/products").then(r => r.data),
        get: (id) => api.get(`/shop/products/${id}`).then(r => r.data),
    },

    // PUBLIC
    prices: {
        calc: (payload) => api.post("/shop/prices/calc", payload).then(r => r.data),
    },

    /**
     * AUTH (opcional pro shop, obrigatório se checkout exigir)
     * Obs: o interceptor já injeta Authorization se existir authKey no localStorage.
     */
    auth: {
        register: (payload) => api.post("/shop/users", payload).then(r => r.data),
        login: (payload) => api.post("/shop/users/login", payload).then(r => r.data),
        me: () => api.get("/shop/users/me").then(r => r.data),
    },

    // CHECKOUT (pode ser protegido no backend)
    checkout: {
        create: (payload, { idempotencyKey } = {}) => {
            const headers = {};
            if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

            return api
                .post("/shop/checkout", payload, { headers })
                .then(r => r.data);
        },
    },
};

export default Shop;
