import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * ProtectedRoute — Wraps routes that require authentication.
 * If the user is not logged in, redirects to /login.
 * Shows nothing while auth state is loading (prevents flash).
 */
const ProtectedRoute = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return null; // or a spinner — avoids redirect flash on refresh
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
