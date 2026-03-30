import { usePermissions } from "@/hooks/usePermissions";

interface Props {
  module: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const IfPermission = ({ module, action, children, fallback = null }: Props) => {
  const { hasPermission } = usePermissions();
  return hasPermission(module, action) ? <>{children}</> : <>{fallback}</>;
};
