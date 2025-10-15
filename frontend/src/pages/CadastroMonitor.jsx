import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "../services/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "../styles/CadastroMonitor.module.css";

const schema = z.object({
  especialidade: z.string().min(3, "Informe sua especialidade."),
  experiencia: z.string().min(10, "Descreva sua experiência."),
  preco_hora: z.string().regex(/^\d+(\.\d{1,2})?$/, "Informe um preço válido."),
});

export default function MonitorCadastro() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const checkCadastro = async () => {
      try {
        const { data } = await api.get("/monitor/check");
        if (data.temCadastro) navigate("/monitor");
      } catch {
        navigate("/login");
      }
    };
    checkCadastro();
  }, [navigate]);

  const onSubmit = async (data) => {
    try {
      await api.post("/monitor", data);
      toast.success("Cadastro de monitor realizado!");
      setTimeout(() => navigate("/monitor"), 1500);
    } catch {
      toast.error("Erro ao cadastrar monitor.");
    }
  };

  return (
    <div className={styles["cadastro-page"]}>
      <div className={styles["cadastro-card"]}>
        <h2 className={styles["cadastro-title"]}>Bem vindo novo Monitor</h2>
        <h4 className={styles["cadastro-subtitle"]}>
          Preencha suas informações para começar a lecionar
        </h4>

        <form onSubmit={handleSubmit(onSubmit)} className={styles["login-form"]}>
          <div className={styles["input-group"]}>
            <input
              placeholder="Especialidade"
              className={styles["input-field"]}
              {...register("especialidade")}
            />
          </div>
          {errors.especialidade && (
            <p className={styles["error-text"]}>{errors.especialidade.message}</p>
          )}

          <div className={styles["input-group"]}>
            <textarea
              placeholder="Experiência"
              className={styles["input-field"]}
              {...register("experiencia")}
            />
          </div>
          {errors.experiencia && (
            <p className={styles["error-text"]}>{errors.experiencia.message}</p>
          )}

          <div className={styles["input-group"]}>
            <input
              placeholder="Preço por hora (ex: 50.00)"
              className={styles["input-field"]}
              {...register("preco_hora")}
            />
          </div>
          {errors.preco_hora && (
            <p className={styles["error-text"]}>{errors.preco_hora.message}</p>
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
