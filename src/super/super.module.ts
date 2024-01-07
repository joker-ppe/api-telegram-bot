import { Module } from '@nestjs/common';
import { SuperController } from './super.controller';
import { SuperService } from './super.service';
import { ReportModule } from 'src/report/report.module';
import { ReportService } from 'src/report/report.service';

@Module({
  imports: [ReportModule],
  controllers: [SuperController],
  providers: [SuperService, ReportService],
})
export class SuperModule {}
