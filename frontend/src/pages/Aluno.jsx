import { useNavigate } from "react-router-dom";
import { getMe } from "../services/auth";
import { useEffect, useState } from "react";
import homeStyles from "../styles/Home.module.css";
import profileStyles from "../styles/Profile.module.css";
import api from "../services/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SearchableMultiSelect from "../components/SearchableMultiSelect";
import FiltersModal from "../components/FiltersModal";
import ProfileEditModal from "../components/ProfileEditModal";
import ConnectionDetailModal from "../components/ConnectionDetailModal";

export default function AlunoPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: "" });
  const [aluno, setAluno] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [disciplinasOptions, setDisciplinasOptions] = useState([]);
  const [selectedCursoId, setSelectedCursoId] = useState(null);
  const [selectedDisciplinas, setSelectedDisciplinas] = useState([]);
  const [recomendacoes, setRecomendacoes] = useState([]);
  const [originalRecs, setOriginalRecs] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filtersOrder, setFiltersOrder] = useState(["compatibilidade", "menor_preco", "mais_alunos_monitorados", "especialidade"]);
  const [tab, setTab] = useState("geral");
  const [selectedMonitorId, setSelectedMonitorId] = useState(null);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [monitorSearch, setMonitorSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", area_interesse: "", descricao: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usuario = await getMe();
        setUser(usuario);

        // busca perfil do aluno
        const { data } = await api.get("/aluno/me");
        setAluno(data);
        setForm({ name: data.user?.name || "", area_interesse: data.area_interesse || "", descricao: data.descricao || "" });

        // inicializa curso e disciplinas selecionadas a partir da resposta (forma defensiva)
        const cursoId = data?.cursos && data.cursos.length ? data.cursos[0]?.curso?.id : null;
        setSelectedCursoId(cursoId);
        const selDiscs = Array.isArray(data?.disciplinas) ? data.disciplinas.map(d => d.disciplina?.id).filter(Boolean) : [];
        setSelectedDisciplinas(selDiscs);

        // buscar listas de cursos e todas as disciplinas (permitir selecionar qualquer disciplina)
        const cursosRes = await api.get("/cursos");
        setCursos(cursosRes.data || []);
        const discRes = await api.get("/disciplinas");
        const discList = (discRes.data && (discRes.data.disciplinas || discRes.data)) || [];
        setDisciplinasOptions(discList);

        // busca recomendações como antes (se houver aluno vinculado)
        const alunoRes = await api.get(`/aluno/usuario/${usuario.id}`);
        const alunoInfo = alunoRes.data;
        if (alunoInfo && alunoInfo.id) {
          const res = await api.get(`/match/${alunoInfo.id}`);
          setRecomendacoes(res.data);
          setOriginalRecs(res.data || []);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  useEffect(() => {
    // carregar solicitações enviadas do aluno (quando aluno conhecido)
    const loadOutgoing = async () => {
      try {
        if (!aluno || !aluno.id) return;
        const res = await api.get(`/connections/aluno`);
        setOutgoingRequests((res.data && res.data.requests) || []);
      } catch (err) {
        console.error('Erro ao carregar solicitações enviadas:', err);
      }
    };
    loadOutgoing();
  }, [aluno]);

  // Poll outgoing requests while the Conexões tab is active to reflect remote changes
  useEffect(() => {
    let timer = null;
    const startPolling = () => {
      timer = setInterval(async () => {
        try {
          const res = await api.get(`/connections/aluno`);
          setOutgoingRequests((res.data && res.data.requests) || []);
        } catch (err) {
          console.error('Erro no polling de solicitações enviadas:', err);
        }
      }, 5000);
    };

    if (tab === 'conexoes') startPolling();
    return () => { if (timer) clearInterval(timer); };
  }, [tab]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (modalData) => {
    // modalData is optional; when provided, use it instead of local form state
    const payload = modalData ? {
      name: modalData.name,
      descricao: modalData.descricao,
      area_interesse: modalData.area_interesse,
      curso_id: modalData.curso_id ? Number(modalData.curso_id) : selectedCursoId,
      disciplinas: Array.isArray(modalData.disciplinas) ? modalData.disciplinas.map(Number) : selectedDisciplinas,
    } : {
      name: form.name,
      area_interesse: form.area_interesse,
      descricao: form.descricao,
      curso_id: selectedCursoId,
      disciplinas: selectedDisciplinas,
    };

    try {
      await api.put("/aluno/me", payload);
      const res = await api.get("/aluno/me");
      setAluno(res.data);
      setUser(prev => ({ ...prev, name: payload.name }));
      toast.success('Alterações salvas com sucesso.');
      setModalOpen(false);
    } catch (err) {
      console.error("Erro ao salvar perfil do aluno:", err);
      toast.error("Erro ao salvar perfil do aluno.");
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm('Tem certeza que deseja excluir seu perfil de aluno? Esta ação não pode ser desfeita.');
    if (!ok) return;
    try {
      await api.delete('/aluno/me');
      toast.success('Perfil de aluno excluído com sucesso.');
      setTimeout(() => navigate('/'), 900);
    } catch (err) {
      console.error('Erro ao excluir aluno:', err);
      toast.error('Erro ao excluir perfil. Veja o console para detalhes.');
    }
  };

  function sortRecommendations(orderArr, recs, alunoArea) {
    const copy = Array.isArray(recs) ? [...recs] : [];

    const scoreEspecialidade = (especialidade = "") => {
      if (!especialidade || !alunoArea) return 0;
      const tokenize = (s) => (s || "").toLowerCase().split(/\W+/).filter(Boolean);
      const aWords = new Set(tokenize(alunoArea));
      const bWords = tokenize(especialidade);
      let count = 0;
      bWords.forEach(w => { if (aWords.has(w)) count++; });
      return count;
    };

    const parseCompat = (c) => {
      if (!c) return 0;
      const n = parseFloat(String(c).replace('%',''));
      return Number.isNaN(n) ? 0 : n;
    };

    const getVal = (monitor, key) => {
      switch(key) {
        case 'compatibilidade': return parseCompat(monitor.compatibilidade);
        case 'menor_preco': return monitor.monitor_preco_hora != null ? Number(monitor.monitor_preco_hora) : Number.POSITIVE_INFINITY;
        case 'mais_alunos_monitorados': return monitor.monitor_alunos_monitorados != null ? Number(monitor.monitor_alunos_monitorados) : -1;
        case 'especialidade': return scoreEspecialidade(monitor.monitor_especialidade);
        default: return 0;
      }
    };

    copy.sort((a,b) => {
      for (const key of orderArr) {
        const va = getVal(a, key);
        const vb = getVal(b, key);
        if (va === vb) continue;
        if (key === 'menor_preco') {
          return va - vb;
        }
        if (key === 'mais_alunos_monitorados' || key === 'compatibilidade' || key === 'especialidade') {
          return vb - va;
        }
      }
      return 0;
    });
    return copy;
  }

  if (loading) return <p>Carregando...</p>;

  return (
    <div className={profileStyles["profile-page"]}>
      <div className={profileStyles["profile-container"]}>
        <aside className={profileStyles.panel}>
          <div className={profileStyles["profile-info"]}>
            <h2 className={homeStyles["section-title"]} style={{ textAlign: 'center', color: '#3498db' }}>Perfil</h2>
            <div className={profileStyles["profile-row"]}><div className={profileStyles.label}>Nome</div><div className={profileStyles.value}>{aluno?.user?.name}</div></div>
            <div className={profileStyles["profile-row"]}><div className={profileStyles.label}>Descrição</div><div className={profileStyles.value}>{aluno?.descricao || '-'}</div></div>
            <div className={profileStyles["profile-row"]}><div className={profileStyles.label}>Curso</div><div className={profileStyles.value}>{aluno?.cursos && aluno.cursos.length ? aluno.cursos[0]?.curso?.nome : '-'}</div></div>

            <div className={profileStyles['profile-divider']} />

            <div className={profileStyles['profile-centered']}>
              <div className={profileStyles.label}>Conteúdos específicos</div>
              <div className={profileStyles.value}>{aluno?.area_interesse || '-'}</div>
            </div>
            <div className={profileStyles['profile-centered']}>
              <div className={profileStyles.label}>Disciplinas de interesse</div>
              <div className={profileStyles.value}>{(aluno?.disciplinas || []).length ? (
                <div>
                  {aluno.disciplinas.map((d, i) => (
                    <div key={d.id || i} style={{ marginBottom: '0.25rem' }}>{d.disciplina?.nome}</div>
                  ))}
                </div>
              ) : ('-')}</div>
            </div>

            <div className={profileStyles["edit-controls"]} style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className={`${profileStyles.btn} ${profileStyles["btn-secondary"]}`} onClick={() => setModalOpen(true)}>Editar</button>
            </div>
          </div>
        </aside>

        <main className={`${profileStyles.panel} ${profileStyles["right-content"]}`}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <h2 className={homeStyles["section-title"]}>Área do aluno</h2>
              <div style={{ display: 'flex', background: '#f2f2f6', borderRadius: 8, padding: 4, alignSelf: 'flex-start', marginTop: 8 }}>
                 <button className={homeStyles['tab-title']} onClick={() => setTab('geral')} style={{ border: 'none', background: tab === 'geral' ? '#3498db' : 'transparent', color: tab === 'geral' ? 'white' : '#333', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Monitores</button>
                 <button className={homeStyles['tab-title']} onClick={() => setTab('conexoes')} style={{ border: 'none', background: tab === 'conexoes' ? '#3498db' : 'transparent', color: tab === 'conexoes' ? 'white' : '#333', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Conexões</button>
              </div>
            </div>
            {/* botão de filtros movido para a linha da pesquisa */}
          </div>
          {tab === 'geral' && (
            recomendacoes.length === 0 ? (
              <p>Nenhum monitor recomendado encontrado.</p>
            ) : (
              <>
              {/* subtitle removed as requested */}
              <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  placeholder="Pesquisar por nome de monitor..."
                  value={monitorSearch}
                  onChange={(e) => setMonitorSearch(e.target.value)}
                  style={{ flex: 1, padding: '0.5rem', borderRadius: 8, border: '1px solid #d6dbe2', background: '#f2f2f6', color: 'black' }}
                />
                <button
                  onClick={() => setFiltersOpen(true)}
                  className={homeStyles["filters-button"]}
                  style={{ padding: '6px 10px', borderRadius: 8 }}
                >
                  Filtros
                </button>
              </div>
              <ul className={homeStyles["monitor-list"]}>
                {recomendacoes
                  .filter(m => !monitorSearch || (m.monitor_nome || '').toLowerCase().includes(monitorSearch.toLowerCase()))
                  .map((monitor) => {
                // normalize disciplinas_em_comum into an array of names
                let comuns = [];
                const raw = monitor.disciplinas_em_comum;
                if (Array.isArray(raw)) {
                  comuns = raw.map((d) => {
                    if (!d) return null;
                    if (typeof d === 'string') return d;
                    if (typeof d === 'object') {
                      if (d.nome) return d.nome;
                      if (d.name) return d.name;
                      if (d.disciplina && typeof d.disciplina === 'object') {
                        if (d.disciplina.nome) return d.disciplina.nome;
                        if (d.disciplina.name) return d.disciplina.name;
                      }
                      if (d.disciplina_nome) return d.disciplina_nome;
                      // fallback: try common keys
                      const keys = ['nome', 'name', 'titulo', 'disciplinaNome'];
                      for (const k of keys) if (d[k]) return d[k];
                      return null;
                    }
                    return String(d);
                  }).filter(Boolean);
                } else if (typeof raw === 'string') {
                  comuns = raw.split(',').map(s => s.trim()).filter(Boolean);
                }
                // defensive extraction of course name (backend may supply different shapes)
                const courseName = (
                  monitor.monitor_curso_nome ||
                  (monitor.curso && (monitor.curso.nome || monitor.curso.name)) ||
                  (monitor.monitor_curso && (monitor.monitor_curso.nome || monitor.monitor_curso.name)) ||
                  (Array.isArray(monitor.cursos) && monitor.cursos.length && (monitor.cursos[0].curso?.nome || monitor.cursos[0].curso_nome || monitor.cursos[0].nome)) ||
                  monitor.monitor_curso?.nome ||
                  monitor.monitor_curso
                ) || '';

                return (
                    <li key={monitor.monitor_id} className={homeStyles["monitor-item"]}
                      onClick={() => setSelectedMonitorId(prev => prev === monitor.monitor_id ? null : monitor.monitor_id)}
                      style={{ cursor: 'pointer', border: selectedMonitorId === monitor.monitor_id ? '2px solid #27ae60' : undefined }}>
                    <div className={homeStyles["monitor-item-grid"]}>
                      <div className={homeStyles["monitor-left"]}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1.12rem' }}>{monitor.monitor_nome}</div>
                          <div style={{ color: '#666', fontSize: '0.95rem' }}>{courseName || '-'}</div>
                          <div style={{ color: '#444', fontSize: '0.95rem' }}>{monitor.monitor_especialidade || '-'}</div>

                          <div style={{ height: 1, background: '#e6e6e6', margin: '4px 0' }} />

                          <div style={{ color: '#444', fontSize: '0.95rem' }}><strong>Preço/H: </strong>{monitor.monitor_preco_hora != null ? `R$ ${monitor.monitor_preco_hora}` : '-'}</div>
                          <div style={{ color: '#444', fontSize: '0.95rem' }}><strong>Alunos Monitorados: </strong>{monitor.monitor_alunos_monitorados != null ? monitor.monitor_alunos_monitorados : '-'}</div>
                          <div style={{ color: '#444', fontSize: '0.95rem' }}><strong>Compatibilidade: </strong>{monitor.compatibilidade != null ? monitor.compatibilidade : '-'}</div>
                        </div>
                      </div>

                      {/* disciplinas em comum moved to middle column */}
                      <div className={homeStyles["monitor-right"]}>
                        <div style={{ fontWeight: 700, marginBottom: 6, color: '#3498db' }}>Disciplinas em comum</div>
                        {comuns.length === 0 ? (
                          <div className={homeStyles["disciplina-item"]} style={{ color: '#777' }}>Nenhuma</div>
                        ) : (
                          comuns.map((nome, idx) => (
                            <div key={idx} className={homeStyles["disciplina-item"]}>{nome}</div>
                          ))
                        )}
                      </div>

                      {/* actions column: show connect button when selected and in conexoes tab */}
                      <div className={homeStyles["monitor-actions"]}>
                        {selectedMonitorId === monitor.monitor_id && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!aluno || !aluno.id) return toast.error('Aluno não identificado.');
                                try {
                                  await api.post('/connections', { monitor_id: monitor.monitor_id });
                                  toast.success('Solicitação de conexão enviada.');
                                  const res = await api.get(`/connections/aluno`);
                                  setOutgoingRequests((res.data && res.data.requests) || []);
                                } catch (err) {
                                  console.error('Erro ao criar conexão:', err);
                                  toast.error(err?.response?.data?.error || 'Erro ao enviar solicitação.');
                                }
                              }}
                              style={{ background: '#27ae60', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}
                            >
                              Conectar
                            </button>
                            {(() => {
                              const req = outgoingRequests.find(r => r.monitor && r.monitor.id === monitor.monitor_id);
                              if (req) return <div style={{ fontSize: '0.9rem' }}>Status: <strong>{req.status}</strong></div>;
                              return null;
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
              </ul>
            </>
            )
          )}

          {tab === 'conexoes' && (
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <h4 className={homeStyles['box-title']}>Conexões</h4>
                {(!outgoingRequests || outgoingRequests.filter(r => r.status === 'ACCEPTED').length === 0) ? (
                  <div style={{ color: 'black' }}>Você não possui conexões aceitas.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {outgoingRequests.filter(r => r.status === 'ACCEPTED').map(r => {
                      const mon = r.monitor;
                      return (
                            <div key={r.id} style={{ border: '1px solid #ddd', padding: 10, borderRadius: 8, background: '#fff', cursor: 'pointer' }}
                              onClick={() => { setSelectedConnection(r); setConnectionModalOpen(true); }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <div style={{ fontWeight: 700, color: '#3498db' }}>{mon?.user?.name || `Monitor ${r.monitor_id}`}</div>
                                  <div style={{ fontSize: '0.9rem', color: '#666' }}>{mon?.especialidade || ''}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '0.8rem', color: '#888' }}>{new Date(r.createdAt).toLocaleString()}</div>
                                </div>
                              </div>
                            </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <aside style={{ flex: 1, borderLeft: '1px solid #e6e6e6', paddingLeft: 12 }}>
                <h4 className={homeStyles['box-title']}>Seus pedidos</h4>
                {(!outgoingRequests || outgoingRequests.filter(r => r.status === 'PENDING').length === 0) ? (
                  <div style={{ color: 'black' }}>Nenhuma solicitação enviada.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {outgoingRequests.filter(r => r.status === 'PENDING').map(r => {
                      const mon = r.monitor;
                      return (
                        <div key={r.id} style={{ border: '1px solid #ddd', padding: 10, borderRadius: 8, background: '#fff' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: 700, color: '#3498db' }}>{mon?.user?.name || `Monitor ${r.monitor_id}`}</div>
                              <div style={{ fontSize: '0.9rem', color: '#666' }}>{mon?.especialidade || ''}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 700, color: 'black' }}>{r.status}</div>
                              <div style={{ fontSize: '0.8rem', color: '#888' }}>{new Date(r.createdAt).toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </aside>
            </div>
          )}
          <FiltersModal
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            order={filtersOrder}
            setOrder={setFiltersOrder}
            onApply={(order) => {
              const sorted = sortRecommendations(order, originalRecs, aluno?.area_interesse || "");
              setRecomendacoes(sorted);
            }}
          />
          
        </main>
      </div>
      <ToastContainer position="top-center" autoClose={2500} />
      <ProfileEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        role="aluno"
        initialData={aluno || {}}
        cursos={cursos}
        disciplinasOptions={disciplinasOptions}
        onSave={handleSave}
        onDelete={handleDelete}
      />
      <ConnectionDetailModal
        open={connectionModalOpen}
        onClose={() => { setConnectionModalOpen(false); setSelectedConnection(null); }}
        request={selectedConnection}
        otherRole={'monitor'}
        currentAluno={aluno}
        onTerminate={async (id) => {
          try {
            await api.delete(`/connections/${id}`);
            setConnectionModalOpen(false);
            setSelectedConnection(null);
            const res = await api.get(`/connections/aluno`);
            setOutgoingRequests((res.data && res.data.requests) || []);
            toast.success('Conexão terminada.');
          } catch (err) {
            console.error('Erro ao terminar conexão:', err);
            toast.error('Erro ao terminar conexão.');
          }
        }}
      />
    </div>
  );
}
