/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-empty */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { authApi } from "@/api/authApi";
import { setAccessToken } from "@/api/axiosClient";

export interface UserPermissions {
  [module: string]: { [action: string]: boolean };
}

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  isActive?: boolean;
  mustChangePassword?: boolean;
  permissions: UserPermissions;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  can: (module: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Cargar usuario autenticado
  const loadUser = useCallback(async () => {
    try {
      const me: any = await authApi.me();
      setUser({
        _id: me._id ?? me.id,
        name: me.name,
        email: me.email,
        role: me.role,
        companyId: me.companyId,
        isActive: me.isActive,
        mustChangePassword: me.mustChangePassword,
        permissions: me.permissions || {},
      });
    } catch {
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  // ✅ Login
  const login = async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    setAccessToken(data.token);

    const u = data.user;
    setUser({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      companyId: u.companyId,
      isActive: u.isActive,
      mustChangePassword: u.mustChangePassword,
      permissions: u.permissions || {},
    });
  };

  // ✅ Logout
  const logout = async () => {
    try {
      await authApi.logout();
    } catch {}
    setAccessToken(null);
    setUser(null);
  };

  // ✅ Helper de permisos (clave para el frontend)
  const can = useCallback(
    (module: string, action: string) => {
      if (!user) return false;
      if (user.role === "owner") return true;
      return Boolean(user.permissions?.[module]?.[action]);
    },
    [user],
  );

  // ✅ Inicialización con refresh token
  useEffect(() => {
    const init = async () => {
      try {
        const refreshData = await authApi.refresh();
        setAccessToken(refreshData.token);
        await loadUser();
      } finally {
        setIsLoading(false);
      }
    };

    init();

    const handleLogout = () => {
      setAccessToken(null);
      setUser(null);
    };

    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [loadUser]);

  // ✅ Loader global
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser: loadUser,
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Hook de acceso
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
