import api from './index';

export async function fetchAlerts(params = {}) {
    const { data } = await api.get('/alerts', { params });
    return data || [];
}

export async function markAlertRead(id) {
    const { data } = await api.post(`/alerts/${id}/read`);
    return data;
}

export async function resolveAlert(id) {
    const { data } = await api.post(`/alerts/${id}/resolve`);
    return data;
}
