import axios from 'axios';

/**
 * ===========================================
 * 🌐 CONTROLE DE AMBIENTE DA API
 * ===========================================
 *
 * Modos válidos:
 *  - local
 *  - staging
 *  - production
 *
 * Prioridade:
 *  1️⃣ VITE_API_MODE (forçado)
 *  2️⃣ hostname (auto)
 */

const API_URLS = {
    local: 'http://172.16.11.4:4430',
    staging: 'http://179.181.104.186:4430',
    production: 'https://api.control.lwsistemas.com.br',
};

// 🔧 Forçar ambiente manualmente (opcional)
// const FORCE_MODE = import.meta.env.VITE_API_MODE || null;
const FORCE_MODE = "staging";



// 🌍 Detecta ambiente automaticamente
function detectMode() {
    if (FORCE_MODE && API_URLS[FORCE_MODE]) {
        return FORCE_MODE;
    }

    const host = window.location.hostname;

    if (host.includes('localhost') || host.startsWith('127.')) {
        return 'local';
    }

    if (host.includes('staging')) {
        return 'staging';
    }

    return 'production';
}

const mode = detectMode();
const baseURL = API_URLS[mode];

// 🚀 Instância Axios
const api = axios.create({
    baseURL,
    timeout: 15000,
});

// 🔐 Interceptor: injeta authKey
api.interceptors.request.use(
    config => {
        const authKey = localStorage.getItem('authKey');
        if (authKey) {
            config.headers.Authorization = authKey;
        }
        return config;
    },
    error => Promise.reject(error)
);

// 🚨 Interceptor global de erro (401)
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            console.warn('[API] Sessão expirada');
            localStorage.removeItem('authKey');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// 🧠 Log claro de ambiente
console.log(
    `%c🔗 API MODE: ${mode.toUpperCase()} → ${baseURL}`,
    `color: ${mode === 'local' ? '#10b981' : mode === 'staging' ? '#f59e0b' : '#3b82f6'}; font-weight: bold;`
);

export default api;
