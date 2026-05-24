-- CreateEnum
CREATE TYPE "ActorRole" AS ENUM ('Nurse', 'Pharmacist');

-- CreateTable
CREATE TABLE "Actor" (
    "id" TEXT NOT NULL,
    "role" "ActorRole" NOT NULL,

    CONSTRAINT "Actor_pkey" PRIMARY KEY ("id")
);
