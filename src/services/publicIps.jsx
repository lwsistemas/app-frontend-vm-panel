// src/services/publicIps.jsx
import api from "./index";

const PublicIpsApi = {
    async list(params = {}) {
        const res = await api.get("/inventory/ips", {
            params: {
                search: params.search || undefined,
                status: params.status || undefined,
                provider: params.provider || undefined,

                subnet: params.subnet || undefined,
                host_server_id: params.host_server_id || undefined,

                // filtro DC vem do servidor (backend trata via dc -> server_dc)
                dc: params.dc || undefined,

                vm_id: params.vm_id || undefined,
                mac: params.mac || undefined,
                external_id: params.external_id || undefined,

                sort: params.sort || undefined,
                order: params.order || undefined,

                page: params.page || 1,
                limit: params.limit || 25,
            },
        });

        return res.data;
    },

    async filters() {
        const res = await api.get("/inventory/ips/filters");
        return res.data;
    },

    async vmOptions(params = {}) {
        const res = await api.get("/inventory/vms/options", {
            params: {
                search: params.search || undefined,
                status: params.status || undefined,
                page: params.page || 1,
                limit: params.limit || 25,
            },
        });
        return res.data;
    },

    async update(id, payload) {
        const res = await api.patch(`/inventory/ips/${id}`, payload);
        return res.data;
    },

    // ✅ NOVO: bulk genérico
    // payload: { ids: [1,2,3], host_server_id?, status?, vm_id?, notes? }
    async bulkUpdate(payload = {}) {
        const res = await api.patch(`/inventory/ips/bulk`, payload);
        return res.data;
    },

    // ✅ NOVO: atalho operacional (atribuir host em lote)
    // ids: [1,2,3], host_server_id: number
    async assignHostBulk(ids = [], host_server_id) {
        const res = await api.post(`/inventory/ips/assign-host`, { ids, host_server_id });
        return res.data;
    },
};

export default PublicIpsApi;
