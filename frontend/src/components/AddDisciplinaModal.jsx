import React, { useState } from 'react';
import styles from './AddDisciplinaModal.module.css';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function AddDisciplinaModal({ open, onClose, cursos = [], cursoId = null, onAdd }) {
  const [nome, setNome] = useState('');
  const [selectedCurso, setSelectedCurso] = useState(cursoId || (cursos && cursos.length ? cursos[0].id : ''));
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleAdd = async () => {
    const n = (nome || '').trim();
    if (!n) return toast.error('Informe o nome da disciplina.');
    if (!selectedCurso) return toast.error('Selecione um curso.');
    setLoading(true);
    try {
      const res = await api.post('/disciplinas', { nome: n, curso_id: Number(selectedCurso) });
      if (res?.data?.success && res.data.disciplina) {
        if (onAdd) onAdd(res.data.disciplina);
        setNome('');
        onClose();
      } else {
        toast.error(res?.data?.error || 'Erro ao criar disciplina.');
      }
    } catch (err) {
      console.error('Erro ao criar disciplina:', err);
      toast.error('Erro ao criar disciplina.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <button className={styles.close} onClick={onClose}>×</button>
        <h3 className={styles.title}>Cadastrar nova disciplina</h3>

        <div className={styles.body}>
          <label className={styles.label}>Curso</label>
          <select className={styles.select} value={selectedCurso || ''} onChange={(e) => setSelectedCurso(e.target.value)}>
            <option value="">-- selecione um curso --</option>
            {Array.isArray(cursos) && cursos.map(c => (<option key={c.id} value={c.id}>{c.nome}</option>))}
          </select>

          <label className={styles.label} style={{ marginTop: 12 }}>Nome da disciplina</label>
          <input className={styles.input} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Cálculo I" />
        </div>

        <div className={styles.actions}>
          <button className={styles.addButton} onClick={handleAdd} disabled={loading}>{loading ? 'Adicionando...' : 'Adicionar disciplina'}</button>
        </div>
      </div>
    </div>
  );
}
