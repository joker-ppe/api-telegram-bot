import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
// import { ScheduleController } from './schedule/schedule.controller';
import { ReportModule } from './report/report.module';
import { SuperService } from './super/super.service';
import { SuperController } from './super/super.controller';
import { SuperModule } from './super/super.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath: `.env.${process.env.NODE_ENV}`,
    }),
    ReportModule,
    SuperModule,
  ],
  providers: [SuperService],
  controllers: [SuperController],
  // controllers: [DayController, SlotController, HistoryController],
  // providers: [DayService, SlotService, HistoryService],
  // controllers: [],
})
export class AppModule {}
