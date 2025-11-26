import React, { useEffect, useState } from 'react';
import styles from './ProfileEditModal.module.css';
import SearchableMultiSelect from './SearchableMultiSelect';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AddDisciplinaModal from './AddDisciplinaModal';

export default function ProfileEditModal({ open, onClose, role = 'aluno', initialData = {}, cursos = [], disciplinasOptions = [], onSave, onDelete }) {
  const [form, setForm] = useState({});
  const [discipOptions, setDiscipOptions] = useState(disciplinasOptions || []);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    // initialize form from initialData
    setForm({
      name: initialData.name || initialData.user?.name || '',
      descricao: initialData.descricao || '',
      area_interesse: initialData.area_interesse || '',
      especialidade: initialData.especialidade || '',
      alunos_monitorados: initialData.alunos_monitorados ?? initialData.experiencia ?? '',
      preco_hora: initialData.preco_hora ?? '',
      curso_id: (initialData.cursos && initialData.cursos.length && (initialData.cursos[0].curso?.id || initialData.cursos[0].curso_id)) || initialData.curso_id || '',
      disciplinas: Array.isArray(initialData.disciplinas) ? initialData.disciplinas.map(d => (d.disciplina?.id ?? d.disciplina_id ?? d.id ?? d)) : (initialData.disciplinas || []),
    });
    // initialize local options copy
    setDiscipOptions(disciplinasOptions || []);
  }, [open, initialData]);

  useEffect(() => {
    setDiscipOptions(disciplinasOptions || []);
  }, [disciplinasOptions]);

  if (!open) return null;

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (onSave) await onSave(form);
    onClose();
  };

  const handleAddDisciplina = (disciplina) => {
    // callback from modal: disciplina is the created object
    if (!disciplina) return;
    setDiscipOptions(prev => [...prev, disciplina]);
    setForm(prev => ({ ...prev, disciplinas: Array.isArray(prev.disciplinas) ? [...prev.disciplinas, disciplina.id] : [disciplina.id] }));
    toast.success('Disciplina cadastrada!');
    setAddOpen(false);
  };

  const handleDelete = async () => {
    const ok = window.confirm('Tem certeza que deseja excluir seu perfil? Esta ação não pode ser desfeita.');
    if (!ok) return;
    if (onDelete) await onDelete();
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <h3>{role === 'monitor' ? 'Editar perfil do Monitor' : 'Editar perfil do Aluno'}</h3>
          <button className={styles.close} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          <div className={styles.field}>
            <label>Nome</label>
            <input name="name" value={form.name || ''} onChange={handleChange} />
          </div>

          {role === 'aluno' && (
            <>
              <div className={styles.field}>
                <label>Descrição</label>
                <textarea name="descricao" value={form.descricao || ''} onChange={handleChange} rows={3} />
              </div>
              <div className={styles.field}>
                <label>Conteúdos específicos</label>
                <input name="area_interesse" value={form.area_interesse || ''} onChange={handleChange} />
              </div>
            </>
          )}

          {role === 'monitor' && (
            <>
              <div className={styles.field}>
                <label>Descrição</label>
                <textarea name="descricao" value={form.descricao || ''} onChange={(e) => setForm(prev => ({ ...prev, descricao: e.target.value }))} rows={3} />
              </div>
              <div className={styles.field}>
                <label>Conteúdos específicos</label>
                <input name="especialidade" value={form.especialidade || ''} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label>Alunos monitorados</label>
                <input name="alunos_monitorados" type="number" value={form.alunos_monitorados || ''} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label>Preço por hora</label>
                <input name="preco_hora" value={form.preco_hora || ''} onChange={handleChange} />
              </div>
            </>
          )}

          <div className={styles.field}>
            <label>Curso</label>
            <select name="curso_id" value={form.curso_id || ''} onChange={handleChange}>
              <option value="">-- Selecionar curso --</option>
              {Array.isArray(cursos) && cursos.map(c => (<option key={c.id} value={c.id}>{c.nome}</option>))}
            </select>
          </div>

          <div className={styles.field}>
            <label>Disciplinas</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <SearchableMultiSelect options={discipOptions} value={form.disciplinas || []} onChange={(v) => setForm(prev => ({ ...prev, disciplinas: v }))} />
              </div>
              <button type="button" className={styles.smallButton} onClick={() => setAddOpen(true)}>+</button>
            </div>
          </div>

          <AddDisciplinaModal open={addOpen} onClose={() => setAddOpen(false)} cursos={cursos} cursoId={form.curso_id} onAdd={handleAddDisciplina} />
        </div>

        <div className={styles.actions}>
          {onDelete && (
            <button className={styles.btnDanger} onClick={handleDelete}>Excluir</button>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className={styles.btn} onClick={handleSave}>Salvar</button>
            <button className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
