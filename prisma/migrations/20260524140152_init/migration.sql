-- CreateEnum
CREATE TYPE "MedicationForm" AS ENUM ('Tablet', 'Capsule', 'Injection', 'Solution', 'Cream', 'Drops', 'Inhaler');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('Draft', 'Sent', 'Confirmed', 'Delivered');

-- CreateTable
CREATE TABLE "Medication" (
    "id" TEXT NOT NULL,
    "innName" TEXT NOT NULL,
    "atcCode" TEXT NOT NULL,
    "form" "MedicationForm" NOT NULL,
    "strength" TEXT NOT NULL,

    CONSTRAINT "Medication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicinalProduct" (
    "id" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "stockLevel" DECIMAL(18,4) NOT NULL,
    "stockThreshold" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "MedicinalProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "wardUnitId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLine" (
    "id" SERIAL NOT NULL,
    "orderId" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "OrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WardUnit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "WardUnit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MedicinalProduct" ADD CONSTRAINT "MedicinalProduct_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
