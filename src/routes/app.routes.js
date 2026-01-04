// src/routes/app.routes.js
import {
    LayoutDashboard,
    Server,
    FileText,
    CreditCard,
    Database,
    Network,
    Users,
    Shield,
    Settings,
    Activity,
    Boxes,
} from "lucide-react";

// helper
export const PRIVILEGED_ROLES = ["root", "admin", "support"];

export const APP_ROUTES = [
    // COMPUTE
    {
        id: "dashboard",
        group: "Compute",
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/",
        elementKey: "Dashboard",
        roles: ["root", "admin", "support", "user"], // todo mundo
    },
    {
        id: "vms",
        group: "Compute",
        label: "VMs",
        icon: Server,
        path: "/vms",
        elementKey: "Vms",
        roles: ["root", "admin", "support", "user"],
    },

    // NETWORK (exemplo)
    {
        id: "publicIps",
        group: "Network",
        label: "Public IPs",
        icon: Network,
        path: "/public-ips",
        elementKey: "PublicIps",
        roles: PRIVILEGED_ROLES, // DC/NOC
    },

    // DATACENTER
    {
        id: "inventoryDc",
        group: "Datacenter",
        label: "Inventory DC",
        icon: Database,
        path: "/inventory",
        elementKey: "InventoryDc",
        roles: PRIVILEGED_ROLES,
    },

    // FINANCEIRO
    {
        id: "invoices",
        group: "Financeiro",
        label: "Invoices",
        icon: FileText,
        path: "/invoices",
        elementKey: "Invoices",
        roles: ["root", "admin", "support", "user"], // cliente também
    },
    {
        id: "payments",
        group: "Financeiro",
        label: "Payments",
        icon: CreditCard,
        path: "/payments",
        elementKey: "Payments",
        roles: PRIVILEGED_ROLES, // se for só DC/suporte
    },

    // ADMIN
    {
        id: "users",
        group: "Admin",
        label: "Usuários",
        icon: Users,
        path: "/users",
        elementKey: "Users",
        roles: PRIVILEGED_ROLES,
    },
    {
        id: "roles",
        group: "Admin",
        label: "Roles & Permissions",
        icon: Shield,
        path: "/admin/roles",
        elementKey: "RolesPermissions",
        roles: ["root", "admin"],
    },

    // SYSTEM
    {
        id: "swagger",
        group: "System",
        label: "Swagger / API",
        icon: FileText,
        path: "/system/swagger",
        elementKey: "Swagger",
        roles: PRIVILEGED_ROLES,
    },
    {
        id: "health",
        group: "System",
        label: "Health",
        icon: Activity,
        path: "/system/health",
        elementKey: "Health",
        roles: PRIVILEGED_ROLES,
    },
];
