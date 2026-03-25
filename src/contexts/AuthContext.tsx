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

interface AuthContextType {
  isAuthenticated: boolean;
  user: { name: string; email: string } | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const isAuthenticated = !!token;

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

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const data = await apiRegister({ name, email, password });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("access_token", data.token);
      return true;
    } catch (err) {
      console.error("Error en registro:", err);
      return false;
    }
  };

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

  useEffect(() => {
    const initialize = async () => {
      try {
        const newToken = await refreshToken();
        if (newToken) {
          setToken(newToken);
          localStorage.setItem("access_token", newToken);
          const me = await getMe(newToken);
          setUser({ name: me.name, email: me.email });
        }
      } catch {
        console.log("No hay sesión activa.");
      }
    };
    initialize();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
