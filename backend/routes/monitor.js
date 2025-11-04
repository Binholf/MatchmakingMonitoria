import express from "express";
import { PrismaClient } from "@prisma/client";
import verificaToken from "../middlewares/verifyToken.js";

const router = express.Router();
const prisma = new PrismaClient();

// Verifica se o usuário já tem cadastro como monitor
router.get("/check", verificaToken, async (req, res) => {
  try {
    const monitor = await prisma.monitor.findUnique({
      where: { usuario_id: req.user.id },
    });
    res.json({ temCadastro: !!monitor });
  } catch (error) {
    console.error("Erro ao verificar cadastro do monitor:", error);
    res.status(500).json({ error: "Erro ao verificar cadastro do monitor" });
  }
});

// Retorna dados do monitor
router.get("/me", verificaToken, async (req, res) => {
  try {
    const monitor = await prisma.monitor.findUnique({
      where: { usuario_id: req.user.id },
      include: {
        user: true,
        cursos: { include: { curso: true } }, // inclui dados do curso
        disciplinas: true,
      },
    });

    if (!monitor) return res.status(404).json({ error: "Monitor não encontrado" });

    res.json(monitor);
  } catch (err) {
    console.error("Erro ao buscar monitor:", err);
    res.status(500).json({ error: "Erro ao buscar monitor" });
  }
});

// Atualiza perfil do monitor
router.put("/me", verificaToken, async (req, res) => {
  try {
    const { especialidade, experiencia, preco_hora, curso_id, disciplinas } = req.body;

    const monitorExistente = await prisma.monitor.findUnique({
      where: { usuario_id: req.user.id },
    });

    if (!monitorExistente) {
      return res.status(404).json({ error: "Perfil de monitor não encontrado" });
    }

    const monitorAtualizado = await prisma.monitor.update({
      where: { usuario_id: req.user.id },
      data: {
        especialidade,
        experiencia,
        preco_hora: parseFloat(preco_hora),
        // Remove cursos antigos e adiciona o novo
        cursos: {
          deleteMany: {},
          create: [{ curso_id: Number(curso_id) }],
        },
        disciplinas: {
          set: disciplinas.map((id) => ({ id: Number(id) })), // substitui disciplinas
        },
      },
      include: {
        user: true,
        cursos: { include: { curso: true } },
        disciplinas: true,
      },
    });

    res.json(monitorAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar monitor:", error);
    res.status(500).json({ error: "Erro ao atualizar monitor" });
  }
});

// Deleta monitor
router.delete("/me", verificaToken, async (req, res) => {
  try {
    await prisma.monitor.delete({
      where: { usuario_id: req.user.id },
    });
    res.json({ message: "Perfil de monitor excluído com sucesso!" });
  } catch (error) {
    console.error("Erro ao excluir monitor:", error);
    res.status(500).json({ error: "Erro ao excluir monitor" });
  }
});

// Cria cadastro de monitor com curso e disciplinas
router.post("/", verificaToken, async (req, res) => {
  try {
    const { especialidade, experiencia, preco_hora, curso_id, disciplinas } = req.body;

    // Verifica se já existe monitor vinculado
    const jaExiste = await prisma.monitor.findUnique({
      where: { usuario_id: req.user.id },
    });
    if (jaExiste) {
      return res.status(400).json({ error: "Monitor já cadastrado." });
    }

    // Cria monitor com curso e disciplinas
    const monitor = await prisma.monitor.create({
      data: {
        usuario_id: req.user.id,
        especialidade,
        experiencia,
        preco_hora: parseFloat(preco_hora),
        cursos: {
          create: [{ curso_id: Number(curso_id) }],
        },
        disciplinas: {
          connect: disciplinas.map((id) => ({ id: Number(id) })),
        },
      },
      include: {
        user: true,
        cursos: { include: { curso: true } },
        disciplinas: true,
      },
    });

    res.json(monitor);
  } catch (error) {
    console.error("Erro ao cadastrar monitor:", error);
    res.status(500).json({ error: "Erro ao cadastrar monitor" });
  }
});

export default router;
