/*
  Warnings:

  - You are about to drop the column `adminData` on the `data` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "data" DROP COLUMN "adminData",
ADD COLUMN     "adminDataThisWeek" TEXT,
ADD COLUMN     "adminDataToDay" TEXT;
