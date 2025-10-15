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

// Cria o cadastro do aluno
router.post("/", verificaToken, async (req, res) => {
  try {
    const { area_interesse, descricao } = req.body;
    const aluno = await prisma.aluno.create({
      data: {
        usuario_id: req.user.id,
        area_interesse,
        descricao,
      },
    });
    res.json(aluno);
  } catch (error) {
    console.error("Erro ao cadastrar aluno:", error);
    res.status(500).json({ error: "Erro ao cadastrar aluno" });
  }
});

export default router;
