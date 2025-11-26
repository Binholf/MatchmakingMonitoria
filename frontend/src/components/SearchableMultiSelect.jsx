import React, { useEffect, useRef, useState } from "react";
import styles from "./SearchableMultiSelect.module.css";

export default function SearchableMultiSelect({ options = [], value = [], onChange, placeholder = "Pesquisar..." }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const listRef = useRef(null);
  const itemsRef = useRef([]);
  const [typed, setTyped] = useState("");
  const typedTimeout = useRef(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    // reset typed when opening
    setTyped("");
    setActiveIndex(-1);
  }, [open]);

  useEffect(() => {
    return () => {
      if (typedTimeout.current) clearTimeout(typedTimeout.current);
    };
  }, []);

  const toggle = (id) => {
    const present = Array.isArray(value) && value.includes(id);
    if (!present) onChange([...(value || []), id]);
    else onChange((value || []).filter(v => v !== id));
  };

  const focusIndex = (idx) => {
    if (idx < 0 || idx >= options.length) return;
    setActiveIndex(idx);
    const el = itemsRef.current[idx];
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    const key = e.key;
    if (key === "ArrowDown") {
      e.preventDefault();
      const next = Math.min(options.length - 1, activeIndex + 1 < 0 ? 0 : activeIndex + 1);
      focusIndex(next);
      return;
    }
    if (key === "ArrowUp") {
      e.preventDefault();
      const prev = Math.max(0, activeIndex - 1);
      focusIndex(prev);
      return;
    }
    if (key === "Enter" || key === " ") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < options.length) toggle(options[activeIndex].id);
      return;
    }

    // Type-to-search: accumulate printable characters
    if (key.length === 1 && !e.ctrlKey && !e.metaKey) {
      const nextTyped = (typed + key).toLowerCase();
      setTyped(nextTyped);
      if (typedTimeout.current) clearTimeout(typedTimeout.current);
      typedTimeout.current = setTimeout(() => setTyped(""), 800);

      const idx = options.findIndex(o => (o.nome || "").toLowerCase().startsWith(nextTyped));
      if (idx !== -1) focusIndex(idx);
    }
  };

  return (
    <div className={styles.wrapper} ref={ref} tabIndex={0} onKeyDown={handleKeyDown}>
      <button type="button" className={styles.control} onClick={() => setOpen(s => !s)}>
        <span className={styles.label}>{(value && value.length) ? `${value.length} selecionada(s)` : "Selecionar disciplinas"}</span>
        <span className={styles.caret}>{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.list} ref={listRef}>
            {options.length === 0 ? (
              <div className={styles.empty}>Nenhuma disciplina disponível</div>
            ) : (
              options.map((opt, idx) => (
                <label
                  key={opt.id}
                  ref={el => itemsRef.current[idx] = el}
                  className={`${styles.item} ${idx === activeIndex ? styles.active : ""}`}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(-1)}
                >
                  <input
                    type="checkbox"
                    checked={Array.isArray(value) && value.includes(opt.id)}
                    onChange={() => toggle(opt.id)}
                  />
                  <span className={styles.itemLabel}>{opt.nome}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
