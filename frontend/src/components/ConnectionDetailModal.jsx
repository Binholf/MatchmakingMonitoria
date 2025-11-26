import React from 'react';
import styles from './ConnectionDetailModal.module.css';

export default function ConnectionDetailModal({ open, onClose, request, onTerminate, otherRole = 'monitor', currentAluno = null, currentMonitor = null }) {
  if (!open || !request) return null;

  // decide which side is "other" relative to the viewer
  const other = otherRole === 'monitor' ? (request.monitor || {}) : (request.aluno || {});
  const user = other.user || {};
  // determine disciplina lists: prefer explicit relations on request, fall back to currentAluno/currentMonitor passed from page
  const alunoDiscs = (request.aluno && request.aluno.disciplinas) || (currentAluno && currentAluno.disciplinas) || [];
  const monitorDiscs = (request.monitor && request.monitor.disciplinas) || (currentMonitor && currentMonitor.disciplinas) || [];

  // compute common disciplines by id (more reliable)
  const extractId = (d) => d && (d.disciplina?.id || d.disciplina_id || d.disciplina?.disciplina_id || d.id || null);
  const extractLabel = (d) => {
    if (!d) return null;
    if (d.disciplina && (d.disciplina.nome || d.disciplina.name)) return d.disciplina.nome || d.disciplina.name;
    if (d.nome) return d.nome;
    if (typeof d === 'string') return d;
    return null;
  };

  const alunoIds = alunoDiscs.map(extractId).filter(Boolean);
  const monitorIds = monitorDiscs.map(extractId).filter(Boolean);
  const commonIds = alunoIds.filter(id => monitorIds.includes(id));
  const common = commonIds.map(id => {
    // try to find a label from aluno then monitor
    const fromAluno = alunoDiscs.find(d => extractId(d) === id);
    const fromMonitor = monitorDiscs.find(d => extractId(d) === id);
    return extractLabel(fromAluno) || extractLabel(fromMonitor) || String(id);
  });

  

  // theme colors: monitor -> blue, aluno -> purple (inverted from previous)
  const themeColor = otherRole === 'monitor' ? '#3498db' : '#4b0082';
  const themeBg = otherRole === 'monitor' ? 'rgba(52,152,219,0.08)' : 'rgba(75,0,130,0.08)';

  const handleTerminate = () => {
    const ok = window.confirm('Tem certeza que deseja terminar esta conexão?');
    if (!ok) return;
    if (onTerminate) onTerminate(request.id);
  };

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <div>
            <h3 className={styles.name} style={{ color: themeColor }}>{user.name || (other.nome || 'Usuário')}</h3>
          </div>
          <button className={styles.close} onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <div className={styles.content}>
          {/* Perfil: nome (header), curso, conteúdos específicos, disciplinas */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Perfil</div>
            <div className={styles.row}><strong>Curso:</strong> <span className={styles.value}>{ (other.cursos && other.cursos.length && (other.cursos[0].curso?.nome || other.cursos[0].curso_nome)) || other.curso_nome || other.curso || '-' }</span></div>
            {/* show disciplines in common first */}
            <div className={styles.row}><strong>Disciplinas em comum:</strong>
              <div className={styles.discList}>
                {common.length === 0 ? <span className={styles.value}>-</span> : common.map((label, i) => (
                  <div key={`${label}-${i}`} className={styles.discItem} style={{ background: themeBg, color: themeColor }}>{label}</div>
                ))}
              </div>
            </div>
            { (other.especialidade || other.area_interesse) && <div className={styles.row}><strong>Conteúdos específicos:</strong> <span className={styles.value}>{other.especialidade || other.area_interesse}</span></div> }
          </div>

          <div className={styles.divider} />

          {/* Detalhes: preço, alunos monitorados, compatibilidade, descrição, timestamps */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Detalhes</div>
            { otherRole === 'monitor' ? (
              <>
                <div className={styles.row}><strong>Preço/H:</strong> <span className={styles.value}>{other.preco_hora != null ? `R$ ${other.preco_hora}` : (other.monitor_preco_hora != null ? `R$ ${other.monitor_preco_hora}` : '-')}</span></div>
                <div className={styles.row}><strong>Alunos monitorados:</strong> <span className={styles.value}>{other.alunos_monitorados != null ? other.alunos_monitorados : (other.monitor_alunos_monitorados != null ? other.monitor_alunos_monitorados : (other.experiencia != null ? other.experiencia : '-'))}</span></div>
                <div className={styles.row}><strong>Compatibilidade:</strong> <span className={styles.value}>{request.compatibilidade != null ? request.compatibilidade : other.compatibilidade != null ? other.compatibilidade : '-'}</span></div>
                <div className={styles.row}><strong>Descrição:</strong> <span className={styles.value}>{other.descricao || '-'}</span></div>
                {user.email && <div className={styles.row}><strong>Contato:</strong> <span className={styles.value}>{user.email}</span></div>}
              </>
            ) : (
              <>
                <div className={styles.row}><strong>Descrição:</strong> <span className={styles.value}>{other.descricao || other.area_interesse || '-'}</span></div>
                <div className={styles.row}><strong>Solicitação criada em:</strong> <span className={styles.value}>{new Date(request.createdAt).toLocaleString()}</span></div>
                <div className={styles.row}><strong>Status:</strong> <span className={styles.value}>{request.status}</span></div>
                {user.email && <div className={styles.row}><strong>Contato:</strong> <span className={styles.value}>{user.email}</span></div>}
              </>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.btnSecondary} onClick={onClose}>Fechar</button>
          <button className={styles.btnDanger} onClick={handleTerminate}>Terminar conexão</button>
        </div>
      </div>
    </div>
  );
}
