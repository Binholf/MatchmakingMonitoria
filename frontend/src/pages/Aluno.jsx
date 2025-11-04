import { useNavigate } from "react-router-dom";
import { logout, getMe } from "../services/auth";
import { useEffect, useState } from "react";
import styles from "../styles/Home.module.css";
import api from "../services/api";

export default function AlunoPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: "" });
  const [recomendacoes, setRecomendacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1️⃣ Pega o usuário autenticado
        const usuario = await getMe();
        setUser(usuario);

        // 2️⃣ Busca o aluno vinculado a esse usuário
        const alunoRes = await api.get(`/aluno/usuario/${usuario.id}`);
        const aluno = alunoRes.data;

        if (!aluno || !aluno.id) {
          console.error("Aluno não encontrado para o usuário logado");
          navigate("/login");
          return;
        }

        // 3️⃣ Agora busca os matches com base no ID do aluno
        const res = await api.get(`/match/${aluno.id}`);
        setRecomendacoes(res.data);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        //navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handlePerfilClick = () => {
    navigate("/perfil-aluno");
  };

  if (loading) return <p>Carregando...</p>;

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

      <div className={styles["page-content"]}>
        <h2 className={styles["section-title"]}>Monitores recomendados</h2>

        {recomendacoes.length === 0 ? (
          <p>Nenhum monitor recomendado encontrado.</p>
        ) : (
          <ul className={styles["monitor-list"]}>
            {recomendacoes.map((monitor) => (
              <li key={monitor.monitor_id} className={styles["monitor-item"]}>
                <strong>{monitor.monitor_nome}</strong> —{" "}
                {monitor.compatibilidade} de compatibilidade
                <br />
                <span className={styles["disciplinas-text"]}>
                  Disciplinas em comum: {monitor.disciplinas_em_comum}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
