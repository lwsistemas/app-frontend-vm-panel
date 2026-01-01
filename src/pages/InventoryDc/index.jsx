import React, { useEffect, useState } from "react";
import { InventoryApi } from "../../services/inventoryApi";

export default function InventoryDC() {
    const [servers, setServers] = useState([]);
    const [selected, setSelected] = useState(null);
    const [ips, setIps] = useState([]);

    const [filters, setFilters] = useState({
        provider: "",
        dc: "",
        search: "",
        status: "",
    });

    async function loadServers() {
        const { data } = await InventoryApi.listServers({ ...filters, limit: 50 });
        setServers(data.data || []);
        if (!selected && data.data?.length) setSelected(data.data[0]);
    }

    async function loadIps(serverId) {
        const { data } = await InventoryApi.listServerIps(serverId);
        setIps(data.data || []);
    }

    useEffect(() => {
        loadServers();
        // eslint-disable-next-line
    }, [filters.provider, filters.dc, filters.search, filters.status]);

    useEffect(() => {
        if (selected?.id) loadIps(selected.id);
        // eslint-disable-next-line
    }, [selected?.id]);

    return (
        <div style={{ display: "flex", gap: 16 }}>
            {/* LEFT */}
            <div style={{ width: 420 }}>
                <h2>Inventory DC</h2>

                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <input
                        placeholder="Buscar..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                    <input
                        placeholder="DC"
                        value={filters.dc}
                        onChange={(e) => setFilters({ ...filters, dc: e.target.value })}
                        style={{ width: 80 }}
                    />
                    <input
                        placeholder="Provider"
                        value={filters.provider}
                        onChange={(e) => setFilters({ ...filters, provider: e.target.value })}
                        style={{ width: 120 }}
                    />
                </div>

                <div style={{ border: "1px solid #333", borderRadius: 8 }}>
                    {servers.map((s) => (
                        <div
                            key={s.id}
                            onClick={() => setSelected(s)}
                            style={{
                                padding: 10,
                                cursor: "pointer",
                                background: selected?.id === s.id ? "#222" : "transparent",
                                borderBottom: "1px solid #333",
                            }}
                        >
                            <div style={{ fontWeight: "bold" }}>{s.label || `Server ${s.external_id}`}</div>
                            <div style={{ fontSize: 12, opacity: 0.8 }}>
                                {s.provider} • {s.dc} • {s.status}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT */}
            <div style={{ flex: 1 }}>
                {selected ? (
                    <>
                        <h3>{selected.label}</h3>
                        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 12 }}>
                            {selected.provider} • {selected.dc} • {selected.status} • {selected.external_id}
                        </div>

                        <div style={{ border: "1px solid #333", borderRadius: 8 }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                <tr>
                                    <th style={{ textAlign: "left", padding: 8 }}>IP</th>
                                    <th style={{ textAlign: "left", padding: 8 }}>Gateway</th>
                                    <th style={{ textAlign: "left", padding: 8 }}>Subnet</th>
                                    <th style={{ textAlign: "left", padding: 8 }}>Status</th>
                                </tr>
                                </thead>
                                <tbody>
                                {ips.map((ip) => (
                                    <tr key={ip.id} style={{ borderTop: "1px solid #333" }}>
                                        <td style={{ padding: 8 }}>{ip.ip_address}</td>
                                        <td style={{ padding: 8 }}>{ip.gateway}</td>
                                        <td style={{ padding: 8 }}>{ip.subnet}</td>
                                        <td style={{ padding: 8 }}>{ip.status}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div>Selecione um servidor</div>
                )}
            </div>
        </div>
    );
}
