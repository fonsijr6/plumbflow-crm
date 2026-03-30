import { Navigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";

interface Props {
  module: string;
  action: string;
  children: React.ReactNode;
}

export const RequirePermission = ({ module, action, children }: Props) => {
  const { hasPermission } = usePermissions();
  if (!hasPermission(module, action)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};
