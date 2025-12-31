import { useEffect, useState } from 'react';
import api from '../services';

export default function useUsersSimple(enabled = true) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!enabled) return;

        async function load() {
            setLoading(true);
            const { data } = await api.get('/users/simple');
            setUsers(data || []);
            setLoading(false);
        }

        load();
    }, [enabled]);

    return { users, loading };
}
