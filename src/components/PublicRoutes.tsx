import { Navigate, Outlet } from 'react-router-dom';

interface PublicRoutesProps {
  isAuthenticated: boolean;
}

export default function PublicRoutes({ isAuthenticated }: PublicRoutesProps) {
  if (isAuthenticated) {
    return <Navigate to="/auth-gate" replace />;
  }

  return <Outlet />;
}
