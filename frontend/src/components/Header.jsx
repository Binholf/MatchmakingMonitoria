import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Header.module.css";
import { logout, getMe } from "../services/auth";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    let mounted = true;
    getMe()
      .then(u => { if (mounted) setUserName(u.name || ""); })
      .catch(() => setUserName(""));
    return () => { mounted = false; };
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleBack = () => {
    const path = location.pathname || "/";
    const token = localStorage.getItem("token");

    // Mapear rotas para uma 'camada anterior' lógica sem usar o histórico do navegador
    if (path.startsWith("/cadastro-monitor") || path.startsWith("/cadastro-aluno")) {
      navigate("/home");
      return;
    }

    if (path.startsWith("/perfil-monitor")) {
      navigate("/monitor");
      return;
    }

    if (path.startsWith("/perfil-aluno")) {
      navigate("/aluno");
      return;
    }

    // Se estiver na tela de login/register, ir para login (não voltar ao histórico)
    if (path.startsWith("/login") || path.startsWith("/register")) {
      navigate("/login");
      return;
    }

    // Se usuário autenticado, ir para /home como camada segura
    if (token) {
      navigate("/home");
      return;
    }

    // fallback: login
    navigate("/login");
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.back} onClick={handleBack} title="Voltar">
          Voltar
        </button>
      </div>

      <div className={styles.center}>
        <h1 className={styles.title}>Matchmaking Monitoria</h1>
        {userName && <div className={styles.user}>Olá, <strong>{userName}</strong></div>}
      </div>

      <div className={styles.right}>
        <button className={styles.logout} onClick={handleLogout} title="Sair">Sair</button>
      </div>
    </header>
  );
}
