-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Aluno" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "area_interesse" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "Aluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Monitor" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "especialidade" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "preco_hora" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Monitor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Aluno_usuario_id_key" ON "Aluno"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "Monitor_usuario_id_key" ON "Monitor"("usuario_id");

-- AddForeignKey
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Monitor" ADD CONSTRAINT "Monitor_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
