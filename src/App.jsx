import { BrowserRouter, Routes, Route } from "react-router-dom";

// Auth
import Login from "./pages/Login";
import Register from "./pages/Register";

// Core
import Dashboard from "./pages/Dashboard";
import FinanceDashboard from "./pages/DashboardFinance/FinanceDashboard.jsx";

// VM
import VmPage from "./pages/vm/VmPage";
import VmCreatePage from "./pages/vm/VmCreate.jsx";
import VmDetail from "./pages/VmDetail";
import VmConsole from "./pages/VmConsole";

// Users
import UsersPage from "./pages/Users/UsersPage";

// Invoices
import InvoicesPage from "./pages/Invoices/InvoicesPage";
import InvoiceDetailsPage from "./pages/Invoices/InvoiceDetailPage.jsx";
import InvoiceCreatePage from "./pages/Invoices/InvoiceCreatePage.jsx"; // ✅ NEW

// Inventory / Infra / IPs
import InventoryPage from "./pages/InventoryDc/InventoryPage.jsx";
import InfraIps from "./pages/InfraIps";
import PublicIps from "./pages/PublicIps";

// Layout / Guards
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./MainLayout.jsx";

// Utils
import ErrorBoundary from "./components/ErrorBoundary";
import NotFound from "./pages/NotFound";

export default function App() {
    return (
        <BrowserRouter>
            <ErrorBoundary>
                <Routes>
                    {/* ========================= */}
                    {/* PUBLIC ROUTES */}
                    {/* ========================= */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* ========================= */}
                    {/* PROTECTED ROUTES */}
                    {/* ========================= */}
                    <Route
                        element={
                            <ProtectedRoute>
                                <MainLayout />
                            </ProtectedRoute>
                        }
                    >
                        {/* Dashboard */}
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/dashboard/finance" element={<FinanceDashboard />} />

                        {/* VMs */}
                        <Route path="/vms" element={<VmPage />} />
                        <Route path="/vms/create" element={<VmCreatePage />} />
                        <Route path="/vm/:id" element={<VmDetail />} />
                        <Route path="/vms/:id/console" element={<VmConsole />} />

                        {/* Invoices */}
                        <Route path="/invoices" element={<InvoicesPage />} />
                        <Route path="/invoices/new" element={<InvoiceCreatePage />} /> {/* ✅ NEW */}
                        <Route path="/invoices/:id" element={<InvoiceDetailsPage />} />

                        {/* Inventory DC */}
                        <Route path="/inventory" element={<InventoryPage />} />

                        {/* IPs */}
                        <Route path="/public-ips" element={<PublicIps />} />
                        <Route path="/infra/ips" element={<InfraIps />} />

                        {/* Users */}
                        <Route path="/users" element={<UsersPage />} />
                    </Route>

                    {/* ========================= */}
                    {/* 404 */}
                    {/* ========================= */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </ErrorBoundary>
        </BrowserRouter>
    );
}
