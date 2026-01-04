// src/services/tickets.jsx
import api from "../services";

/**
 * Contrato oficial de criação de ticket.
 * Quando o backend estiver pronto: POST /tickets
 */
export async function createTicket(payload) {
    // ⚠️ Enquanto o endpoint não existir, a gente apenas simula sucesso
    // Remover esse bloco quando o backend estiver pronto.
    if (import.meta.env.DEV) {
        console.warn("[DEV] createTicket mock:", payload);
        return {
            ok: true,
            ticket: {
                id: Date.now(),
                status: "open",
                ...payload,
            },
            mock: true,
        };
    }

    const { data } = await api.post("/tickets", payload);
    return data;
}
