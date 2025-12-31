import express from "express";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import verificaToken from "../middlewares/verifyToken.js";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const router = express.Router();

function extractDiscNames(list) {
  if (!Array.isArray(list)) return [];
  return list.map(d => {
    if (!d) return null;
    if (d.disciplina && d.disciplina.nome) return d.disciplina.nome;
    if (d.disciplina && d.disciplina.name) return d.disciplina.name;
    if (d.nome) return d.nome;
    return null;
  }).filter(Boolean);
}

function computeCompat(alunoDiscs, monitorDiscs) {
  const a = extractDiscNames(alunoDiscs || []);
  const b = extractDiscNames(monitorDiscs || []);
  if (a.length === 0 && b.length === 0) return null;
  const setA = new Set(a.map(s => s.toLowerCase()));
  const common = b.filter(x => setA.has((x || '').toLowerCase()));
  const denom = Math.max(a.length, b.length) || 1;
  const compatNumeric = (common.length / denom) * 100;
  return compatNumeric.toFixed(2) + "%";
}

// Criar solicitação de conexão (aluno autenticado)
router.post("/", verificaToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { monitor_id } = req.body;
    if (!monitor_id) return res.status(400).json({ error: "monitor_id é obrigatório" });

    const aluno = await prisma.aluno.findUnique({ where: { usuario_id: userId } });
    if (!aluno) return res.status(403).json({ error: "Usuário não é um aluno" });

    const monitor = await prisma.monitor.findUnique({ where: { id: Number(monitor_id) } });
    if (!monitor) return res.status(404).json({ error: "Monitor não encontrado" });

    const existing = await prisma.connectionRequest.findFirst({ where: { aluno_id: aluno.id, monitor_id: monitor.id } });
    if (existing) return res.status(409).json({ error: "Solicitação já existe", request: existing });

    const created = await prisma.connectionRequest.create({
      data: { aluno_id: aluno.id, monitor_id: monitor.id, status: "PENDING" },
      include: {
        aluno: { include: { user: true, cursos: { include: { curso: true } }, disciplinas: { include: { disciplina: true } } } },
        monitor: { include: { user: true, cursos: { include: { curso: true } }, disciplinas: { include: { disciplina: true } } } }
      }
    });
    // attach compatibilidade and normalized monitor_alunos_monitorados
    const out = { ...created };
    out.compatibilidade = computeCompat(created.aluno?.disciplinas, created.monitor?.disciplinas);
    if (created.monitor) out.monitor_alunos_monitorados = created.monitor.experiencia ? parseInt(created.monitor.experiencia) : null;
    res.status(201).json({ request: out });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') return res.status(409).json({ error: 'Unique constraint', detail: err.meta });
    res.status(500).json({ error: err.message });
  }
});

// Listar solicitações recebidas para o monitor autenticado
router.get("/monitor", verificaToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const monitor = await prisma.monitor.findUnique({ where: { usuario_id: userId } });
    if (!monitor) return res.status(403).json({ error: "Usuário não é um monitor" });

    const rows = await prisma.connectionRequest.findMany({
      where: { monitor_id: monitor.id },
      include: {
        aluno: { include: { user: true, cursos: { include: { curso: true } }, disciplinas: { include: { disciplina: true } } } },
        monitor: { include: { user: true, cursos: { include: { curso: true } }, disciplinas: { include: { disciplina: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    // annotate compatibilidade and monitor_alunos_monitorados
    const out = rows.map(r => ({
      ...r,
      compatibilidade: computeCompat(r.aluno?.disciplinas, r.monitor?.disciplinas),
      monitor_alunos_monitorados: r.monitor ? (r.monitor.experiencia ? parseInt(r.monitor.experiencia) : null) : null
    }));
    res.json({ requests: out });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Listar solicitações enviadas pelo aluno autenticado
router.get("/aluno", verificaToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const aluno = await prisma.aluno.findUnique({ where: { usuario_id: userId } });
    if (!aluno) return res.status(403).json({ error: "Usuário não é um aluno" });

    const rows = await prisma.connectionRequest.findMany({
      where: { aluno_id: aluno.id },
      include: {
        monitor: { include: { user: true, cursos: { include: { curso: true } }, disciplinas: { include: { disciplina: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    const out = rows.map(r => ({
      ...r,
      compatibilidade: computeCompat(r.aluno?.disciplinas, r.monitor?.disciplinas),
      monitor_alunos_monitorados: r.monitor ? (r.monitor.experiencia ? parseInt(r.monitor.experiencia) : null) : null
    }));
    res.json({ requests: out });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Atualizar status (aceitar/rejeitar) — monitor autenticado
router.patch('/:id', verificaToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['PENDING', 'ACCEPTED', 'REJECTED'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Status inválido' });

    const monitor = await prisma.monitor.findUnique({ where: { usuario_id: userId } });
    if (!monitor) return res.status(403).json({ error: 'Usuário não é um monitor' });

    const reqRecord = await prisma.connectionRequest.findUnique({ where: { id: Number(id) } });
    if (!reqRecord || reqRecord.monitor_id !== monitor.id) return res.status(404).json({ error: 'Solicitação não encontrada' });

    const updated = await prisma.connectionRequest.update({
      where: { id: Number(id) },
      data: { status },
      include: {
        aluno: { include: { user: true, cursos: { include: { curso: true } }, disciplinas: { include: { disciplina: true } } } },
        monitor: { include: { user: true, cursos: { include: { curso: true } }, disciplinas: { include: { disciplina: true } } } }
      }
    });
    const out = { ...updated };
    out.compatibilidade = computeCompat(updated.aluno?.disciplinas, updated.monitor?.disciplinas);
    if (updated.monitor) out.monitor_alunos_monitorados = updated.monitor.experiencia ? parseInt(updated.monitor.experiencia) : null;
    res.json({ request: out });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Dev-only route: executa um fluxo automático de testes de conexão
// Apenas disponível quando NODE_ENV === 'development'
router.post('/debug/run', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') return res.status(403).json({ error: 'Not allowed' });
  try {
    // Usuários de teste (e-mails fixos para idempotência)
    const alunoEmail = 'dev_aluno@example.com';
    const monitorEmail = 'dev_monitor@example.com';

    // Criar ou obter User para aluno
    let userAluno = await prisma.user.findUnique({ where: { email: alunoEmail } });
    if (!userAluno) {
      userAluno = await prisma.user.create({ data: { name: 'Dev Aluno', email: alunoEmail, password: 'devpass' } });
    }

    // Criar ou obter Aluno
    let aluno = await prisma.aluno.findUnique({ where: { usuario_id: userAluno.id } });
    if (!aluno) {
      aluno = await prisma.aluno.create({ data: { usuario_id: userAluno.id } });
    }

    // Criar ou obter User para monitor
    let userMonitor = await prisma.user.findUnique({ where: { email: monitorEmail } });
    if (!userMonitor) {
      userMonitor = await prisma.user.create({ data: { name: 'Dev Monitor', email: monitorEmail, password: 'devpass' } });
    }

    // Criar ou obter Monitor
    let monitor = await prisma.monitor.findUnique({ where: { usuario_id: userMonitor.id } });
    if (!monitor) {
      monitor = await prisma.monitor.create({ data: { usuario_id: userMonitor.id } });
    }

    // Gerar tokens JWT de teste
    const secret = process.env.JWT_SECRET || 'secret';
    const alunoToken = jwt.sign({ id: userAluno.id }, secret, { expiresIn: '7d' });
    const monitorToken = jwt.sign({ id: userMonitor.id }, secret, { expiresIn: '7d' });

    // Criar solicitação (ignorar duplicatas usando findFirst)
    let existing = await prisma.connectionRequest.findFirst({ where: { aluno_id: aluno.id, monitor_id: monitor.id } });
    if (!existing) {
      existing = await prisma.connectionRequest.create({ data: { aluno_id: aluno.id, monitor_id: monitor.id, status: 'PENDING' } });
    }

    // Listar solicitações do aluno e do monitor
    const alunoRequests = await prisma.connectionRequest.findMany({ where: { aluno_id: aluno.id }, include: { monitor: { include: { user: true, cursos: { include: { curso: true } }, disciplinas: { include: { disciplina: true } } } } }, orderBy: { createdAt: 'desc' } });
    const monitorRequests = await prisma.connectionRequest.findMany({ where: { monitor_id: monitor.id }, include: { aluno: { include: { user: true, cursos: { include: { curso: true } }, disciplinas: { include: { disciplina: true } } } } }, orderBy: { createdAt: 'desc' } });

    // Aceitar a primeira solicitação (se houver)
    let accepted = null;
    if (monitorRequests.length > 0) {
      const first = monitorRequests[0];
      accepted = await prisma.connectionRequest.update({ where: { id: first.id }, data: { status: 'ACCEPTED' } });
    }

    return res.json({
      aluno: { user: userAluno, alunoRecord: aluno, token: alunoToken },
      monitor: { user: userMonitor, monitorRecord: monitor, token: monitorToken },
      createdOrExistingRequest: existing,
      alunoRequests,
      monitorRequests,
      accepted
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// Deletar/terminar uma conexão (aluno ou monitor autenticado pode encerrar)
router.delete('/:id', verificaToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);
    const reqRecord = await prisma.connectionRequest.findUnique({ where: { id }, include: { aluno: { include: { user: true, cursos: { include: { curso: true } }, disciplinas: { include: { disciplina: true } } } }, monitor: { include: { user: true, cursos: { include: { curso: true } }, disciplinas: { include: { disciplina: true } } } } } });
    if (!reqRecord) return res.status(404).json({ error: 'Solicitação não encontrada' });

    // verificar se o usuário é o aluno ou o monitor relacionado
    const aluno = await prisma.aluno.findUnique({ where: { usuario_id: userId } });
    const monitor = await prisma.monitor.findUnique({ where: { usuario_id: userId } });

    const isAluno = aluno && reqRecord.aluno_id === aluno.id;
    const isMonitor = monitor && reqRecord.monitor_id === monitor.id;
    if (!isAluno && !isMonitor) return res.status(403).json({ error: 'Usuário não autorizado a encerrar esta conexão' });

    await prisma.connectionRequest.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
