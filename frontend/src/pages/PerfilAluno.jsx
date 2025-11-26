import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function PerfilAluno() {
  // stub: Perfil moved to /aluno page. Redirect to avoid duplicate code.
  const navigate = useNavigate();
  useEffect(() => { navigate('/aluno'); }, [navigate]);
  return null;
}
