// src/services/inventoryLinks.jsx

import api from "./index";

/**
 * InventoryLinks API
 * Rotas:
 *  - GET    /inventory/servers/:id/links
 *  - POST   /inventory/servers/:id/links
 *  - PATCH  /inventory/servers/:id/links/:linkId/disable
 */

const InventoryLinksApi = {
    async list(serverId) {
        if (!serverId) throw new Error("serverId é obrigatório");

        const res = await api.get(`/inventory/servers/${serverId}/links`);
        return res.data; // { ok, data }
    },

    async create(serverId, payload) {
        if (!serverId) throw new Error("serverId é obrigatório");

        const body = {
            provider: payload?.provider,
            external_id: payload?.external_id,
            label: payload?.label,
            dc: payload?.dc,
            match_type: payload?.match_type || "manual",
        };

        const res = await api.post(`/inventory/servers/${serverId}/links`, body);
        return res.data; // { ok, data }
    },

    async disable(serverId, linkId) {
        if (!serverId) throw new Error("serverId é obrigatório");
        if (!linkId) throw new Error("linkId é obrigatório");

        const res = await api.patch(
            `/inventory/servers/${serverId}/links/${linkId}/disable`
        );

        return res.data; // { ok, data }
    },
};

export default InventoryLinksApi;
