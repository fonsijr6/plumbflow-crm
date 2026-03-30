import { useAuth, UserPermissions } from "@/contexts/AuthContext";

export const usePermissions = () => {
  const { user } = useAuth();
  const permissions: UserPermissions = user?.permissions || {};
  const role = user?.role || "";

  const hasPermission = (module: string, action: string): boolean => {
    if (role === "superadmin" || role === "owner") return true;
    return !!permissions[module]?.[action];
  };

  const hasRole = (...roles: string[]): boolean => {
    return roles.includes(role);
  };

  const isSuperAdmin = role === "superadmin";
  const isOwner = role === "owner";
  const isAdmin = role === "admin";

  return { hasPermission, hasRole, isSuperAdmin, isOwner, isAdmin, role, permissions };
};
