// src/services/inventory.js
import api from './index.jsx';

// ✅ Inventory DC - Multi-provider
export async function listInventoryServers(params = {}) {
    const { data } = await api.get('/inventory/servers', { params });
    return data;
}

export async function getInventoryServer(id) {
    const { data } = await api.get(`/inventory/servers/${id}`);
    return data;
}

export async function listInventoryServerIps(id, params = {}) {
    const { data } = await api.get(`/inventory/servers/${id}/ips`, { params });
    return data;
}

export async function listInventoryIps(params = {}) {
    const { data } = await api.get('/inventory/ips', { params });
    return data;
}
