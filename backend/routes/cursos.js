import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// Listar todos os cursos
router.get("/", async (req, res) => {
  try {
    const cursos = await prisma.curso.findMany();
    res.json(cursos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar novo curso
router.post("/", async (req, res) => {
  const { nome, descricao } = req.body;

  if (!nome) return res.status(400).json({ error: "O nome do curso é obrigatório" });

  try {
    const curso = await prisma.curso.create({
      data: { nome, descricao },
    });
    res.json(curso);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;