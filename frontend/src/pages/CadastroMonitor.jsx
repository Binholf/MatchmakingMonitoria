import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import styles from "../styles/CadastroMonitor.module.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SearchableMultiSelect from "../components/SearchableMultiSelect";
import AddDisciplinaModal from "../components/AddDisciplinaModal";

const CadastroMonitor = () => {
  const { control, handleSubmit, setValue, getValues } = useForm();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cursos, setCursos] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [monitor, setMonitor] = useState(null);

  // Buscar cursos e disciplinas do backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cursosRes, disciplinasRes] = await Promise.all([
          api.get("/cursos"),
          api.get("/disciplinas"),
        ]);

        const cursosData = cursosRes && cursosRes.data ? cursosRes.data : cursosRes;
        const disciplinasData = disciplinasRes && disciplinasRes.data ? disciplinasRes.data : disciplinasRes;

        setCursos(Array.isArray(cursosData) ? cursosData : (cursosData?.cursos ?? []));
        setDisciplinas(Array.isArray(disciplinasData) ? disciplinasData : (disciplinasData?.disciplinas ?? []));
      } catch (err) {
        console.error("Erro ao buscar cursos/disciplinas:", err);
        setCursos([]);
        setDisciplinas([]);
      }
    };

    fetchData();
  }, []);

  // Buscar dados do monitor caso já exista cadastro
  useEffect(() => {
    const fetchMonitor = async () => {
      try {
        const res = await api.get("/monitor/me");
        if (res?.data) {
          setMonitor(res.data);

          // Preencher campos do formulário com segurança
          setValue("especialidade", res.data.especialidade || "");
          setValue("descricao", res.data.descricao || "");
          setValue("alunos_monitorados", (res.data.alunos_monitorados ?? res.data.experiencia) || "");
          setValue("preco_hora", res.data.preco_hora || "");
          const cursoId = Array.isArray(res.data.cursos) && res.data.cursos.length
            ? (res.data.cursos[0].curso?.id ?? res.data.cursos[0].curso_id)
            : (res.data.cursos?.id ?? "");
          setValue("curso_id", cursoId || "");
          const disciplinasArr = Array.isArray(res.data.disciplinas)
            ? res.data.disciplinas.map(d => Number(d.disciplina_id ?? d.id ?? d))
            : [];
          setValue("disciplinas", disciplinasArr);
        }
      } catch (err) {
        console.log("Monitor não cadastrado ainda ou erro:", err?.response?.status ?? err);
      }
    };

    fetchMonitor();
  }, [setValue]);


  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {};
      if (typeof data.descricao !== 'undefined' && data.descricao !== '') payload.descricao = data.descricao;
      if (typeof data.especialidade !== 'undefined' && data.especialidade !== '') payload.especialidade = data.especialidade;
      if (typeof data.alunos_monitorados !== 'undefined' && data.alunos_monitorados !== '') payload.alunos_monitorados = Number(data.alunos_monitorados);
      if (typeof data.preco_hora !== 'undefined' && data.preco_hora !== '' && !Number.isNaN(parseFloat(data.preco_hora))) payload.preco_hora = parseFloat(data.preco_hora);
      if (typeof data.curso_id !== 'undefined' && data.curso_id !== '') payload.curso_id = Number(data.curso_id);
      payload.disciplinas = Array.isArray(data.disciplinas) ? data.disciplinas.map(Number) : [];

      console.log("Dados que serão enviados:", payload);

      const res = await api.post("/monitor", payload);
      console.log("Monitor cadastrado:", res.data);
      setMonitor(res.data);
      toast.success("Monitor cadastrado com sucesso!");
      // aguarda 1s para o usuário ver a notificação e então navega
      setTimeout(() => navigate("/monitor"), 1000);
    } catch (err) {
      console.error("Erro ao cadastrar monitor:", err);
      const msg = err?.response?.data?.error || err?.message || "Erro ao cadastrar monitor.";
      toast.error(msg);
    }
    finally {
      setIsSubmitting(false);
    }
  };

  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className={styles["cadastro-page"]}>
      <div className={styles["cadastro-card"]}>
        <h2 className={styles["cadastro-title"]}>Cadastro de Monitor</h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Descrição (agora vem primeiro) */}
          <Controller
            name="descricao"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <div className={styles["input-group"]}>
                <textarea
                  {...field}
                  className={styles["input-field"]}
                  placeholder="Descrição (apresente seu perfil)"
                  rows={3}
                />
              </div>
            )}
          />

          {/* Curso */}
          <Controller
            name="curso_id"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <div className={styles["input-group"]}>
                <select {...field} className={styles["input-field"]}>
                  <option value="">Selecione um curso</option>
                  {Array.isArray(cursos) ? (
                    cursos.map((curso) => (
                      <option key={curso.id} value={curso.id}>
                        {curso.nome}
                      </option>
                    ))
                  ) : (
                    <option disabled>Dados de cursos inválidos</option>
                  )}
                </select>
              </div>
            )}
          />

          {/* Disciplinas */}
          <Controller
            name="disciplinas"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <div className={styles["input-group"]} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: '100%' }}>
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

          {/* Especialidade */}
          <Controller
            name="especialidade"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <div className={styles["input-group"]}>
                <input
                  {...field}
                  className={styles["input-field"]}
                  placeholder="Especialidade"
                />
              </div>
            )}
          />

          {/* Preço/Hora */}
          <Controller
            name="preco_hora"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <div className={styles["input-group"]}>
                <input
                  {...field}
                  className={styles["input-field"]}
                  placeholder="Preço por hora"
                  type="number"
                />
              </div>
            )}
          />

          {/* Alunos monitorados (número) */}
          <Controller
            name="alunos_monitorados"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <div className={styles["input-group"]}>
                <input
                  {...field}
                  className={styles["input-field"]}
                  placeholder="Alunos monitorados (número)"
                  type="number"
                />
              </div>
            )}
          />

          <div className={styles["button-row"]}>
            <button type="submit" className={styles["cadastro-button"]} disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
      <ToastContainer position="top-center" autoClose={2500} />
      <AddDisciplinaModal open={addOpen} onClose={() => setAddOpen(false)} cursos={cursos} cursoId={getValues('curso_id') || ''} onAdd={(disc) => {
        setDisciplinas(prev => [...prev, disc]);
        const current = getValues('disciplinas') || [];
        setValue('disciplinas', Array.isArray(current) ? [...current, disc.id] : [disc.id]);
        toast.success('Disciplina cadastrada!');
      }} />
    </div>
  );
};

export default CadastroMonitor;
