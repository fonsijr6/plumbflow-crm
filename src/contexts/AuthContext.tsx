import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { authApi } from "@/api/authApi";
import { setAccessToken } from "@/api/axiosClient";

export interface UserPermissions {
  [module: string]: { [action: string]: boolean };
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
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
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser({
        id: me.id,
        name: me.name,
        email: me.email,
        role: me.role,
        companyId: me.companyId,
        mustChangePassword: me.mustChangePassword,
        permissions: me.permissions || {},
      });
    } catch {
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    setAccessToken(data.token);
    setUser({
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      companyId: data.user.companyId,
      mustChangePassword: data.user.mustChangePassword,
      permissions: data.user.permissions || {},
    });
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch { /* ignore */ }
    setAccessToken(null);
    setUser(null);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const refreshData = await authApi.refresh();
        setAccessToken(refreshData.token);
        await loadUser();
      } catch { /* empty */ } finally {
        setIsLoading(false);
      }
    };
    init();

    const handleLogout = () => { setAccessToken(null); setUser(null); };
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [loadUser]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
