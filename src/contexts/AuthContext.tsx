import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  login as apiLogin,
  logout as apiLogout,
  refreshToken,
  getMe,
} from "@/api/AuthApi";

interface AuthContextType {
  isAuthenticated: boolean;
  user: { name: string; email: string } | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string; email: string } | null>(
    null,
  );
  const isAuthenticated = !!token;

  // ✅ LOGIN REAL
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const data = await apiLogin(email, password); // backend → { user, token }
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("access_token", data.token);
      return true;
    } catch (err) {
      console.error("Error en login:", err);
      return false;
    }
  };

  // ✅ LOGOUT REAL
  const logout = async () => {
    try {
      await apiLogout(); // limpia cookie refreshToken en backend
      localStorage.removeItem("access_token");
    } catch (err) {
      console.error("Error en logout:", err);
    }

    setToken(null);
    setUser(null);
  };

  // ✅ Al iniciar, intentamos recuperar sesión desde refresh token
  useEffect(() => {
    const initialize = async () => {
      try {
        const newToken = await refreshToken(); // si cookie refreshToken es válida → devuelve accessToken
        setToken(newToken);

        const me = await getMe(newToken);
        setUser({ name: me.name, email: me.email });
      } catch {
        console.log("No hay sesión activa o refresh inválido");
      }
    };

    initialize();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
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
