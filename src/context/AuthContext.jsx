// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services"; // sua instância axios que injeta authKey

const AuthContext = createContext(null);

// Privileged roles — ajustado para incluir "finance"
function isPrivilegedRole(role) {
    return ["root", "admin", "finance"].includes(String(role || "").toLowerCase());
}

function safeJsonParse(raw) {
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [me, setMe] = useState(null);
    const [loading, setLoading] = useState(true);

    async function loadMe() {
        try {
            setLoading(true);

            // Use authKey (o interceptor usa authKey)
            const authKey = localStorage.getItem("authKey");
            if (!authKey) {
                setMe(null);
                return;
            }

            // Chama explicitamente /auth/me para ficar claro no Network
            // O backend tem /auth/me (AuthController.me) e também /me (root),
            // então tratamos os dois formatos de resposta abaixo.
            let data;
            try {
                const res = await api.get("/auth/me");
                data = res?.data;
            } catch (err) {
                // fallback: alguns envs podem expor /me; tenta também /me antes de falhar
                try {
                    const res2 = await api.get("/me");
                    data = res2?.data;
                } catch (err2) {
                    throw err; // rethrow o erro original
                }
            }

            // Suporta dois formatos:
            // 1) { user: { ... } }  (AuthController.me)
            // 2) { ...user fields... } (root /me route que retorna req.user)
            let backendUser = null;
            if (!data) {
                backendUser = null;
            } else if (data.user) {
                backendUser = data.user;
            } else {
                // se data parece um objeto de usuário (tem id ou login), assume direto
                backendUser = data;
            }

            if (backendUser) {
                setMe(backendUser);
                try {
                    localStorage.setItem("user", JSON.stringify(backendUser));
                } catch {}
            } else {
                setMe(null);
            }
        } catch (err) {
            console.error("[AuthProvider] /auth/me error:", err);
            setMe(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadMe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const role = useMemo(() => (me?.role || "user").toLowerCase(), [me]);
    const isSubaccount = useMemo(() => !!me?.parent_id, [me]);
    const owner_id = useMemo(() => (isSubaccount ? me?.parent_id : me?.id), [isSubaccount, me]);

    const isPrivileged = useMemo(() => {
        return isPrivilegedRole(role);
    }, [role]);

    const value = useMemo(
        () => ({
            me,
            role,
            owner_id,
            isSubaccount,
            isPrivileged,
            loading,
            refreshMe: loadMe,
        }),
        [me, role, owner_id, isSubaccount, isPrivileged, loading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider />");
    return ctx;
}
