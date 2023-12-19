/*
  Warnings:

  - You are about to drop the column `address` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `middleName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `photoUrl` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `scheduleIdInUse` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `devices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `histories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `keys` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `schedules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `slotStatuses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `slots` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "histories" DROP CONSTRAINT "histories_scheduleId_fkey";

-- DropForeignKey
ALTER TABLE "histories" DROP CONSTRAINT "histories_userId_fkey";

-- DropForeignKey
ALTER TABLE "schedules" DROP CONSTRAINT "schedules_userId_fkey";

-- DropForeignKey
ALTER TABLE "slotStatuses" DROP CONSTRAINT "slotStatuses_slotId_fkey";

-- DropForeignKey
ALTER TABLE "slots" DROP CONSTRAINT "slots_scheduleId_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "address",
DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "createdAt",
DROP COLUMN "firstName",
DROP COLUMN "lastName",
DROP COLUMN "latitude",
DROP COLUMN "longitude",
DROP COLUMN "middleName",
DROP COLUMN "photoUrl",
DROP COLUMN "scheduleIdInUse",
DROP COLUMN "updatedAt";

-- DropTable
DROP TABLE "devices";

-- DropTable
DROP TABLE "histories";

-- DropTable
DROP TABLE "keys";

-- DropTable
DROP TABLE "schedules";

-- DropTable
DROP TABLE "slotStatuses";

-- DropTable
DROP TABLE "slots";

-- DropEnum
DROP TYPE "StatusSlot";
