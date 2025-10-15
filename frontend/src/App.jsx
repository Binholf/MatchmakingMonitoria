import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import PrivateRoute from "./components/PrivateRoute";
import CadastroAluno from "./pages/CadastroAluno";
import CadastroMonitor from "./pages/CadastroMonitor";
import PerfilAluno from "./pages/PerfilAluno";
import PerfilMonitor from "./pages/PerfilMonitor";
import Aluno from  "./pages/Aluno";
import Monitor from  "./pages/Monitor";


export default function App() {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={token ? "/home" : "/login"} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/aluno" element={<Aluno />} />
        <Route path="/monitor" element={<Monitor />} />
        <Route path="/cadastro-aluno" element={<CadastroAluno />} />
        <Route path="/cadastro-monitor" element={<CadastroMonitor />} />
        <Route path="/perfil-aluno" element={<PerfilAluno />} />
        <Route path="/perfil-monitor" element={<PerfilMonitor />} />
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
