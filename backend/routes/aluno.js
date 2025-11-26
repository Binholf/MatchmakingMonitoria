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
      include: { user: true, cursos: { include: { curso: true } }, disciplinas: { include: { disciplina: true } } }, // inclui relações
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
    const { name, area_interesse, descricao, curso_id, disciplinas } = req.body;

    const alunoExistente = await prisma.aluno.findUnique({ where: { usuario_id: req.user.id } });
    if (!alunoExistente) return res.status(404).json({ error: "Aluno não encontrado" });

    // Atualiza nome do usuário se fornecido
    if (typeof name === "string") {
      await prisma.user.update({ where: { id: req.user.id }, data: { name } });
    }

    // Atualiza campos do aluno
    const updateData = {};
    if (typeof area_interesse !== "undefined") updateData.area_interesse = area_interesse;
    if (typeof descricao !== "undefined") updateData.descricao = descricao;

    if (Object.keys(updateData).length > 0) {
      await prisma.aluno.update({ where: { usuario_id: req.user.id }, data: updateData });
    }

    // Gerencia curso
    if (typeof curso_id !== "undefined") {
      // remove links antigos e cria novo se informado
      await prisma.alunoCurso.deleteMany({ where: { aluno_id: alunoExistente.id } });
      if (curso_id !== null && curso_id !== "") {
        await prisma.alunoCurso.create({ data: { aluno_id: alunoExistente.id, curso_id: Number(curso_id) } });
      }
    }

    // Gerencia disciplinas
    if (Array.isArray(disciplinas)) {
      await prisma.alunoDisciplina.deleteMany({ where: { aluno_id: alunoExistente.id } });
      if (disciplinas.length > 0) {
        const payload = disciplinas.map((id) => ({ aluno_id: alunoExistente.id, disciplina_id: Number(id) }));
        await prisma.alunoDisciplina.createMany({ data: payload });
      }
    }

    // Retorna aluno atualizado com relações
    const alunoAtualizado = await prisma.aluno.findUnique({ where: { id: alunoExistente.id }, include: { user: true, cursos: { include: { curso: true } }, disciplinas: { include: { disciplina: true } } } });
    res.json(alunoAtualizado);
  } catch (err) {
    console.error("Erro ao atualizar aluno:", err);
    res.status(500).json({ error: "Erro ao atualizar aluno" });
  }
});

router.delete("/me", verificaToken, async (req, res) => {
  try {
    // Primeiro encontra o aluno para obter o id e remover relações
    const aluno = await prisma.aluno.findUnique({ where: { usuario_id: req.user.id } });
    if (!aluno) return res.status(404).json({ error: "Aluno não encontrado" });

    // Deleta relações nas tabelas join para evitar violação de FK
    await prisma.alunoDisciplina.deleteMany({ where: { aluno_id: aluno.id } });
    await prisma.alunoCurso.deleteMany({ where: { aluno_id: aluno.id } });

    // Agora deleta o registro do aluno
    await prisma.aluno.delete({ where: { id: aluno.id } });
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

    // Cria o aluno (registro base)
    const aluno = await prisma.aluno.create({
      data: {
        usuario_id: req.user.id,
        area_interesse,
        descricao,
      },
      include: { user: true },
    });

    // Cria relação com curso na tabela de junção, se informado
    if (curso_id) {
      await prisma.alunoCurso.create({
        data: { aluno_id: aluno.id, curso_id: Number(curso_id) },
      });
    }

    // Cria relações de disciplinas na tabela de junção
    if (Array.isArray(disciplinas) && disciplinas.length > 0) {
      const payload = disciplinas.map((id) => ({ aluno_id: aluno.id, disciplina_id: Number(id) }));
      await prisma.alunoDisciplina.createMany({ data: payload });
    }

    // Retorna o aluno com relacionamentos carregados
    const alunoFinal = await prisma.aluno.findUnique({
      where: { id: aluno.id },
      include: { user: true, cursos: { include: { curso: true } }, disciplinas: true },
    });

    res.json(alunoFinal);
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
