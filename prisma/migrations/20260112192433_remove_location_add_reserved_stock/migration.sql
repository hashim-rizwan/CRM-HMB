/*
  Warnings:

  - You are about to drop the column `location` on the `Marble` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "StockTransaction" DROP CONSTRAINT "StockTransaction_marbleId_fkey";

-- AlterTable
ALTER TABLE "Marble" DROP COLUMN "location";

-- CreateTable
CREATE TABLE "ReservedStock" (
    "id" SERIAL NOT NULL,
    "marbleId" INTEGER NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT,
    "clientEmail" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "slabSizeLength" DOUBLE PRECISION NOT NULL,
    "slabSizeWidth" DOUBLE PRECISION NOT NULL,
    "numberOfSlabs" INTEGER NOT NULL,
    "reservedBy" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Reserved',
    "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservedStock_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_marbleId_fkey" FOREIGN KEY ("marbleId") REFERENCES "Marble"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservedStock" ADD CONSTRAINT "ReservedStock_marbleId_fkey" FOREIGN KEY ("marbleId") REFERENCES "Marble"("id") ON DELETE CASCADE ON UPDATE CASCADE;
