import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register'; // ✅ NEW
import Dashboard from './pages/Dashboard';
import VmDetail from './pages/VmDetail';
import VmConsole from './pages/VmConsole';
import VmPage from './pages/vm/VmPage';
import VmCreatePage from './pages/vm/VmCreate.jsx';
import UsersPage from './pages/Users/UsersPage';

import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './MainLayout.jsx';

import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/NotFound';

export default function App() {
    return (
        <BrowserRouter>
            <ErrorBoundary>
                <Routes>
                    {/* PUBLIC */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} /> {/* ✅ NEW */}

                    {/* PRIVATE (AUTH ONLY) */}
                    <Route
                        element={
                            <ProtectedRoute>
                                <MainLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/" element={<Dashboard />} />

                        {/* VMS */}
                        <Route path="/vms" element={<VmPage />} />

                        {/* 🔒 CREATE VM: ROOT / ADMIN / SUPPORT */}
                        <Route
                            path="/vms/create"
                            element={
                                <ProtectedRoute roles={['root', 'admin', 'support']}>
                                    <VmCreatePage />
                                </ProtectedRoute>
                            }
                        />

                        <Route path="/vm/:id" element={<VmDetail />} />
                        <Route path="/vm/:id/console" element={<VmConsole />} />

                        {/* 🔒 ADMIN / ROOT ONLY */}
                        <Route
                            path="/users"
                            element={
                                <ProtectedRoute roles={['admin', 'root']}>
                                    <UsersPage />
                                </ProtectedRoute>
                            }
                        />

                        {/* ✅ 404 PRIVADO */}
                        <Route path="*" element={<NotFound />} />
                    </Route>

                    {/* ✅ 404 FORA (caso role rota louca antes do login) */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </ErrorBoundary>
        </BrowserRouter>
    );
}
