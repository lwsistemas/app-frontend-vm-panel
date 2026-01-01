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
};

export default PublicIpsApi;
