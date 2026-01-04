// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [me, setMe] = useState(null);
    const [loading, setLoading] = useState(true);

    async function loadMe() {
        try {
            setLoading(true);

            const token = localStorage.getItem("token");
            if (!token) {
                setMe(null);
                return;
            }

            const { data } = await api.get("/me");
            setMe(data);
        } catch (err) {
            console.error("AuthProvider /me error:", err);
            setMe(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadMe();
    }, []);

    const role = useMemo(() => (me?.role || "user").toLowerCase(), [me]);
    const isSubaccount = useMemo(() => !!me?.parent_id, [me]);
    const owner_id = useMemo(() => (isSubaccount ? me?.parent_id : me?.id), [isSubaccount, me]);

    const isPrivileged = useMemo(() => {
        return ["root", "admin", "support"].includes(role);
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
