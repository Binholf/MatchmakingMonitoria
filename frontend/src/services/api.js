import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000", 
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Verifica cadastro do aluno
export const verificarCadastroAluno = async () => {
  const res = await api.get("/aluno/check");
  return res.data.temCadastro;
};

// Verifica cadastro do monitor
export const verificarCadastroMonitor = async () => {
  const res = await api.get("/monitor/check");
  return res.data.temCadastro;
};

export default api;
