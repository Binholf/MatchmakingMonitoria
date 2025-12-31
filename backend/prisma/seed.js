import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed...");

  // ===== Cursos =====
  const cursos = [
    "Ciência e Tecnologia",
    "Engenharia de Energia",
    "Engenharia de Materiais",
    "Engenharia Mecânica",
    "Administração",
    "Design",
    "Engenharia de Produção",
    "Engenharia de Computação",
    "Engenharia de Controle e Automação",
    "Engenharia Eletrônica",
    "Física Bacharelado",
    "Física Licenciatura",
    "Química Bacharelado",
    "Química Licenciatura",
    "Ciência da Computação",
    "Matemática Bacharelado",
    "Matemática Licenciatura",
    "Sistemas de Informação",
    "Engenharia Civil",
    "Engenharia Química",
    "Engenharia Ambiental",
    "Engenharia Hídrica",
    "Engenharia Mecânica Aeronáutica"
  ];

  const cursosCriados = [];
  for (const nome of cursos) {
    const curso = await prisma.curso.create({
      data: { nome, descricao: faker.lorem.sentence() }
    });
    cursosCriados.push(curso);
  }

  // ===== Disciplinas =====
  const disciplinasCriadas = [];
  for (const curso of cursosCriados) {
    for (let i = 1; i <= 5; i++) { // 5 disciplinas por curso para teste
      const disciplina = await prisma.disciplina.create({
        data: {
          nome: `${curso.nome} - Disciplina ${i}`,
          descricao: faker.lorem.sentence(),
          curso_id: curso.id
        }
      });
      disciplinasCriadas.push(disciplina);
    }
  }

  // ===== Alunos =====
  const alunosCriados = [];
  for (let i = 0; i < 40; i++) {
    const nome = faker.person.fullName();
    const email = faker.internet.email(nome.split(" ")[0], nome.split(" ")[1]);
    const cursoEscolhido = faker.helpers.arrayElement(cursosCriados);

    const user = await prisma.user.create({
      data: {
        name: nome,
        email,
        password: "123456",
        aluno: {
          create: {
            area_interesse: cursoEscolhido.nome,
            descricao: faker.lorem.sentence(),
            cursos: {
              create: { curso_id: cursoEscolhido.id }
            }
          }
        }
      },
      include: { aluno: { include: { cursos: true } } }
    });

    alunosCriados.push(user.aluno);
  }

  // ===== Monitores =====
  const monitoresCriados = [];
  for (let i = 0; i < 20; i++) {
    const nome = faker.person.fullName();
    const email = faker.internet.email(nome.split(" ")[0], nome.split(" ")[1]);
    const cursoEscolhido = faker.helpers.arrayElement(cursosCriados);

    const user = await prisma.user.create({
      data: {
        name: nome,
        email,
        password: "123456",
        monitor: {
          create: {
            especialidade: cursoEscolhido.nome,
            experiencia: faker.lorem.sentence(),
            preco_hora: parseFloat((Math.random() * 80 + 20).toFixed(2)),
            cursos: { create: { curso_id: cursoEscolhido.id } }
          }
        }
      },
      include: { monitor: { include: { cursos: true } } }
    });

    monitoresCriados.push(user.monitor);
  }

  // ===== Garantir 1 aluno e 1 monitor por disciplina =====
  for (const disc of disciplinasCriadas) {
    // Aluno
    let alunosDoCurso = alunosCriados.filter(a =>
      a.cursos.some(c => c.curso_id === disc.curso_id)
    );
    if (alunosDoCurso.length === 0) {
      const nome = faker.person.fullName();
      const email = faker.internet.email(nome.split(" ")[0], nome.split(" ")[1]);
      const user = await prisma.user.create({
        data: {
          name: nome,
          email,
          password: "123456",
          aluno: {
            create: {
              area_interesse: cursosCriados.find(c => c.id === disc.curso_id)?.nome || "Área genérica",
              descricao: faker.lorem.sentence(),
              cursos: { create: { curso_id: disc.curso_id } }
            }
          }
        },
        include: { aluno: { include: { cursos: true } } }
      });
      alunosCriados.push(user.aluno);
      alunosDoCurso = [user.aluno];
    }
    const alunoEscolhido = faker.helpers.arrayElement(alunosDoCurso);
    await prisma.alunoDisciplina.create({
      data: { aluno_id: alunoEscolhido.id, disciplina_id: disc.id }
    });

    // Monitor
    let monitoresDoCurso = monitoresCriados.filter(m =>
      m.cursos.some(c => c.curso_id === disc.curso_id)
    );
    if (monitoresDoCurso.length === 0) {
      const nome = faker.person.fullName();
      const email = faker.internet.email(nome.split(" ")[0], nome.split(" ")[1]);
      const user = await prisma.user.create({
        data: {
          name: nome,
          email,
          password: "123456",
          monitor: {
            create: {
              especialidade: cursosCriados.find(c => c.id === disc.curso_id)?.nome || "Especialidade genérica",
              experiencia: faker.lorem.sentence(),
              preco_hora: parseFloat((Math.random() * 80 + 20).toFixed(2)),
              cursos: { create: { curso_id: disc.curso_id } }
            }
          }
        },
        include: { monitor: { include: { cursos: true } } }
      });
      monitoresCriados.push(user.monitor);
      monitoresDoCurso = [user.monitor];
    }
    const monitorEscolhido = faker.helpers.arrayElement(monitoresDoCurso);
    await prisma.monitorDisciplina.create({
      data: { monitor_id: monitorEscolhido.id, disciplina_id: disc.id }
    });
  }

  // ===== Associações aleatórias adicionais =====
  for (const aluno of alunosCriados) {
    const disciplinasCurso = disciplinasCriadas.filter(d =>
      aluno.cursos.some(ac => ac.curso_id === d.curso_id)
    );
    const qtd = Math.floor(Math.random() * 3) + 2;
    const escolhidas = faker.helpers.shuffle(disciplinasCurso).slice(0, qtd);
    for (const disc of escolhidas) {
      await prisma.alunoDisciplina.create({
        data: { aluno_id: aluno.id, disciplina_id: disc.id }
      }).catch(() => {});
    }
  }

  for (const monitor of monitoresCriados) {
    const disciplinasCurso = disciplinasCriadas.filter(d =>
      monitor.cursos.some(mc => mc.curso_id === d.curso_id)
    );
    const qtd = Math.floor(Math.random() * 3) + 2;
    const escolhidas = faker.helpers.shuffle(disciplinasCurso).slice(0, qtd);
    for (const disc of escolhidas) {
      await prisma.monitorDisciplina.create({
        data: { monitor_id: monitor.id, disciplina_id: disc.id }
      }).catch(() => {});
    }
  }

  console.log("Seed finalizada com sucesso!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
