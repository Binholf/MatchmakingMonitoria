import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaUser, FaLock } from "react-icons/fa";
import styles from "../styles/Login.module.css"; // CSS Modules

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      await login(email, password);
      navigate("/home");
    } catch (err) {
      const mensagem = err.response?.data?.error || "Usuário ou senha incorretos.";
      toast.error(`❌ ${mensagem}`);
    }
  };

  return (
    <div className={styles["login-page"]}>
      <div className={styles["login-card"]}>
        <div className={styles["login-icon"]}>
          <FaUser size={50} color="#4a90e2" />
        </div>

        <h2 className={styles["login-title"]}>Login</h2>

        <form onSubmit={handleLogin} className={styles["login-form"]}>
          <div className={styles["input-group"]}>
            <FaUser className={styles["input-icon"]} />
            <input
              type="email"
              placeholder="Email"
              className={styles["input-field"]}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles["input-group"]}>
            <FaLock className={styles["input-icon"]} />
            <input
              type="password"
              placeholder="Senha"
              className={styles["input-field"]}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className={styles["login-button"]}>
            Entrar
          </button>
        </form>

        <div className={styles["register-link"]}>
          <p>
            Não tem uma conta?{" "}
            <span
              className={styles["register-text"]}
              onClick={() => navigate("/register")}
            >
              Registre-se
            </span>
          </p>
        </div>
      </div>

      <ToastContainer position="top-center" autoClose={2500} />
    </div>
  );
}
