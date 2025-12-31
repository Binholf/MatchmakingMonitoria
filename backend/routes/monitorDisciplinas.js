import express from "express";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();
const router = express.Router();

// Associar disciplinas a um monitor
router.post("/:id/disciplinas", async (req, res) => {
  const monitor_id = parseInt(req.params.id);
  const { disciplina_ids } = req.body; // espera um array de ids

  if (!disciplina_ids || !Array.isArray(disciplina_ids) || disciplina_ids.length === 0) {
    return res.status(400).json({ error: "disciplina_ids é obrigatório e deve ser um array" });
  }

  try {
    // Verifica se o monitor existe
    const monitor = await prisma.monitor.findUnique({ where: { id: monitor_id } });
    if (!monitor) {
      return res.status(404).json({ error: "Monitor não encontrado" });
    }

    // Valida se todas as disciplinas existem
    const disciplinasExistentes = await prisma.disciplina.findMany({
      where: { id: { in: disciplina_ids } },
    });
    if (disciplinasExistentes.length !== disciplina_ids.length) {
      return res.status(400).json({ error: "Alguma disciplina_id não existe" });
    }

    // Cria os vínculos
    const resultados = await Promise.all(
      disciplina_ids.map((disciplina_id) =>
        prisma.monitorDisciplina.create({
          data: { monitor_id, disciplina_id: parseInt(disciplina_id) },
        })
      )
    );

    res.json(resultados);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
