import { useNavigate } from "react-router-dom"; 
import { logout, getMe } from "../services/auth";
import { useEffect, useState } from "react";
import styles from "../styles/Home.module.css"; // CSS Modules

export default function AlunoPage() {
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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handlePerfilClick = () => {
    navigate("/perfil-aluno");
  };

  if (loading) return <p className={styles["text-center"]}>Carregando...</p>;

  return (
    <div className={styles["home-page"]}>
      <header className={styles["home-header"]}>
        <h1
          className={styles["welcome-text"]}
          onClick={handlePerfilClick}
          title="Clique para ver seu perfil"
        >
          Aluno - <span className={styles["clickable-name"]}>{user.name}</span>
        </h1>

        <button className={styles["logout-button"]} onClick={handleLogout}>
          Sair
        </button>
      </header>

      <div className={styles["page-empty"]}>
        {/* Conteúdo vazio, só o header */}
      </div>
    </div>
  );
}
