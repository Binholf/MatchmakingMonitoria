import React, { useState, useEffect, useRef } from 'react';
import styles from './FiltersModal.module.css';

// Filters available and human labels
const FILTERS = [
  { id: 'compatibilidade', label: 'Compatibilidade' },
  { id: 'menor_preco', label: 'Menor preço' },
  { id: 'mais_alunos_monitorados', label: 'Mais alunos monitorados' },
  { id: 'especialidade', label: 'Conteúdos específicos' },
];

export default function FiltersModal({ open, onClose, order, setOrder, onApply }) {
  const [localOrder, setLocalOrder] = useState(order || FILTERS.map(f => f.id));
  const dragIndex = useRef(null);

  useEffect(() => {
    setLocalOrder(order || FILTERS.map(f => f.id));
  }, [order, open]);

  if (!open) return null;

  const onDragStart = (e, idx) => {
    dragIndex.current = idx;
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e, idx) => {
    e.preventDefault();
    const from = dragIndex.current;
    const to = idx;
    if (from === null || from === undefined) return;
    const next = [...localOrder];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setLocalOrder(next);
    dragIndex.current = null;
  };

  const resetDefaults = () => setLocalOrder(FILTERS.map(f => f.id));

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <h3>Filtros</h3>
          <button className={styles.close} onClick={onClose}>×</button>
        </div>

        <p className={styles.help}>Arraste os filtros para montar a hierarquia (de cima = maior prioridade).</p>

        <ul className={styles.list}>
          {localOrder.map((id, idx) => {
            const info = FILTERS.find(f => f.id === id) || { id, label: id };
            return (
              <li
                key={id}
                className={styles.item}
                draggable
                onDragStart={(e) => onDragStart(e, idx)}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, idx)}
              >
                <span className={styles.handle}>☰</span>
                <span className={styles.label}>{info.label}</span>
              </li>
            );
          })}
        </ul>

        <div className={styles.actions}>
          <button className={styles.btn} onClick={() => { setOrder(localOrder); onApply(localOrder); onClose(); }}>Aplicar</button>
          <button className={styles.btnSecondary} onClick={resetDefaults}>Redefinir</button>
        </div>
      </div>
    </div>
  );
}
