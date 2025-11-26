import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

/**
 * Retorna uma lista de monitores compatíveis com o aluno
 * Critério básico: disciplinas em comum
 */
router.get("/:alunoId", async (req, res) => {
  const alunoId = parseInt(req.params.alunoId);

  try {
    // 1️⃣ Verifica se o aluno existe
    const aluno = await prisma.aluno.findUnique({
      where: { id: alunoId },
      include: {
        disciplinas: {
          include: { disciplina: true },
        },
      },
    });

    if (!aluno) {
      return res.status(404).json({ error: "Aluno não encontrado" });
    }

    // 2️⃣ Extrai as disciplinas que o aluno estuda
    const alunoDisciplinasIds = aluno.disciplinas.map(
      (ad) => ad.disciplina_id
    );

    if (alunoDisciplinasIds.length === 0) {
      return res
        .status(400)
        .json({ error: "Aluno não possui disciplinas cadastradas" });
    }

    // 3️⃣ Busca monitores que lecionam ao menos uma dessas disciplinas
    // incluir também os cursos vinculados para expor o nome do curso no frontend
    const monitores = await prisma.monitor.findMany({
      include: {
        disciplinas: {
          include: { disciplina: true },
        },
        user: true,
        cursos: {
          include: { curso: true },
        },
      },
    });

    // 4️⃣ Calcula compatibilidade simples e monta lista de disciplinas em comum
    const matches = monitores
      .map((monitor) => {
        const monitorDisciplinas = monitor.disciplinas || [];
        const monitorDisciplinasIds = monitorDisciplinas.map((md) => md.disciplina_id);

        // ids em comum
        const comunsIds = monitorDisciplinasIds.filter((id) => alunoDisciplinasIds.includes(id));

        // nomes das disciplinas em comum (quando disponíveis)
        const disciplinasEmComumNomes = monitorDisciplinas
          .filter((md) => comunsIds.includes(md.disciplina_id))
          .map((md) => (md.disciplina && md.disciplina.nome ? md.disciplina.nome : null))
          .filter(Boolean);

        const compatNumeric = (comunsIds.length / alunoDisciplinasIds.length) * 100;

        // tentar extrair o nome do curso principal do monitor (formato defensivo)
        const cursoNome = (Array.isArray(monitor.cursos) && monitor.cursos.length)
          ? (monitor.cursos[0].curso?.nome || monitor.cursos[0].curso_nome || monitor.cursos[0].nome)
          : (monitor.curso?.nome || null);

        return {
          monitor_id: monitor.id,
          monitor_nome: monitor.user.name,
          monitor_especialidade: monitor.especialidade || null,
          monitor_alunos_monitorados: monitor.experiencia ? parseInt(monitor.experiencia) : null,
          monitor_preco_hora: typeof monitor.preco_hora !== 'undefined' && monitor.preco_hora !== null ? monitor.preco_hora : null,
          disciplinas_em_comum: disciplinasEmComumNomes,
          disciplinas_em_comum_count: comunsIds.length,
          compatibilidade: compatNumeric.toFixed(2) + "%",
          compatibilidade_val: compatNumeric,
          monitor_curso_nome: cursoNome || null,
        };
      })
      .filter((m) => (Array.isArray(m.disciplinas_em_comum) ? m.disciplinas_em_comum.length > 0 : (m.disciplinas_em_comum_count || 0) > 0))
      .sort((a, b) => b.compatibilidade_val - a.compatibilidade_val);

    res.json(matches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
