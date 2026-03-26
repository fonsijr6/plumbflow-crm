/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  refreshToken,
  getMe,
} from "@/api/AuthApi";

interface User {
  id: string;
  name: string;
  email: string;

  // ✅ Nuevos campos del autónomo
  issuerAddress: string;
  issuerNif: string;
  issuerEmail: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    issuerAddress: string;
    issuerNif: string;
    issuerEmail?: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [ready, setReady] = useState(false);
  const isAuthenticated = !!token;

  /* ✅ LOGIN */
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const data = await apiLogin(email, password);

      setToken(data.token);
      setUser(data.user);

      localStorage.setItem("access_token", data.token);
      return true;
    } catch (err) {
      console.error("Error en login:", err);
      return false;
    }
  };

  /* ✅ REGISTER */
  const register = async (form: {
    name: string;
    email: string;
    password: string;
    issuerAddress: string;
    issuerNif: string;
    issuerEmail?: string;
  }): Promise<boolean> => {
    try {
      const data = await apiRegister(form);

      setToken(data.token);
      setUser(data.user);

      localStorage.setItem("access_token", data.token);
      return true;
    } catch (err) {
      console.error("Error en registro:", err);
      return false;
    }
  };

  /* ✅ LOGOUT */
  const logout = async () => {
    try {
      await apiLogout();
      localStorage.removeItem("access_token");
    } catch (err) {
      console.error("Error en logout:", err);
    }
    setToken(null);
    setUser(null);
  };

  /* ✅ REFRESH TOKEN AL CARGAR LA APP */
  useEffect(() => {
    const initialize = async () => {
      try {
        const newToken = await refreshToken();

        if (newToken) {
          setToken(newToken);
          localStorage.setItem("access_token", newToken);

          const me = await getMe(newToken);

          // ✅ Guardamos TODOS los datos
          setUser({
            id: me.id,
            name: me.name,
            email: me.email,
            issuerAddress: me.issuerAddress,
            issuerNif: me.issuerNif,
            issuerEmail: me.issuerEmail,
          });
        }
      } catch {
        console.log("No hay sesión activa.");
      } finally {
        setReady(true);
      }
    };

    initialize();
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
