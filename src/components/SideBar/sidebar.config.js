// src/components/SideBar/sidebar.config.js
import {
    LayoutDashboard,
    Server,
    Network,
    Database,
    FileText,
    CreditCard,
    Users,
    Shield,
    Settings,
    Boxes,
    Activity,
} from "lucide-react";

export const SIDEBAR_MENU = [
    {
        group: "Compute",
        items: [
            { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard", disabled: false },
            { label: "VMs", icon: Server, to: "/vms", disabled: false },
            { label: "Templates", icon: Boxes, to: "/templates", disabled: false },
            { label: "ISOs", icon: Boxes, to: "/isos", disabled: false },
            { label: "Snapshots", icon: Boxes, to: "/snapshots", disabled: false },
            { label: "Tasks / Jobs", icon: Activity, to: "/tasks", disabled: false },
        ],
    },

    {
        group: "Network",
        items: [
            { label: "Public IPs", icon: Network, to: "/public-ips", disabled: false },
            { label: "Infra / Private IPs", icon: Network, to: "/infra-ips", disabled: false },
            { label: "Subnets", icon: Network, to: "/network/subnets", disabled: false },
            { label: "Firewalls", icon: Shield, to: "/network/firewalls", disabled: false },
            { label: "VPN / WireGuard", icon: Shield, to: "/network/vpn", disabled: false },
            { label: "Load Balancers", icon: Network, to: "/network/lb", disabled: false },
        ],
    },

    {
        group: "Datacenter",
        items: [
            { label: "Inventory DC", icon: Database, to: "/inventory", disabled: false },
            { label: "IP Blocks", icon: Network, to: "/datacenter/ip-blocks", disabled: false },
            { label: "Providers", icon: Database, to: "/providers", disabled: false },
            { label: "Locations / DCs", icon: Database, to: "/locations", disabled: false },
            { label: "Sync Logs", icon: Activity, to: "/sync-logs", disabled: false },
        ],
    },

    {
        group: "Financeiro",
        items: [
            { label: "Dashboard Financeiro", icon: FileText, to: "/dashboard/finance", disabled: false },
            { label: "Invoices", icon: FileText, to: "/invoices", disabled: false },
            { label: "Payments", icon: CreditCard, to: "/finance/payments", disabled: false },
            { label: "Subscriptions", icon: FileText, to: "/finance/subscriptions", disabled: false },
            { label: "Plans", icon: FileText, to: "/finance/plans", disabled: false },
            { label: "Credits", icon: CreditCard, to: "/finance/credits", disabled: false },
            { label: "Taxes", icon: FileText, to: "/finance/taxes", disabled: false },
            { label: "Reports", icon: FileText, to: "/finance/reports", disabled: false },
        ],
    },

    {
        group: "Clientes",
        items: [
            { label: "Clientes", icon: Users, to: "/clients", disabled: false },
            { label: "Contratos", icon: FileText, to: "/contracts", disabled: false },
            { label: "Serviços", icon: Boxes, to: "/services", disabled: false },
            { label: "Propostas", icon: FileText, to: "/proposals", disabled: false },
            { label: "Tickets", icon: Activity, to: "/tickets", disabled: false },
        ],
    },

    {
        group: "Admin",
        items: [
            { label: "Usuários", icon: Users, to: "/users", disabled: false },
            { label: "Roles & Permissions", icon: Shield, to: "/admin/roles", disabled: false },
            { label: "Audit Log", icon: Activity, to: "/admin/audit", disabled: false },
            { label: "API Tokens", icon: Shield, to: "/admin/tokens", disabled: false },
            { label: "Webhooks", icon: Network, to: "/admin/webhooks", disabled: false },
        ],
    },

    {
        group: "System",
        items: [
            { label: "Configurações", icon: Settings, to: "/system/settings", disabled: false },
            { label: "Integrações", icon: Settings, to: "/system/integrations", disabled: false },
            { label: "Jobs / Queue", icon: Activity, to: "/system/jobs", disabled: false },
            { label: "Health", icon: Activity, to: "/system/health", disabled: false },
            { label: "Swagger / API", icon: FileText, to: "/system/swagger", disabled: false },
        ],
    },
];
