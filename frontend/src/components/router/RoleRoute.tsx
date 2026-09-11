import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface RoleRouteProps {
  children: React.ReactNode;
  roles: string[];
}

// Route guard that additionally requires the authenticated user to hold one
// of the allowed roles. Backend authorization remains the source of truth.
const RoleRoute = ({ children, roles }: RoleRouteProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export default RoleRoute;
