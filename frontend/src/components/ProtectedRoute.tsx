import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = () => {
    const { usuario, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
                <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">Autenticando...</p>
            </div>
        );
    }

    if (!usuario) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
