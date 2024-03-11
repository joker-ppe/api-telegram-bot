-- CreateTable
CREATE TABLE "resultLotteries" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "priceDb" TEXT NOT NULL DEFAULT '',
    "priceG1" TEXT NOT NULL DEFAULT '',
    "priceG2" TEXT NOT NULL DEFAULT '',
    "priceG3" TEXT NOT NULL DEFAULT '',
    "priceG4" TEXT NOT NULL DEFAULT '',
    "priceG5" TEXT NOT NULL DEFAULT '',
    "priceG6" TEXT NOT NULL DEFAULT '',
    "priceG7" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resultLotteries_pkey" PRIMARY KEY ("id")
);
