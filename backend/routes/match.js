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
    const monitores = await prisma.monitor.findMany({
      include: {
        disciplinas: {
          include: { disciplina: true },
        },
        user: true,
      },
    });

    // 4️⃣ Calcula compatibilidade simples
    const matches = monitores
      .map((monitor) => {
        const monitorDisciplinasIds = monitor.disciplinas.map(
          (md) => md.disciplina_id
        );

        const disciplinasEmComum = monitorDisciplinasIds.filter((id) =>
          alunoDisciplinasIds.includes(id)
        );

        const compatibilidade =
          (disciplinasEmComum.length / alunoDisciplinasIds.length) * 100;

        return {
          monitor_id: monitor.id,
          monitor_nome: monitor.user.name,
          disciplinas_em_comum: disciplinasEmComum.length,
          compatibilidade: compatibilidade.toFixed(2) + "%",
        };
      })
      .filter((m) => m.disciplinas_em_comum > 0)
      .sort((a, b) => b.compatibilidade - a.compatibilidade);

    res.json(matches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
