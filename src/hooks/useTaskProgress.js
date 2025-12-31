import { useEffect, useState } from "react";
import api from "../services";

export default function useTaskProgress(taskId, enabled = true) {
    const [data, setData] = useState({
        status: "IDLE",
        completed: 0,
        total: 100,
        vmId: null,
    });

    useEffect(() => {
        if (!enabled || !taskId) return;

        let alive = true;
        let timer = null;

        async function tick() {
            try {
                const { data } = await api.get(`/vm/task/${encodeURIComponent(taskId)}`);

                if (!alive) return;

                setData({
                    status: data.status,
                    completed: data.completed ?? 0,
                    total: data.total ?? 100,
                    vmId: data.vmId || null,
                });

                if (data.status === "SUCCEEDED" || data.status === "FAILED") {
                    return;
                }

                timer = setTimeout(tick, 2000);

            } catch (err) {
                timer = setTimeout(tick, 3000);
            }
        }

        tick();

        return () => {
            alive = false;
            if (timer) clearTimeout(timer);
        };

    }, [taskId, enabled]);

    return data;
}
