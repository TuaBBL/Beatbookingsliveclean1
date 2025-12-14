import { Navigate, Outlet } from 'react-router-dom';

interface AuthenticatedRoutesProps {
  isAuthenticated: boolean;
}

export default function AuthenticatedRoutes({
  isAuthenticated,
}: AuthenticatedRoutesProps) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
