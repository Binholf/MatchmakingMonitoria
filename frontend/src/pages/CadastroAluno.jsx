import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "../services/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "../styles/CadastroAluno.module.css"; // CSS Modules

const schema = z.object({
  area_interesse: z.string().min(3, "Informe uma área de interesse."),
  descricao: z.string().min(10, "Descreva brevemente o que procura."),
});

export default function AlunoCadastro() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const checkCadastro = async () => {
      try {
        const { data } = await api.get("/aluno/check");
        if (data.temCadastro) navigate("/aluno");
      } catch {
        navigate("/login");
      }
    };
    checkCadastro();
  }, [navigate]);

  const onSubmit = async (data) => {
    try {
      await api.post("/aluno", data);
      toast.success("Cadastro de aluno realizado!");
      setTimeout(() => navigate("/aluno"), 1500);
    } catch {
      toast.error("Erro ao cadastrar aluno.");
    }
  };

  return (
    <div className={styles["cadastro-page"]}>
      <div className={styles["cadastro-card"]}>
        <h2 className={styles["cadastro-title"]}>Bem vindo novo Aluno</h2>
        <h4 className={styles["cadastro-subtitle"]}>Preencha suas informações para começar a estudar</h4>

        <form onSubmit={handleSubmit(onSubmit)} className={styles["login-form"]}>
          <div className={styles["input-group"]}>
            <input
              placeholder="Área de interesse"
              className={styles["input-field"]}
              {...register("area_interesse")}
            />
          </div>
          {errors.area_interesse && (
            <p className={styles["error-text"]}>{errors.area_interesse.message}</p>
          )}

          <div className={styles["input-group"]}>
            <textarea
              placeholder="Descrição"
              className={styles["input-field"]}
              {...register("descricao")}
            />
          </div>
          {errors.descricao && (
            <p className={styles["error-text"]}>{errors.descricao.message}</p>
          )}

          {/* Botões lado a lado */}
          <div className={styles["button-row"]}>
            <button type="submit" className={styles["cadastro-button"]}>
              Cadastrar
            </button>
            <button
              type="button"
              onClick={() => navigate("/home")}
              className={styles["cancel-button"]}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      <ToastContainer position="top-center" autoClose={2500} />
    </div>
  );
}
