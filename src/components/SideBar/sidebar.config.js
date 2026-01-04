export const SIDEBAR_GROUPS = [
    {
        group: "Compute",
        items: [
            { label: "Dashboard", to: "/dashboard", roles: ["root","admin","support","user"], showForAll: true },
            { label: "VMs", to: "/vms", roles: ["root","admin","support","user"], showForAll: true },
            { label: "Criar VM", to: "/vms/create", roles: ["root","admin","support"], showForAll: true },
        ],
    },

    {
        group: "Financeiro",
        items: [
            { label: "Invoices", to: "/invoices", roles: ["root","admin","support","user"], showForAll: true },
            { label: "Payments", to: "/payments", roles: ["root","admin","support"], showForAll: true },
        ],
    },

    {
        group: "Datacenter",
        items: [
            { label: "Inventory DC", to: "/inventory", roles: ["root","admin","support"], showForAll: true },
        ],
    },

    {
        group: "Network",
        items: [
            { label: "Public IPs", to: "/public-ips", roles: ["root","admin","support"], showForAll: true },
            { label: "Infra / Private IPs", to: "/infra/ips", roles: ["root","admin","support"], showForAll: true },
        ],
    },

    {
        group: "Admin",
        items: [
            { label: "Usuários", to: "/users", roles: ["root","admin"], showForAll: true },
        ],
    },
];
