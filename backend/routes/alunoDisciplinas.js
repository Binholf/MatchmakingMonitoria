import express from "express";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();
const router = express.Router();

// Associar disciplinas a um aluno
router.post("/:id/disciplinas", async (req, res) => {
  const aluno_id = parseInt(req.params.id);
  const { disciplina_ids } = req.body; // espera um array de ids de disciplinas

  if (!disciplina_ids || !Array.isArray(disciplina_ids) || disciplina_ids.length === 0) {
    return res.status(400).json({ error: "disciplina_ids é obrigatório e deve ser um array" });
  }

  try {
    const promessas = disciplina_ids.map((disciplina_id) =>
      prisma.alunoDisciplina.create({
        data: { aluno_id, disciplina_id: parseInt(disciplina_id) },
      })
    );

    const resultados = await Promise.all(promessas);
    res.json(resultados);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
