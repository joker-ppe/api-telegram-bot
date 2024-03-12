-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "userName" TEXT NOT NULL,
    "email" TEXT,
    "hashedPassword" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keys" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data" (
    "date" TEXT NOT NULL,
    "lastTotalPage" INTEGER NOT NULL DEFAULT 1,
    "lastTotalRow" INTEGER NOT NULL DEFAULT 0,
    "data" TEXT NOT NULL,
    "adminDataToDay" TEXT,
    "adminDataThisWeek" TEXT,
    "adminDataTet" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_pkey" PRIMARY KEY ("date")
);

-- CreateTable
CREATE TABLE "bet_data" (
    "id" SERIAL NOT NULL,
    "user_uuid" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "game_type" INTEGER NOT NULL,
    "bet_type" INTEGER NOT NULL,
    "bet_category" TEXT NOT NULL,
    "number" TEXT[],
    "amount" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "point" INTEGER NOT NULL,
    "status" INTEGER NOT NULL,
    "result" INTEGER NOT NULL,
    "payout" INTEGER NOT NULL,
    "term" TEXT NOT NULL,
    "term_timestamp" BIGINT NOT NULL,
    "ticket_id" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "created_at" BIGINT NOT NULL,
    "extra_price_agent_default" INTEGER NOT NULL,
    "extra_price_master_default" INTEGER NOT NULL,
    "extra_price_super_default" INTEGER NOT NULL,
    "extra_price_exchange_default" INTEGER NOT NULL,
    "extra_price_admin_default" INTEGER NOT NULL,
    "extra_price_point" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bet_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resultLotteries" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "prizeDb" TEXT NOT NULL DEFAULT '',
    "prizeG1" TEXT NOT NULL DEFAULT '',
    "prizeG2" TEXT NOT NULL DEFAULT '',
    "prizeG3" TEXT NOT NULL DEFAULT '',
    "prizeG4" TEXT NOT NULL DEFAULT '',
    "prizeG5" TEXT NOT NULL DEFAULT '',
    "prizeG6" TEXT NOT NULL DEFAULT '',
    "prizeG7" TEXT NOT NULL DEFAULT '',
    "ketQuaDeDau" TEXT NOT NULL DEFAULT '',
    "ketQuaDeDuoi" TEXT NOT NULL DEFAULT '',
    "ketQuaDeDauGiai1" TEXT NOT NULL DEFAULT '',
    "ketQuaDeDuoiGiai1" TEXT NOT NULL DEFAULT '',
    "ketQuaLoDau" TEXT NOT NULL DEFAULT '',
    "ketQuaLoDuoi" TEXT NOT NULL DEFAULT '',
    "ketQuaXien2" TEXT NOT NULL DEFAULT '',
    "ketQuaXien3" TEXT NOT NULL DEFAULT '',
    "ketQuaXien4" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resultLotteries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_userName_key" ON "users"("userName");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "resultLotteries_date_key" ON "resultLotteries"("date");
