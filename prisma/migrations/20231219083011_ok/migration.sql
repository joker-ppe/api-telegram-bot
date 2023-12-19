-- CreateTable
CREATE TABLE "keys" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "keys_pkey" PRIMARY KEY ("id")
);


INSERT INTO "keys" ("name","key","updatedAt") VALUES ('api_key_device', 'InVMJN87fOOSvcI15qYnTRDj2YYe8hxH',CURRENT_TIMESTAMP);

INSERT INTO "keys" ("name","key","updatedAt") VALUES ('JWT_SECRET', 'Pass in 2023. Joker key @#@$#@$&^*&^',CURRENT_TIMESTAMP);

INSERT INTO "keys" ("name","key","updatedAt") VALUES ('API_KEY_LD', 'Gr8pGZ2mrMjRS5YfvWZVbIqaV',CURRENT_TIMESTAMP);

INSERT INTO "keys" ("name","key","updatedAt") VALUES ('BASE_URL_LD', 'https://lottery-cms.lucky6.net',CURRENT_TIMESTAMP);
