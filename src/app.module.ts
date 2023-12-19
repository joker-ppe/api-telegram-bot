import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
// import { ScheduleController } from './schedule/schedule.controller';

@Module({
  imports: [
    AuthModule,
    UserModule,
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath: `.env.${process.env.NODE_ENV}`,
    }),
  ],
  // controllers: [DayController, SlotController, HistoryController],
  // providers: [DayService, SlotService, HistoryService],
  // controllers: [],
})
export class AppModule {}
