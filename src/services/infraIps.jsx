// src/services/infraIps.jsx
import api from "./index";

/**
 * Infra IPs API
 * Base: /infra
 *
 * GET  /infra/ips
 * GET  /infra/ips/:id
 * PATCH /infra/ips/:id
 */
const InfraIpsApi = {
    async list(params = {}) {
        const res = await api.get("/infra/ips", {
            params: {
                search: params.search || undefined,
                status: params.status || undefined,
                datacenter: params.datacenter || undefined,
                cluster_id: params.cluster_id || undefined,
                cluster_name: params.cluster_name || undefined,
                host_name: params.host_name || undefined,
                page: params.page || 1,
                limit: params.limit || 25,
            },
        });
        return res.data; // { ok, data, meta }
    },

    async get(id) {
        const res = await api.get(`/infra/ips/${id}`);
        return res.data; // { ok, data }
    },

    async update(id, payload) {
        const res = await api.patch(`/infra/ips/${id}`, payload);
        return res.data; // { ok, data }
    },
};

export default InfraIpsApi;
