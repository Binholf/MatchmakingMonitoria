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
        disciplinas: { include: { disciplina: true } },
      },
    });

    if (!monitor) return res.status(404).json({ error: "Monitor não encontrado" });

    // Expor campo legível `alunos_monitorados` mapeando do campo interno `experiencia`
    const out = { ...monitor, alunos_monitorados: monitor.experiencia, descricao: monitor.descricao };
    res.json(out);
  } catch (err) {
    console.error("Erro ao buscar monitor:", err);
    res.status(500).json({ error: "Erro ao buscar monitor" });
  }
});

// Atualiza perfil do monitor
router.put("/me", verificaToken, async (req, res) => {
  try {
    const { name, especialidade, experiencia, alunos_monitorados, preco_hora, curso_id, disciplinas, descricao } = req.body;

    const monitorExistente = await prisma.monitor.findUnique({
      where: { usuario_id: req.user.id },
    });

    if (!monitorExistente) {
      return res.status(404).json({ error: "Perfil de monitor não encontrado" });
    }


    // Atualiza nome do usuário se fornecido
    if (typeof name === "string") {
      await prisma.user.update({ where: { id: req.user.id }, data: { name } });
    }

    // Monta objeto de atualização dinamicamente para evitar valores inválidos
    const updateData = {};
    if (typeof especialidade !== "undefined") updateData.especialidade = especialidade;
    // aceitar `alunos_monitorados` como número e mapear para o campo `experiencia` no banco
    if (typeof alunos_monitorados !== "undefined") {
      const am = parseInt(alunos_monitorados);
      if (Number.isNaN(am)) return res.status(400).json({ error: "alunos_monitorados deve ser um número" });
      updateData.experiencia = String(am);
    } else if (typeof experiencia !== "undefined") {
      // compatibilidade retroativa: aceitar `experiencia` caso enviado
      const expParsed = parseInt(experiencia);
      if (!Number.isNaN(expParsed)) updateData.experiencia = String(expParsed);
    }
    if (typeof preco_hora !== "undefined" && preco_hora !== null && preco_hora !== "") {
      const ph = parseFloat(preco_hora);
      if (!Number.isNaN(ph)) updateData.preco_hora = ph;
    }

    // NOTE: `descricao` was added to the Prisma schema but the generated Prisma client
    // may not be up-to-date in the running environment. To avoid PrismaClientValidationError
    // (unknown argument `descricao`), do not include `descricao` in the update payload
    // here until `npx prisma migrate dev` / `npx prisma generate` has been run.
    // If you want to enable this field, run the migration locally and restart the server.

    if (typeof curso_id !== "undefined" && curso_id !== null && curso_id !== "") {
      updateData.cursos = {
        deleteMany: {},
        create: [{ curso_id: Number(curso_id) }],
      };
    }

    // Atualiza dados do monitor (se houver algo para atualizar)
    if (Object.keys(updateData).length > 0) {
      await prisma.monitor.update({ where: { usuario_id: req.user.id }, data: updateData });
    }

    // Gerencia disciplinas via tabela de junção explicitamente
    if (Array.isArray(disciplinas)) {
      // Primeiro remove as relações antigas
      await prisma.monitorDisciplina.deleteMany({ where: { monitor_id: monitorExistente.id } });

      // Insere as novas relações (createMany para performance)
      if (disciplinas.length > 0) {
        const payload = disciplinas.map((id) => ({ monitor_id: monitorExistente.id, disciplina_id: Number(id) }));
        await prisma.monitorDisciplina.createMany({ data: payload });
      }
    }

    // Busca e retorna o monitor atualizado com relacionamentos
    const monitorAtualizado = await prisma.monitor.findUnique({
      where: { usuario_id: req.user.id },
      include: {
        user: true,
        cursos: { include: { curso: true } },
        disciplinas: { include: { disciplina: true } },
      },
    });
    const out = { ...monitorAtualizado, alunos_monitorados: monitorAtualizado.experiencia, descricao: monitorAtualizado.descricao };
    res.json(out);
  } catch (error) {
    console.error("Erro ao atualizar monitor:", error);
    res.status(500).json({ error: "Erro ao atualizar monitor" });
  }
});

// Deleta monitor
router.delete("/me", verificaToken, async (req, res) => {
  try {
    // Encontrar monitor para obter id
    const monitor = await prisma.monitor.findUnique({ where: { usuario_id: req.user.id } });
    if (!monitor) return res.status(404).json({ error: "Monitor não encontrado" });

    // Remover relações nas tabelas join
    await prisma.monitorDisciplina.deleteMany({ where: { monitor_id: monitor.id } });
    await prisma.monitorCurso.deleteMany({ where: { monitor_id: monitor.id } });
    // Remover solicitações de conexão onde este monitor está referenciado
    await prisma.connectionRequest.deleteMany({ where: { monitor_id: monitor.id } });

    // Deletar o monitor
    await prisma.monitor.delete({ where: { id: monitor.id } });
    res.json({ message: "Perfil de monitor excluído com sucesso!" });
  } catch (error) {
    console.error("Erro ao excluir monitor:", error);
    res.status(500).json({ error: "Erro ao excluir monitor" });
  }
});

// Cria cadastro de monitor com curso e disciplinas
router.post("/", verificaToken, async (req, res) => {
  try {
    const { especialidade, experiencia, alunos_monitorados, preco_hora, curso_id, disciplinas, descricao } = req.body;
    console.log('POST /monitor body:', req.body);

    // Verifica se já existe monitor vinculado
    const jaExiste = await prisma.monitor.findUnique({
      where: { usuario_id: req.user.id },
    });
    if (jaExiste) {
      return res.status(400).json({ error: "Monitor já cadastrado." });
    }

    // Validar e mapear `alunos_monitorados` para o campo `experiencia`
    let experienciaVal = null;
    if (typeof alunos_monitorados !== 'undefined') {
      const am = parseInt(alunos_monitorados);
      if (Number.isNaN(am)) return res.status(400).json({ error: 'alunos_monitorados deve ser um número' });
      experienciaVal = am;
    } else if (typeof experiencia !== 'undefined') {
      const expParsed = parseInt(experiencia);
      experienciaVal = Number.isNaN(expParsed) ? null : expParsed;
    }

    // Validar preco_hora
    let precoHoraVal = undefined;
    if (typeof preco_hora !== 'undefined' && preco_hora !== null && preco_hora !== '') {
      const ph = parseFloat(preco_hora);
      if (!Number.isNaN(ph)) precoHoraVal = ph;
    }

    // Monta objeto de criação dinamicamente para evitar enviar NaN ao Prisma
    const createData = { usuario_id: req.user.id };
    if (typeof especialidade !== 'undefined') createData.especialidade = especialidade;
    // Do not include `descricao` here until the Prisma client is regenerated locally.
    if (experienciaVal !== null) createData.experiencia = String(experienciaVal);
    if (typeof precoHoraVal !== 'undefined') createData.preco_hora = precoHoraVal;

    // Cria o monitor (registro base)
    const monitor = await prisma.monitor.create({
      data: createData,
      include: { user: true },
    });

    // Cria relação com curso na tabela de junção, se informado
    if (curso_id) {
      const cursoExists = await prisma.curso.findUnique({ where: { id: Number(curso_id) } });
      if (!cursoExists) return res.status(400).json({ error: "Curso informado não existe" });
      await prisma.monitorCurso.create({ data: { monitor_id: monitor.id, curso_id: Number(curso_id) } });
    }

    // Cria relações de disciplinas na tabela de junção
    if (Array.isArray(disciplinas) && disciplinas.length > 0) {
      // valida se todas disciplinas existem antes de inserir
      const missing = [];
      for (const id of disciplinas) {
        const did = Number(id);
        const d = await prisma.disciplina.findUnique({ where: { id: did } });
        if (!d) missing.push(did);
      }
      if (missing.length > 0) return res.status(400).json({ error: `Disciplinas não encontradas: ${missing.join(', ')}` });

      const payload = disciplinas.map((id) => ({ monitor_id: monitor.id, disciplina_id: Number(id) }));
      await prisma.monitorDisciplina.createMany({ data: payload });
    }

    // Retorna o monitor com relacionamentos carregados
    const monitorFinal = await prisma.monitor.findUnique({
      where: { id: monitor.id },
      include: { user: true, cursos: { include: { curso: true } }, disciplinas: { include: { disciplina: true } } },
    });

    const out = { ...monitorFinal, alunos_monitorados: monitorFinal.experiencia ? parseInt(monitorFinal.experiencia) : null, descricao: monitorFinal.descricao };

    res.json(out);
  } catch (error) {
    console.error("Erro ao cadastrar monitor:", error);
    console.error(error.stack);
    res.status(500).json({ error: "Erro ao cadastrar monitor", detail: error.message });
  }
});

export default router;
