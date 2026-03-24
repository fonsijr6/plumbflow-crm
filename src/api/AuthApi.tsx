import api from "./AxiosClient";

export const login = async (email: string, password: string) => {
  const { data } = await api.post("/auth/login", { email, password });
  return data; // { user, token }
};

export const register = async (payload: unknown) => {
  const { data } = await api.post("/auth/register", payload);
  return data; // { user, token }
};

export const logout = async () => {
  const { data } = await api.post("/auth/logout");
  return data;
};

export const refreshToken = async () => {
  const { data } = await api.post("/auth/refresh");
  return data.token; // backend returns { token }
};

export const getMe = async (accessToken: string) => {
  const { data } = await api.get("/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return data;
};
