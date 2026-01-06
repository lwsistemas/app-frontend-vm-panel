// src/services/users.js
import api from "../services";

const UsersApi = {
    simple: async (params = {}) => {
        const { data } = await api.get("/users/simple", { params });
        return data;
    },
    list: async (params = {}) => {
        const { data } = await api.get("/users/list", { params });
        return data;
    }
};
export default UsersApi;
