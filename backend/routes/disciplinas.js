import express from "express";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();
const router = express.Router();

// Listar disciplinas
router.get("/", async (req, res) => {
  const { curso_id } = req.query;

  try {
    let disciplinas;

    if (curso_id) {
      const cursoIdNum = parseInt(curso_id);
      if (isNaN(cursoIdNum)) {
        return res.status(400).json({ success: false, error: "curso_id inválido" });
      }
      disciplinas = await prisma.disciplina.findMany({
        where: { curso_id: cursoIdNum },
      });
    } else {
      disciplinas = await prisma.disciplina.findMany();
    }

    res.json({ success: true, disciplinas });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Criar nova disciplina
router.post("/", async (req, res) => {
  const { nome, descricao, curso_id } = req.body;

  if (!nome || !curso_id) {
    return res.status(400).json({ success: false, error: "Nome e curso_id são obrigatórios" });
  }

  const cursoIdNum = parseInt(curso_id);
  if (isNaN(cursoIdNum)) {
    return res.status(400).json({ success: false, error: "curso_id inválido" });
  }

  try {
    const disciplina = await prisma.disciplina.create({
      data: {
        nome,
        descricao: descricao || "",
        curso_id: cursoIdNum,
      },
    });
    res.json({ success: true, disciplina });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;