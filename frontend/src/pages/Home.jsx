import { useNavigate } from "react-router-dom";
import { logout, getMe } from "../services/auth";
import { useEffect, useState } from "react";
import { verificarCadastroAluno, verificarCadastroMonitor } from "../services/api";
import styles from "../styles/Home.module.css"; // CSS Modules

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getMe();
        setUser(data);
      } catch {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);
  const handleAlunoClick = async () => {
    try {
      const temCadastro = await verificarCadastroAluno();
      if (temCadastro) navigate("/aluno");
      else navigate("/cadastro-aluno");
    } catch (err) {
      console.error("Erro ao verificar cadastro do aluno:", err);
    }
  };

  const handleMonitorClick = async () => {
    try {
      const temCadastro = await verificarCadastroMonitor();
      if (temCadastro) navigate("/monitor");
      else navigate("/cadastro-monitor");
    } catch (err) {
      console.error("Erro ao verificar cadastro do monitor:", err);
    }
  };

  if (loading) return <p className={styles["text-center"]}>Carregando...</p>;

  return (
    <div className={styles["home-page"]}>
      <div className={styles["home-cards"]}>
        <div
          className={`${styles["role-card"]} ${styles["student-card"]}`}
          onClick={handleAlunoClick}
        >
          <img src="/aluno.jpg" alt="Aluno" className={styles["role-image"]} />
          <h2>Sou Aluno</h2>
        </div>

        <div
          className={`${styles["role-card"]} ${styles["monitor-card"]}`}
          onClick={handleMonitorClick}
        >
          <img src="/monitor.jpg" alt="Monitor" className={styles["role-image"]} />
          <h2>Sou Monitor</h2>
        </div>
      </div>
    </div>
  );
}
