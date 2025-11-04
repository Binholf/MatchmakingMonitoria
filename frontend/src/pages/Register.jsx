import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { register as registerUser } from "../services/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import styles from "../styles/Login.module.css"; // CSS Modules

const schema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 letras."),
  email: z.string().email("Formato de e-mail inválido."),
  password: z.string().min(4, "A senha deve ter pelo menos 4 caracteres."),
  confirmPassword: z.string().min(4, "Confirme sua senha."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

export default function Register() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await registerUser(data.name, data.email, data.password);
      toast.success("✅ Registro realizado com sucesso!");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      const mensagem = err.response?.data?.error || "Erro ao registrar usuário";
      toast.error(`❌ ${mensagem}`);
    }
  };

  return (
    <div className={styles["login-page"]}>
      <div className={styles["login-card"]}>
        <div className={styles["login-icon"]}>
          <FaUser size={50} color="#4a90e2" />
        </div>

        <h2 className={styles["login-title"]}>Criar Conta</h2>

        <form onSubmit={handleSubmit(onSubmit)} className={styles["login-form"]}>
          {/* Nome */}
          <div className={styles["input-group"]}>
            <FaUser className={styles["input-icon"]} />
            <input
              type="text"
              placeholder="Nome"
              className={styles["input-field"]}
              {...register("name")}
            />
          </div>
          {errors.name && <p className={styles["error-text"]}>{errors.name.message}</p>}

          {/* Email */}
          <div className={styles["input-group"]}>
            <FaEnvelope className={styles["input-icon"]} />
            <input
              type="email"
              placeholder="Email"
              className={styles["input-field"]}
              {...register("email")}
            />
          </div>
          {errors.email && <p className={styles["error-text"]}>{errors.email.message}</p>}

          {/* Senha */}
          <div className={styles["input-group"]}>
            <FaLock className={styles["input-icon"]} />
            <input
              type="password"
              placeholder="Senha"
              className={styles["input-field"]}
              {...register("password")}
            />
          </div>
          {errors.password && <p className={styles["error-text"]}>{errors.password.message}</p>}

          {/* Confirmar senha */}
          <div className={styles["input-group"]}>
            <FaLock className={styles["input-icon"]} />
            <input
              type="password"
              placeholder="Confirmar Senha"
              className={styles["input-field"]}
              {...register("confirmPassword")}
            />
          </div>
          {errors.confirmPassword && (
            <p className={styles["error-text"]}>{errors.confirmPassword.message}</p>
          )}

          {/* Botão Criar Conta */}
          <button type="submit" className={styles["login-button"]}>
            Criar Conta
          </button>
        </form>

        {/* Link para login */}
        <div className={styles["register-link"]}>
          <p>
            Já tem uma conta?{" "}
            <span
              className={styles["register-text"]}
              onClick={() => navigate("/login")}
            >
              Entrar
            </span>
          </p>
        </div>
      </div>

      <ToastContainer position="top-center" autoClose={2500} />
    </div>
  );
}
