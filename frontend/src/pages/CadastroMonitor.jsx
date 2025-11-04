import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";

const CadastroMonitor = () => {
  const { control, handleSubmit, setValue } = useForm();
  const [cursos, setCursos] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [monitor, setMonitor] = useState(null);

  // Buscar cursos e disciplinas do backend
  useEffect(() => {
    const fetchCursos = async () => {
      const res = await axios.get("/cursos");
      setCursos(res.data);
    };

    const fetchDisciplinas = async () => {
      const res = await axios.get("/disciplinas");
      setDisciplinas(res.data);
    };

    fetchCursos();
    fetchDisciplinas();
  }, []);

  // Buscar dados do monitor caso já exista cadastro
  useEffect(() => {
    const fetchMonitor = async () => {
      try {
        const res = await axios.get("/monitor/me");
        setMonitor(res.data);

        // Preencher campos do formulário
        setValue("especialidade", res.data.especialidade);
        setValue("experiencia", res.data.experiencia);
        setValue("preco_hora", res.data.preco_hora);
        setValue("curso_id", res.data.cursos?.id || "");
        setValue(
          "disciplinas",
          res.data.disciplinas?.map((d) => d.id) || []
        );
      } catch (err) {
        console.log("Monitor não cadastrado ainda");
      }
    };

    fetchMonitor();
  }, [setValue]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        especialidade: data.especialidade,
        experiencia: data.experiencia,
        preco_hora: parseFloat(data.preco_hora),
        curso_id: Number(data.curso_id),
        disciplinas: Array.isArray(data.disciplinas)
          ? data.disciplinas.map(Number)
          : [],
      };

      console.log("Dados que serão enviados:", payload);

      const res = await axios.post("/monitor", payload);
      console.log("Monitor cadastrado:", res.data);
      setMonitor(res.data);
    } catch (err) {
      console.error("Erro ao cadastrar monitor:", err);
    }
  };

  return (
    <div className="cadastro-page">
      <div className="cadastro-card">
        <h2 className="cadastro-title">Cadastro de Monitor</h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Especialidade */}
          <Controller
            name="especialidade"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <div className="input-group">
                <input
                  {...field}
                  className="input-field"
                  placeholder="Especialidade"
                />
              </div>
            )}
          />

          {/* Experiência */}
          <Controller
            name="experiencia"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <div className="input-group">
                <input
                  {...field}
                  className="input-field"
                  placeholder="Experiência"
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
              <div className="input-group">
                <input
                  {...field}
                  className="input-field"
                  placeholder="Preço por hora"
                  type="number"
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
              <div className="input-group">
                <select {...field} className="input-field">
                  <option value="">Selecione um curso</option>
                  {cursos.map((curso) => (
                    <option key={curso.id} value={curso.id}>
                      {curso.nome}
                    </option>
                  ))}
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
              <div className="input-group" style={{ flexDirection: "column" }}>
                {disciplinas.map((disciplina) => (
                  <label key={disciplina.id} style={{ color: "#000" }}>
                    <input
                      type="checkbox"
                      value={disciplina.id}
                      checked={field.value.includes(disciplina.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          field.onChange([...field.value, disciplina.id]);
                        } else {
                          field.onChange(
                            field.value.filter((id) => id !== disciplina.id)
                          );
                        }
                      }}
                    />
                    {disciplina.nome}
                  </label>
                ))}
              </div>
            )}
          />

          <div className="button-row">
            <button type="submit" className="cadastro-button">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CadastroMonitor;
