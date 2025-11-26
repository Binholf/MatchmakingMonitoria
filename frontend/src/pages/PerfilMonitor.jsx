import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function PerfilMonitor() {
  // stub: Perfil moved to /monitor page. Redirect to avoid duplicate code.
  const navigate = useNavigate();
  useEffect(() => { navigate('/monitor'); }, [navigate]);
  return null;
}
