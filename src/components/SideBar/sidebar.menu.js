import {
    LayoutDashboard,
    Server,
    FileText,
    CreditCard,
    Users,
    Settings,
    Shield,
    Database,
    Activity
} from "lucide-react";

export const SIDEBAR_MENU = [
    {
        id: "compute",
        label: "COMPUTE",
        items: [
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/" },
            { id: "vms", label: "VMs", icon: Server, to: "/vms" }
        ]
    },

    {
        id: "finance",
        label: "FINANCEIRO",
        items: [
            { id: "invoices", label: "Invoices", icon: FileText, to: "/invoices" },
            { id: "payments", label: "Payments", icon: CreditCard, to: "/payments", disabled: true },
            { id: "subscriptions", label: "Subscriptions", icon: Activity, to: "/subscriptions", disabled: true }
        ]
    },

    {
        id: "providers",
        label: "PROVIDERS / DC",
        items: [
            { id: "public-ips", label: "Public IPs", icon: Database, to: "/public-ips" },
            { id: "inventory", label: "Inventory DC", icon: Server, to: "/inventory" }
        ]
    },

    {
        id: "admin",
        label: "ADMIN",
        items: [
            { id: "users", label: "Users", icon: Users, to: "/users" },
            { id: "roles", label: "Roles & Permissions", icon: Shield, to: "/roles", disabled: true },
            { id: "settings", label: "Settings", icon: Settings, to: "/settings", disabled: true }
        ]
    }
];
