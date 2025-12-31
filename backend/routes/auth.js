// src/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import verificaToken from "../middlewares/verifyToken.js";

const router = express.Router();
const prisma = new PrismaClient();

// ✅ Registro de usuário
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

// ✅ Login de usuário
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

// ✅ Verifica se o token JWT ainda é válido
router.get("/check", verificaToken, async (req, res) => {
  try {
    // Busca o usuário logado com base no token
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ autenticado: false, error: "Usuário não encontrado" });
    }

    // Tudo certo — usuário autenticado
    return res.json({ autenticado: true, user });
  } catch (error) {
    console.error("Erro ao verificar autenticação:", error);
    return res.status(500).json({ autenticado: false, error: "Erro ao verificar autenticação" });
  }
});


export default router;
