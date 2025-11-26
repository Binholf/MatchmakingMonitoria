import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import PrivateRoute from "./components/PrivateRoute";
import CadastroAluno from "./pages/CadastroAluno";
import CadastroMonitor from "./pages/CadastroMonitor";
import ErrorBoundary from "./components/ErrorBoundary";
// perfil pages removed; profile editing moved into Aluno/Monitor pages
import Aluno from  "./pages/Aluno";
import Monitor from  "./pages/Monitor";
import Header from "./components/Header";


export default function App() {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Navigate to={token ? "/home" : "/login"} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/aluno" element={<Aluno />} />
        <Route path="/monitor" element={<Monitor />} />
        <Route path="/cadastro-aluno" element={<CadastroAluno />} />
        <Route
          path="/cadastro-monitor"
          element={
            <ErrorBoundary>
              <CadastroMonitor />
            </ErrorBoundary>
          }
        />
        {/* perfil routes removed - profile editing is now inside /aluno and /monitor pages */}
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
