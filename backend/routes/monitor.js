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

// Cria o cadastro do monitor
router.post("/", verificaToken, async (req, res) => {
  try {
    console.log(req.body)
    const { especialidade, experiencia, preco_hora } = req.body;
    const monitor = await prisma.monitor.create({
      data: {
        usuario_id: req.user.id,
        especialidade,
        experiencia,
        preco_hora: parseFloat(preco_hora),
      },
    });
    res.json(monitor);
  } catch (error) {
    console.error("Erro ao cadastrar monitor:", error);
    res.status(500).json({ error: "Erro ao cadastrar monitor" });
  }
});

export default router;
