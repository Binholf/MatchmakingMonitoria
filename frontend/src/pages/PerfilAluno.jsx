import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaPen } from "react-icons/fa";
import styles from "../styles/CadastroAluno.module.css";

export default function PerfilAluno() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ area_interesse: "", descricao: "" });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get("/aluno/me");
        setUser(data);
      } catch {
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await api.put("/aluno/me", user);
      toast.success("Perfil atualizado!");
      setEditing(false);
    } catch {
      toast.error("Erro ao atualizar perfil.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Tem certeza que deseja excluir seu perfil?")) return;
    try {
      await api.delete("/aluno/me");
      toast.success("Perfil excluído!");
      setTimeout(() => navigate("/home"), 1500);
    } catch {
      toast.error("Erro ao excluir perfil.");
    }
  };

  return (
    <div className={styles["cadastro-page"]}>
      <div className={styles["cadastro-card"]}>
        <h2 className={styles["cadastro-title"]}>Perfil do Aluno</h2>
        <h4>Visualize e edite suas informações</h4>

        <div className={styles["input-group"]}>
          <input
            name="area_interesse"
            placeholder="Área de interesse"
            className={styles["input-field"]}
            value={user.area_interesse}
            onChange={handleChange}
            disabled={!editing}
          />
        </div>

        <div className={styles["input-group"]}>
          <textarea
            name="descricao"
            placeholder="Descrição"
            className={styles["input-field"]}
            value={user.descricao}
            onChange={handleChange}
            disabled={!editing}
          />
        </div>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          {editing ? (
            <button className={styles["cadastro-button"]} onClick={handleSave}>
              Salvar
            </button>
          ) : (
            <button
              className={styles["cadastro-button"]}
              onClick={() => setEditing(true)}
            >
              <FaPen style={{ marginRight: "0.5rem" }} /> Editar
            </button>
          )}
          <button
            style={{ backgroundColor: "#e74c3c", flex: 1 }}
            className={styles["cadastro-button"]}
            onClick={handleDelete}
          >
            Excluir Perfil
          </button>
        </div>
      </div>

      <ToastContainer position="top-center" autoClose={2500} />
    </div>
  );
}
