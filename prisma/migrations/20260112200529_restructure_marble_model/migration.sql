/*
  Warnings:

  - You are about to drop the column `barcode` on the `Marble` table. All the data in the column will be lost.
  - You are about to drop the column `batchNumber` on the `Marble` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `Marble` table. All the data in the column will be lost.
  - You are about to drop the column `costPrice` on the `Marble` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Marble` table. All the data in the column will be lost.
  - You are about to drop the column `salePrice` on the `Marble` table. All the data in the column will be lost.
  - You are about to drop the column `supplier` on the `Marble` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `Marble` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[marbleType]` on the table `Marble` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[barcodeAA]` on the table `Marble` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[barcodeA]` on the table `Marble` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[barcodeB]` on the table `Marble` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[barcodeBMinus]` on the table `Marble` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shade` to the `ReservedStock` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Marble_barcode_key";

-- AlterTable
ALTER TABLE "Marble" DROP COLUMN "barcode",
DROP COLUMN "batchNumber",
DROP COLUMN "color",
DROP COLUMN "costPrice",
DROP COLUMN "quantity",
DROP COLUMN "salePrice",
DROP COLUMN "supplier",
DROP COLUMN "unit",
ADD COLUMN     "barcodeA" TEXT,
ADD COLUMN     "barcodeAA" TEXT,
ADD COLUMN     "barcodeB" TEXT,
ADD COLUMN     "barcodeBMinus" TEXT,
ADD COLUMN     "costPriceA" DOUBLE PRECISION,
ADD COLUMN     "costPriceAA" DOUBLE PRECISION,
ADD COLUMN     "costPriceB" DOUBLE PRECISION,
ADD COLUMN     "costPriceBMinus" DOUBLE PRECISION,
ADD COLUMN     "salePriceA" DOUBLE PRECISION,
ADD COLUMN     "salePriceAA" DOUBLE PRECISION,
ADD COLUMN     "salePriceB" DOUBLE PRECISION,
ADD COLUMN     "salePriceBMinus" DOUBLE PRECISION,
ADD COLUMN     "shadeA" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shadeAA" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shadeB" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shadeBMinus" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "status" SET DEFAULT 'Out of Stock';

-- AlterTable
ALTER TABLE "ReservedStock" ADD COLUMN     "shade" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "StockEntry" (
    "id" SERIAL NOT NULL,
    "marbleId" INTEGER NOT NULL,
    "shade" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "slabSizeLength" DOUBLE PRECISION,
    "slabSizeWidth" DOUBLE PRECISION,
    "numberOfSlabs" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Marble_marbleType_key" ON "Marble"("marbleType");

-- CreateIndex
CREATE UNIQUE INDEX "Marble_barcodeAA_key" ON "Marble"("barcodeAA");

-- CreateIndex
CREATE UNIQUE INDEX "Marble_barcodeA_key" ON "Marble"("barcodeA");

-- CreateIndex
CREATE UNIQUE INDEX "Marble_barcodeB_key" ON "Marble"("barcodeB");

-- CreateIndex
CREATE UNIQUE INDEX "Marble_barcodeBMinus_key" ON "Marble"("barcodeBMinus");

-- AddForeignKey
ALTER TABLE "StockEntry" ADD CONSTRAINT "StockEntry_marbleId_fkey" FOREIGN KEY ("marbleId") REFERENCES "Marble"("id") ON DELETE CASCADE ON UPDATE CASCADE;
