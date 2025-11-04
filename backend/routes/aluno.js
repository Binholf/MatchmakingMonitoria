import express from "express";
import { PrismaClient } from "@prisma/client";
import verificaToken from "../middlewares/verifyToken.js";

const router = express.Router();
const prisma = new PrismaClient();

// Verifica se o usuário já tem cadastro como aluno
router.get("/check", verificaToken, async (req, res) => {
  try {
    const aluno = await prisma.aluno.findUnique({
      where: { usuario_id: req.user.id },
    });
    res.json({ temCadastro: !!aluno });
  } catch (error) {
    console.error("Erro ao verificar cadastro do aluno:", error);
    res.status(500).json({ error: "Erro ao verificar cadastro do aluno" });
  }
});

router.get("/me", verificaToken, async (req, res) => {
  try {
    const aluno = await prisma.aluno.findUnique({
      where: { usuario_id: req.user.id },
      include: { user: true }, // opcional: inclui dados da tabela de usuário
    });

    if (!aluno) return res.status(404).json({ error: "Aluno não encontrado" });

    res.json(aluno);
  } catch (err) {
    console.error("Erro ao buscar aluno:", err);
    res.status(500).json({ error: "Erro ao buscar aluno" });
  }
});

// Editar perfil do aluno
router.put("/me", verificaToken, async (req, res) => {
  try {
    const { name, area_interesse, descricao } = req.body;

    // Atualiza dados do usuário
    await prisma.user.update({
      where: { id: req.user.id },
      data: { name },
    });

    // Atualiza dados do aluno
    const aluno = await prisma.aluno.update({
      where: { usuario_id: req.user.id },
      data: { area_interesse, descricao },
    });

    res.json(aluno);
  } catch (err) {
    console.error("Erro ao atualizar aluno:", err);
    res.status(500).json({ error: "Erro ao atualizar aluno" });
  }
});

router.delete("/me", verificaToken, async (req, res) => {
  try {
    // Deleta apenas o registro do Aluno
    await prisma.aluno.delete({
      where: { usuario_id: req.user.id },
    });
    res.json({ message: "Perfil de aluno excluído com sucesso!" });
  } catch (error) {
    console.error("Erro ao excluir aluno:", error);
    res.status(500).json({ error: "Erro ao excluir aluno" });
  }
});

// Cria o cadastro do aluno
router.post("/", verificaToken, async (req, res) => {
  try {
    const { area_interesse, descricao, curso_id, disciplinas } = req.body;

    // Verifica se já existe aluno vinculado
    const jaExiste = await prisma.aluno.findUnique({
      where: { usuario_id: req.user.id },
    });
    if (jaExiste) {
      return res.status(400).json({ error: "Aluno já cadastrado." });
    }

    // Cria o aluno com relações
    const aluno = await prisma.aluno.create({
      data: {
        usuario_id: req.user.id,
        area_interesse,
        descricao,
        cursos: {
          connect: { id: Number(curso_id) },
        },
        disciplinas: {
          connect: disciplinas.map((id) => ({ id: Number(id) })),
        },
      },
      include: {
        user: true,
        cursos: true,
        disciplinas: true,
      },
    });

    res.json(aluno);
  } catch (error) {
    console.error("Erro ao cadastrar aluno:", error);
    res.status(500).json({ error: "Erro ao cadastrar aluno" });
  }
});

router.get("/usuario/:usuarioId", async (req, res) => {
  const usuarioId = parseInt(req.params.usuarioId);

  try {
    const aluno = await prisma.aluno.findUnique({
      where: { usuario_id: usuarioId },
    });

    if (!aluno) {
      return res.status(404).json({ error: "Aluno não encontrado" });
    }

    res.json(aluno);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
