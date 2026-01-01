// src/services/inventoryHosts.jsx

import api from "./index";

/**
 * GET /inventory/hosts
 * Query params:
 *  - search
 *  - location
 *  - status
 *  - page
 *  - limit
 */
const InventoryHostsApi = {
    async list(params = {}) {
        const res = await api.get("/inventory/hosts", {
            params: {
                search: params.search || undefined,
                location: params.location || undefined,
                status: params.status || undefined,
                page: params.page || 1,
                limit: params.limit || 80,
            },
        });

        return res.data; // { ok, data, meta }
    },
};

export default InventoryHostsApi;
