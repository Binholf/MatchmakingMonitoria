/*
  Warnings:

  - You are about to drop the column `descricao` on the `Monitor` table. All the data in the column will be lost.
  - Added the required column `experiencia` to the `Monitor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Monitor" DROP COLUMN "descricao",
ADD COLUMN     "experiencia" TEXT NOT NULL;
