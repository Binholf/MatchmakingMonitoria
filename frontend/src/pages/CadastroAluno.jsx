import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "../services/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "../styles/CadastroAluno.module.css";

const schema = z.object({
  descricao: z.string().min(10, "Descreva brevemente o que procura."),
  curso_id: z.string().min(1, "Selecione um curso."),
  disciplinas: z.array(z.number()).min(1, "Selecione ao menos uma disciplina."),
});

export default function AlunoCadastro() {
  const navigate = useNavigate();
  const { register, handleSubmit, control, formState: { errors }, setValue, getValues } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { disciplinas: [] }
  });

  const [cursos, setCursos] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [novaDisciplina, setNovaDisciplina] = useState("");

  // Verifica se o aluno já tem cadastro
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

  // Carrega cursos e disciplinas
  useEffect(() => {
    api.get("/cursos")
      .then(res => setCursos(res.data))
      .catch(() => toast.error("Erro ao carregar cursos."));

    api.get("/disciplinas")
      .then(res => {
        const lista = Array.isArray(res.data.disciplinas) ? res.data.disciplinas : res.data;
        setDisciplinas(lista);
      })
      .catch(() => toast.error("Erro ao carregar disciplinas."));
  }, []);

  // Adicionar nova disciplina
  const adicionarDisciplina = async () => {
    if (!novaDisciplina.trim()) return toast.error("Informe o nome da disciplina.");
    try {
      const curso_id = parseInt(getValues("curso_id"));
      if (isNaN(curso_id)) return toast.error("Selecione um curso antes de cadastrar a disciplina.");

      const { data } = await api.post("/disciplinas", {
        nome: novaDisciplina,
        curso_id,
      });

      // ✅ Correção: acessar data.disciplina
      setDisciplinas(prev => [...prev, data.disciplina]);
      setValue("disciplinas", [...getValues("disciplinas"), data.disciplina.id]);
      setNovaDisciplina("");
      console.log("Nova disciplina retornada:", data);
      toast.success("Disciplina cadastrada!");
    } catch (err) {
      toast.error("Erro ao cadastrar disciplina.");
      console.error(err);
    }
  };

  // Submissão do formulário
  const onSubmit = async (data) => {
    try {
      await api.post("/aluno", {
        descricao: data.descricao,
        curso_id: parseInt(data.curso_id),
        disciplinas: data.disciplinas,
      });
      toast.success("Cadastro de aluno realizado!");
      setTimeout(() => navigate("/aluno"), 1500);
    } catch {
      toast.error("Erro ao cadastrar aluno.");
    }
  };

  return (
    <div className={styles["cadastro-page"]}>
      <div className={styles["cadastro-card"]}>
        <h2 className={styles["cadastro-title"]}>Bem-vindo novo Aluno</h2>
        <h4 className={styles["cadastro-subtitle"]}>Preencha suas informações para começar a estudar</h4>

        <form onSubmit={handleSubmit(onSubmit)} className={styles["login-form"]}>
          
          {/* Seleção do curso */}
          <div className={styles["input-group"]}>
            <select id="cursoSelect" {...register("curso_id")} className={styles["input-field"]}>
              <option value="">Selecione o curso</option>
              {cursos.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          {errors.curso_id && <p className={styles["error-text"]}>{errors.curso_id.message}</p>}

          {/* Disciplinas */}
          <Controller
            control={control}
            name="disciplinas"
            render={({ field }) => (
              <div className={styles["disciplinas-container"]}>
                {Array.isArray(disciplinas) && disciplinas.map(d => (
                  // ✅ Garantia de key única
                  <label key={d.id} className={styles["disciplina-item"]}>
                    <input
                      type="checkbox"
                      value={d.id}
                      checked={field.value?.includes(d.id) || false}
                      onChange={e => {
                        const checked = e.target.checked;
                        const val = parseInt(e.target.value);
                        if (checked) field.onChange([...(field.value || []), val]);
                        else field.onChange(field.value.filter(v => v !== val));
                      }}
                    />
                    {d.nome || "Sem nome"}
                  </label>
                ))}
              </div>
            )}
          />
          {errors.disciplinas && <p className={styles["error-text"]}>{errors.disciplinas.message}</p>}

          {/* Cadastrar nova disciplina */}
          <div className={styles["input-group"]} style={{ marginTop: "0.5rem" }}>
            <input
              placeholder="Cadastrar nova disciplina"
              className={styles["input-field"]}
              value={novaDisciplina}
              onChange={e => setNovaDisciplina(e.target.value)}
            />
            <button
              type="button"
              onClick={adicionarDisciplina}
              className={styles["cadastro-button"]}
              style={{ flex: 0.5, marginLeft: "0.5rem" }}
            >
              +
            </button>
          </div>

          {/* Descrição */}
          <div className={styles["input-group"]} style={{ marginTop: "1rem" }}>
            <textarea
              placeholder="Descrição"
              className={styles["input-field"]}
              {...register("descricao")}
            />
          </div>
          {errors.descricao && <p className={styles["error-text"]}>{errors.descricao.message}</p>}

          {/* Botões */}
          <div className={styles["button-row"]}>
            <button type="submit" className={styles["cadastro-button"]}>Cadastrar</button>
            <button type="button" onClick={() => navigate("/home")} className={styles["cancel-button"]}>Cancelar</button>
          </div>
        </form>
      </div>
      <ToastContainer position="top-center" autoClose={2500} />
    </div>
  );
}
