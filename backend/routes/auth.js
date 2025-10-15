// src/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import verificaToken from "../middlewares/verifyToken.js";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // Verifica se o e-mail já existe
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ error: "E-mail já registrado" });
    }

    // Criptografa a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cria usuário
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    return res.json({
      message: "Usuário registrado com sucesso!",
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Erro no registro:", error);
    return res.status(500).json({ error: "Erro interno ao registrar usuário" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Verifica se usuário existe
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Usuário não encontrado" });

    // Compara senha
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Senha incorreta" });

    // Gera token JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.json({
      message: "Login realizado com sucesso!",
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ error: "Erro interno ao realizar login" });
  }
});

// Rota protegida /me (verifica token e retorna dados do usuário)
router.get("/me", verificaToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true },
    });

    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    return res.json(user);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return res.status(500).json({ error: "Erro interno ao buscar usuário" });
  }
});

// Rota para retornar dados do aluno logado
router.get("/aluno/me", async (req, res) => {
  try {
    const userId = req.user.id; 
    const aluno = await db.aluno.findUnique({ where: { userId } });
    if (!aluno) return res.status(404).json({ error: "Aluno não encontrado" });
    res.json(aluno);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar aluno" });
  }
});

// Rota para retornar dados do monitor logado
router.get("/monitor/me", async (req, res) => {
  try {
    const userId = req.user.id; 
    const monitor = await db.monitor.findUnique({ where: { userId } });
    if (!monitor) return res.status(404).json({ error: "Monitor não encontrado" });
    res.json(monitor);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar monitor" });
  }
});

export default router;
