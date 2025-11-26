import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "../services/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "../styles/CadastroAluno.module.css";
import SearchableMultiSelect from "../components/SearchableMultiSelect";
import AddDisciplinaModal from "../components/AddDisciplinaModal";

const schema = z.object({
  area_interesse: z.string().min(2, "Informe os Conteúdos específicos."),
  descricao: z.string().min(10, "Descreva brevemente o que procura."),
  curso_id: z.string().min(1, "Selecione um curso."),
  disciplinas: z.array(z.number()).min(1, "Selecione ao menos uma disciplina."),
});

export default function AlunoCadastro() {
  const navigate = useNavigate();
  const { register, handleSubmit, control, formState: { errors }, setValue, getValues } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { disciplinas: [], area_interesse: '' }
  });

  const [cursos, setCursos] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [addOpen, setAddOpen] = useState(false);

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

  

  // Submissão do formulário
  const onSubmit = async (data) => {
    try {
      await api.post("/aluno", {
        area_interesse: data.area_interesse,
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

          {/* Descrição (agora vem primeiro) */}
          <div className={styles["input-group"]} style={{ marginTop: '0.6rem' }}>
            <textarea placeholder="Descrição" className={styles["input-field"]} {...register("descricao")} />
          </div>
          {errors.descricao && <p className={styles["error-text"]}>{errors.descricao.message}</p>}

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
              <div style={{ width: "100%", display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <SearchableMultiSelect
                    options={disciplinas}
                    value={field.value || []}
                    onChange={field.onChange}
                    placeholder="Pesquisar disciplinas..."
                  />
                </div>
                <button type="button" onClick={() => setAddOpen(true)} style={{ background: '#4a90e2', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>+</button>
              </div>
            )}
          />
          {errors.disciplinas && <p className={styles["error-text"]}>{errors.disciplinas.message}</p>}

          {/* Modal para criar disciplina */}
          <AddDisciplinaModal open={addOpen} onClose={() => setAddOpen(false)} cursos={cursos} cursoId={getValues('curso_id') || ''} onAdd={(disc) => {
            // atualizar lista local de disciplinas e selecionar a nova
            setDisciplinas(prev => [...prev, disc]);
            const current = getValues('disciplinas') || [];
            setValue('disciplinas', [...current, disc.id]);
            toast.success('Disciplina cadastrada!');
          }} />

          {/* Conteúdos específicos */}
          <div className={styles["input-group"]} style={{ marginTop: '0.6rem' }}>
            <input placeholder="Conteúdos específicos" className={styles["input-field"]} {...register("area_interesse")} />
          </div>
          {errors.area_interesse && <p className={styles["error-text"]}>{errors.area_interesse.message}</p>}

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
