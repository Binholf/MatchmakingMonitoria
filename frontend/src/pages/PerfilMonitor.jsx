import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaPen } from "react-icons/fa";
import styles from "../styles/CadastroMonitor.module.css";

export default function PerfilMonitor() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    especialidade: "",
    experiencia: "",
    preco_hora: "",
  });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get("/monitor/me");
        setUserData({
          name: data.user.name,
          email: data.user.email,
          especialidade: data.especialidade,
          experiencia: data.experiencia,
          preco_hora: data.preco_hora,
        });
      } catch {
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await api.put("/monitor/me", {
        name: userData.name,
        especialidade: userData.especialidade,
        experiencia: userData.experiencia,
        preco_hora: userData.preco_hora,
      });
      toast.success("Perfil atualizado!");
      setEditing(false);
    } catch {
      toast.error("Erro ao atualizar perfil.");
    }
  };

  const handleDelete = async () => {
    const DeleteConfirm = () => (
      <div>
        <p>Tem certeza que deseja excluir seu perfil?</p>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
          <button
            onClick={async () => {
              toast.dismiss();
              try {
                await api.delete("/monitor/me");
                toast.success("Perfil excluído!");
                setTimeout(() => navigate("/home"), 1500);
              } catch {
                toast.error("Erro ao excluir perfil.");
              }
            }}
            style={{
              backgroundColor: "#27ae60",
              color: "white",
              padding: "0.3rem 0.6rem",
              borderRadius: "5px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Confirmar
          </button>
          <button
            onClick={() => toast.dismiss()}
            style={{
              backgroundColor: "#ccc",
              color: "#333",
              padding: "0.3rem 0.6rem",
              borderRadius: "5px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    );

    toast.info(<DeleteConfirm />, { autoClose: false, closeOnClick: false });
  };

  return (
    <div className={styles["cadastro-page"]}>
      <div className={styles["cadastro-card"]}>
        <h2 className={styles["cadastro-title"]}>Perfil do Monitor</h2>
        <h4>Visualize e edite suas informações</h4>

        <div className={styles["input-group"]}>
          <input
            name="name"
            placeholder="Nome"
            className={styles["input-field"]}
            value={userData.name}
            onChange={handleChange}
            disabled={!editing}
          />
        </div>

        <div className={styles["input-group"]}>
          <input
            name="email"
            placeholder="E-mail"
            className={styles["input-field"]}
            value={userData.email}
            disabled
          />
        </div>

        <div className={styles["input-group"]}>
          <input
            name="especialidade"
            placeholder="Especialidade"
            className={styles["input-field"]}
            value={userData.especialidade}
            onChange={handleChange}
            disabled={!editing}
          />
        </div>

        <div className={styles["input-group"]}>
          <textarea
            name="experiencia"
            placeholder="Experiência"
            className={styles["input-field"]}
            value={userData.experiencia}
            onChange={handleChange}
            disabled={!editing}
          />
        </div>

        <div className={styles["input-group"]}>
          <input
            name="preco_hora"
            placeholder="Preço por hora"
            className={styles["input-field"]}
            value={userData.preco_hora}
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
            style={{ backgroundColor: "#ae3027ff", flex: 1 }}
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
