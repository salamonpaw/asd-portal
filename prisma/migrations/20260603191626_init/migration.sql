-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PARTNER', 'STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "PartnerLevel" AS ENUM ('STANDARD', 'BRONZE', 'SILVER', 'GOLD', 'STRATEGIC');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('NEW', 'VERIFY', 'ACTIVE', 'NOPROT', 'NEEDINFO', 'DUP', 'REJECT', 'EXPIRED', 'DEACT', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "Procurement" AS ENUM ('BIEZACA', 'ZAPYTANIE', 'PRZETARG');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "partnerId" TEXT,
    "repId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rep" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "region" TEXT NOT NULL,

    CONSTRAINT "Rep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "level" "PartnerLevel" NOT NULL DEFAULT 'BRONZE',
    "discount" INTEGER NOT NULL DEFAULT 5,
    "candidate" BOOLEAN NOT NULL DEFAULT false,
    "contact" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "since" TEXT NOT NULL,
    "machinesReported" INTEGER NOT NULL DEFAULT 0,
    "repId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Market" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "repId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerTaxId" TEXT NOT NULL,
    "customerCountry" TEXT NOT NULL,
    "location" TEXT,
    "branch" TEXT,
    "machines" TEXT NOT NULL,
    "procurement" "Procurement" NOT NULL,
    "stage" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "decisionDate" TEXT,
    "interested" BOOLEAN NOT NULL,
    "wantsSupport" BOOLEAN NOT NULL,
    "support" TEXT[],
    "notes" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'VERIFY',
    "protected" BOOLEAN NOT NULL DEFAULT false,
    "conflictsWith" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectHistory" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "who" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "ProjectHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "internal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Rep_email_key" ON "Rep"("email");

-- CreateIndex
CREATE INDEX "Project_customerTaxId_idx" ON "Project"("customerTaxId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_repId_fkey" FOREIGN KEY ("repId") REFERENCES "Rep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_repId_fkey" FOREIGN KEY ("repId") REFERENCES "Rep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_repId_fkey" FOREIGN KEY ("repId") REFERENCES "Rep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectHistory" ADD CONSTRAINT "ProjectHistory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
