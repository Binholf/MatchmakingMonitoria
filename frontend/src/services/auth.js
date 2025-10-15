import api from "./api";

export const login = async (email, password) => {
  const res = await api.post("auth/login", { email, password });
  localStorage.setItem("token", res.data.token);
};

export const register = async (name, email, password) => {
  const response = await api.post("auth/register", { name, email, password });
  return response.data;
};

export const logout = () => {
  localStorage.removeItem("token");
};

export const getMe = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Usuário não autenticado");

  const res = await api.get("auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data;
};