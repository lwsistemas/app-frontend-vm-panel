import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, roles }) {
    const authKey = localStorage.getItem('authKey');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!authKey || !user) {
        return <Navigate to="/login" replace />;
    }

    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
}
