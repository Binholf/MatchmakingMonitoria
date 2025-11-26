import { useNavigate } from "react-router-dom";
import { getMe } from "../services/auth";
import { useEffect, useState } from "react";
import homeStyles from "../styles/Home.module.css";
import profileStyles from "../styles/Profile.module.css";
import api from "../services/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SearchableMultiSelect from "../components/SearchableMultiSelect";
import ProfileEditModal from "../components/ProfileEditModal";
import ConnectionDetailModal from "../components/ConnectionDetailModal";

export default function MonitorPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: "" });
  const [monitor, setMonitor] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [disciplinasOptions, setDisciplinasOptions] = useState([]);
  const [selectedCursoId, setSelectedCursoId] = useState(null);
  const [selectedDisciplinas, setSelectedDisciplinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", especialidade: "", alunos_monitorados: "", preco_hora: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState('geral');
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getMe();
        setUser(data);
        const res = await api.get("/monitor/me");
        setMonitor(res.data);
        // carregar solicitações recebidas para este monitor
        try {
          // use authenticated endpoint (no id in path)
          const reqs = await api.get(`/connections/monitor`);
          setIncomingRequests((reqs.data && reqs.data.requests) || []);
        } catch (e) {
          console.error('Erro ao carregar solicitações recebidas:', e);
        }
        setForm({ name: res.data.user?.name || "", especialidade: res.data.especialidade || "", alunos_monitorados: (res.data.alunos_monitorados ?? res.data.experiencia) || "", preco_hora: res.data.preco_hora || "" });

        const cursoId = res.data?.cursos && res.data.cursos.length ? res.data.cursos[0]?.curso?.id : null;
        setSelectedCursoId(cursoId);
        const selDiscs = Array.isArray(res.data?.disciplinas) ? res.data.disciplinas.map(d => d.disciplina?.id).filter(Boolean) : [];
        setSelectedDisciplinas(selDiscs);

        const cursosRes = await api.get('/cursos');
        setCursos(cursosRes.data || []);
        // carregar todas as disciplinas (permitir selecionar qualquer uma)
        const dres = await api.get('/disciplinas');
        const list = (dres.data && (dres.data.disciplinas || dres.data)) || [];
        setDisciplinasOptions(list);
      } catch (err) {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (modalData) => {
    const payload = modalData ? {
      name: modalData.name,
      descricao: modalData.descricao || undefined,
      especialidade: modalData.especialidade,
      alunos_monitorados: modalData.alunos_monitorados !== '' ? Number(modalData.alunos_monitorados) : undefined,
      preco_hora: modalData.preco_hora,
      curso_id: modalData.curso_id ? Number(modalData.curso_id) : selectedCursoId,
      disciplinas: Array.isArray(modalData.disciplinas) ? modalData.disciplinas.map(Number) : selectedDisciplinas,
    } : {
      name: form.name,
      descricao: form.descricao || undefined,
      especialidade: form.especialidade,
      alunos_monitorados: form.alunos_monitorados !== '' ? Number(form.alunos_monitorados) : undefined,
      preco_hora: form.preco_hora,
      curso_id: selectedCursoId,
      disciplinas: selectedDisciplinas,
    };

    try {
      await api.put("/monitor/me", payload);
      const updated = await api.get('/monitor/me');
      setMonitor(updated.data);
      setUser(prev => ({ ...prev, name: payload.name }));
      toast.success('Alterações salvas com sucesso.');
      setModalOpen(false);
    } catch (err) {
      console.error("Erro ao salvar perfil do monitor:", err);
      toast.error("Erro ao salvar perfil do monitor.");
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm('Tem certeza que deseja excluir seu perfil de monitor? Esta ação não pode ser desfeita.');
    if (!ok) return;
    try {
      await api.delete('/monitor/me');
      toast.success('Perfil de monitor excluído com sucesso.');
      setTimeout(() => navigate('/'), 900);
    } catch (err) {
      console.error('Erro ao excluir monitor:', err);
      toast.error('Erro ao excluir perfil. Veja o console para detalhes.');
    }
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div className={profileStyles["profile-page"]}>
      <div className={profileStyles["profile-container"]}>
        <aside className={`${profileStyles.panel} ${profileStyles['panel--purple']}`}>
          <div className={profileStyles["profile-info"]}>
            <h2 className={homeStyles["section-title"]} style={{ textAlign: 'center', color: '#4b0082' }}>Perfil</h2>
            <div className={profileStyles["profile-row"]}><div className={profileStyles.label}>Nome</div><div className={profileStyles.value}>{monitor?.user?.name}</div></div>
            <div className={profileStyles["profile-row"]}><div className={profileStyles.label}>Conteúdos específicos</div><div className={profileStyles.value}>{monitor?.especialidade || '-'}</div></div>
            <div className={profileStyles["profile-row"]}><div className={profileStyles.label}>Descrição</div><div className={profileStyles.value}>{monitor?.descricao || '-'}</div></div>
            <div className={profileStyles["profile-row"]}><div className={profileStyles.label}>Curso</div><div className={profileStyles.value}>{monitor?.cursos && monitor.cursos.length ? monitor.cursos[0]?.curso?.nome : '-'}</div></div>

            <div className={profileStyles['profile-divider']} />

            <div className={profileStyles['profile-centered']}>
              <div className={profileStyles.label}>Alunos monitorados</div>
              <div className={profileStyles.value}>{(monitor?.alunos_monitorados ?? monitor?.experiencia) ?? '-'}</div>
            </div>
            <div className={profileStyles['profile-centered']}>
              <div className={profileStyles.label}>Preço/h</div>
              <div className={profileStyles.value}>{monitor?.preco_hora ?? '-'}</div>
            </div>
            <div className={profileStyles['profile-centered']}>
              <div className={profileStyles.label}>Disciplinas de interesse</div>
              <div className={profileStyles.value}>{(monitor?.disciplinas || []).length ? (
                <div>
                  {monitor.disciplinas.map((d, i) => (
                    <div key={d.id || i} style={{ marginBottom: '0.25rem' }}>{d.disciplina?.nome}</div>
                  ))}
                </div>
              ) : ('-')}</div>
            </div>

            {/* incoming requests will be displayed in the main panel under the Conexões tab */}

            <div className={profileStyles["edit-controls"]} style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className={`${profileStyles.btn} ${profileStyles["btn-secondary"]}`} onClick={() => setModalOpen(true)}>Editar</button>
            </div>
          </div>
        </aside>

        <main className={`${profileStyles.panel} ${profileStyles['panel--purple']} ${profileStyles["right-content"]}`}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <h2 className={homeStyles["section-title"]} style={{ color: '#4b0082' }}>Área do Monitor</h2>
              <div style={{ display: 'flex', background: '#f2f2f6', borderRadius: 8, padding: 4, alignSelf: 'flex-start', marginTop: 8 }}>
                <button className={homeStyles['tab-title']} onClick={() => setTab('geral')} style={{ border: 'none', background: tab === 'geral' ? '#4b0082' : 'transparent', color: tab === 'geral' ? 'white' : '#333', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Geral</button>
                <button className={homeStyles['tab-title']} onClick={() => setTab('conexoes')} style={{ border: 'none', background: tab === 'conexoes' ? '#4b0082' : 'transparent', color: tab === 'conexoes' ? 'white' : '#333', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Conexões</button>
              </div>
            </div>
          </div>

          {tab === 'geral' && (
            <>
              <p>Conteúdo do painel do monitor (agenda, anúncios, etc.) pode ficar aqui.</p>
            </>
          )}

          {tab === 'conexoes' && (
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <h4 className={homeStyles['box-title']}>Conexões</h4>
                {(!incomingRequests || incomingRequests.filter(r => r.status === 'ACCEPTED').length === 0) ? (
                  <div style={{ color: 'black' }}>Você não possui conexões aceitas.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {incomingRequests.filter(r => r.status === 'ACCEPTED').map(r => (
                      <div key={r.id} style={{ border: '1px solid #ddd', padding: 10, borderRadius: 8, background: '#fff', cursor: 'pointer' }} onClick={() => { setSelectedConnection(r); setConnectionModalOpen(true); }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 700, color: '#4b0082' }}>{r.aluno?.user?.name || `Aluno ${r.aluno_id}`}</div>
                            <div style={{ fontSize: '0.9rem', color: '#666' }}>{r.aluno?.area_interesse || ''}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.8rem', color: '#888' }}>{new Date(r.createdAt).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <aside style={{ flex: 1, borderLeft: '1px solid #e6e6e6', paddingLeft: 12 }}>
                <h4 className={homeStyles['box-title']}>Solicitações recebidas</h4>
                {incomingRequests.filter(r => r.status !== 'REJECTED' && r.status !== 'ACCEPTED').length === 0 ? (
                  <div style={{ color: 'black' }}>Nenhuma solicitação recebida.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {incomingRequests.filter(r => r.status !== 'REJECTED' && r.status !== 'ACCEPTED').map(r => (
                      <div key={r.id} style={{ border: '1px solid #ddd', padding: 10, borderRadius: 8, background: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 700, color: '#4b0082' }}>{r.aluno?.user?.name || `Aluno ${r.aluno_id}`}</div>
                            <div style={{ fontSize: '0.9rem', color: '#666' }}>{r.aluno?.area_interesse || ''}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={async () => {
                              try {
                                const updated = await api.patch(`/connections/${r.id}`, { status: 'ACCEPTED' });
                                toast.success('Solicitação aceita.');
                                const req = (updated.data && updated.data.request) || updated.data;
                                setIncomingRequests(prev => prev.map(p => p.id === r.id ? req : p));
                              } catch (err) {
                                console.error('Erro ao aceitar:', err);
                                toast.error('Erro ao aceitar solicitação.');
                              }
                            }} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 6 }}>Aceitar</button>
                            <button onClick={async () => {
                              try {
                                const updated = await api.patch(`/connections/${r.id}`, { status: 'REJECTED' });
                                toast.info('Solicitação recusada.');
                                setIncomingRequests(prev => prev.filter(p => p.id !== r.id));
                              } catch (err) {
                                console.error('Erro ao recusar:', err);
                                toast.error('Erro ao recusar solicitação.');
                              }
                            }} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 6 }}>Recusar</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </aside>
            </div>
          )}

        </main>
        <ToastContainer position="top-center" autoClose={2500} />
      <ProfileEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        role="monitor"
        initialData={monitor || {}}
        cursos={cursos}
        disciplinasOptions={disciplinasOptions}
        onSave={handleSave}
        onDelete={handleDelete}
      />
      <ConnectionDetailModal
        open={connectionModalOpen}
        onClose={() => { setConnectionModalOpen(false); setSelectedConnection(null); }}
        request={selectedConnection}
        otherRole={'aluno'}
        currentMonitor={monitor}
        onTerminate={async (id) => {
          try {
            await api.delete(`/connections/${id}`);
            setConnectionModalOpen(false);
            setSelectedConnection(null);
            const reqs = await api.get(`/connections/monitor`);
            setIncomingRequests((reqs.data && reqs.data.requests) || []);
            toast.success('Conexão terminada.');
          } catch (err) {
            console.error('Erro ao terminar conexão:', err);
            toast.error('Erro ao terminar conexão.');
          }
        }}
      />
      </div>
    </div>
  );
}
