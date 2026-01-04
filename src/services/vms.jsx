// src/services/vms.jsx
import api from "./";

/**
 * VM Service (Contrato Router)
 *
 * Base: /vm
 *
 * ✅ OPTIONS (HOSTS)
 *  GET  /vm/create/options
 *
 * ✅ TEMPLATES POR HOST
 *  GET  /vm/templates?host_id=host-1084
 *
 * ✅ CREATE VM
 *  POST /vm/create
 *
 * 📄 LISTAR VMS
 *  GET  /vm
 *
 * DETAIL AVANÇADO
 *  GET  /vm/:id/detail
 *
 * ▶️ START
 *  POST /vm/:id/start
 *
 * ⏹ STOP
 *  POST /vm/:id/stop
 *
 * 🔄 RESTART
 *  POST /vm/:id/restart
 *
 * ACTION HISTORY
 *  GET  /vm/:id/actions
 *
 * TASK STATUS
 *  ⚠️ Hoje está /vm/vm/task/:taskId por causa do router
 *  (o correto seria /vm/task/:taskId)
 */
const VmsApi = {
    // LIST
    list: (params = {}) => api.get("/vm", { params }).then((r) => r.data),

    // CREATE OPTIONS
    createOptions: () => api.get("/vm/create/options").then((r) => r.data),

    // TEMPLATES
    templates: (params = {}) => api.get("/vm/templates", { params }).then((r) => r.data),

    // CREATE
    create: (payload) => api.post("/vm/create", payload).then((r) => r.data),

    // DETAIL (avançado)
    detail: (id) => api.get(`/vm/${id}/detail`).then((r) => r.data),

    // POWER
    start: (id) => api.post(`/vm/${id}/start`).then((r) => r.data),
    stop: (id) => api.post(`/vm/${id}/stop`).then((r) => r.data),
    restart: (id) => api.post(`/vm/${id}/restart`).then((r) => r.data),

    // ACTIONS
    actions: (id) => api.get(`/vm/${id}/actions`).then((r) => r.data),

    // TASK STATUS (ajustado para o bug atual do router)
    taskStatus: (taskId) => api.get(`/vm/vm/task/${taskId}`).then((r) => r.data),
};

export default VmsApi;
