import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, role }) => {
    const { user, isAuthenticated } = useAuth();
    //check login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    //check role
    if (role && user?.role !== role) {
        return <Navigate to="/" replace />
    }
    return children;
}

export default ProtectedRoute;
