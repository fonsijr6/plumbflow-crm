import api from "./AxiosClient";

/* ✅ LOGIN */
export const login = async (email: string, password: string) => {
  const { data } = await api.post("/auth/login", { email, password });

  // data = { user: {...}, token: string }
  return data;
};

/* ✅ REGISTER con datos fiscales */
export const register = async (payload: {
  name: string;
  email: string;
  password: string;
  issuerAddress: string;
  issuerNif: string;
  issuerEmail?: string;
}) => {
  const { data } = await api.post("/auth/register", payload);

  // data = { user: {...}, token: string }
  return data;
};

/* ✅ LOGOUT */
export const logout = async () => {
  const { data } = await api.post("/auth/logout");
  return data;
};

/* ✅ REFRESH TOKEN (devuelve NUEVO access_token) */
export const refreshToken = async () => {
  const { data } = await api.post("/auth/refresh");
  return data.token;
};

/* ✅ ME: Obtener datos del usuario */
export const getMe = async (accessToken: string) => {
  const { data } = await api.get("/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return data;
};
