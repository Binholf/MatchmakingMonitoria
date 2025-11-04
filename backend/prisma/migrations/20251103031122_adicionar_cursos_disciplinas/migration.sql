-- AlterTable
ALTER TABLE "Aluno" ALTER COLUMN "area_interesse" DROP NOT NULL,
ALTER COLUMN "descricao" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Monitor" ALTER COLUMN "especialidade" DROP NOT NULL,
ALTER COLUMN "preco_hora" DROP NOT NULL,
ALTER COLUMN "experiencia" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Curso" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "Curso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disciplina" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "curso_id" INTEGER NOT NULL,

    CONSTRAINT "Disciplina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlunoCurso" (
    "id" SERIAL NOT NULL,
    "aluno_id" INTEGER NOT NULL,
    "curso_id" INTEGER NOT NULL,

    CONSTRAINT "AlunoCurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitorCurso" (
    "id" SERIAL NOT NULL,
    "monitor_id" INTEGER NOT NULL,
    "curso_id" INTEGER NOT NULL,

    CONSTRAINT "MonitorCurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlunoDisciplina" (
    "id" SERIAL NOT NULL,
    "aluno_id" INTEGER NOT NULL,
    "disciplina_id" INTEGER NOT NULL,

    CONSTRAINT "AlunoDisciplina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitorDisciplina" (
    "id" SERIAL NOT NULL,
    "monitor_id" INTEGER NOT NULL,
    "disciplina_id" INTEGER NOT NULL,

    CONSTRAINT "MonitorDisciplina_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Disciplina" ADD CONSTRAINT "Disciplina_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "Curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlunoCurso" ADD CONSTRAINT "AlunoCurso_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "Aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlunoCurso" ADD CONSTRAINT "AlunoCurso_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "Curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitorCurso" ADD CONSTRAINT "MonitorCurso_monitor_id_fkey" FOREIGN KEY ("monitor_id") REFERENCES "Monitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitorCurso" ADD CONSTRAINT "MonitorCurso_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "Curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlunoDisciplina" ADD CONSTRAINT "AlunoDisciplina_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "Aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlunoDisciplina" ADD CONSTRAINT "AlunoDisciplina_disciplina_id_fkey" FOREIGN KEY ("disciplina_id") REFERENCES "Disciplina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitorDisciplina" ADD CONSTRAINT "MonitorDisciplina_monitor_id_fkey" FOREIGN KEY ("monitor_id") REFERENCES "Monitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitorDisciplina" ADD CONSTRAINT "MonitorDisciplina_disciplina_id_fkey" FOREIGN KEY ("disciplina_id") REFERENCES "Disciplina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
