// src/utils/permissions.js

export function getMeFromStorage() {
    try {
        return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        return null;
    }
}

export function getRole() {
    const me = getMeFromStorage();
    return String(me?.role || "user").toLowerCase();
}

export function isSubaccount() {
    const me = getMeFromStorage();
    return !!me?.parent_id;
}

export function isPrivileged() {
    const role = getRole();
    return ["root", "admin", "support"].includes(role);
}

/**
 * VM Actions Contract
 *
 * delete: NEVER for client/subaccount
 * client: everything except delete
 * subaccount: view/console/start/reboot only
 */
export function canVm(action) {
    const role = getRole();
    const sub = isSubaccount();
    const privileged = ["root", "admin", "support"].includes(role);

    // privileged sempre pode tudo (exceto se você quiser travar delete global)
    if (privileged) {
        if (action === "delete") return true; // se quiser travar até privileged, coloca false
        return true;
    }

    // client/subaccount: delete nunca
    if (action === "delete") return false;

    // subaccount: só ações permitidas
    if (sub) {
        const allowed = new Set(["view", "console", "start", "reboot", "cancel_request"]);
        return allowed.has(action);
    }

    // client: pode tudo menos delete
    return true;
}

/**
 * Mensagem padrão para UX (tooltip)
 */
export function whyVmDenied(action) {
    if (action === "delete") return "Delete é bloqueado para clientes.";
    if (isSubaccount() && action === "stop") return "Somente o cliente pode desligar a VM.";
    if (isSubaccount() && !canVm(action)) return "Sem permissão para esta ação.";
    if (action === "cancel_request") return "Isso abre um pedido para o DC/NOC.";


    return "Sem permissão.";
}
