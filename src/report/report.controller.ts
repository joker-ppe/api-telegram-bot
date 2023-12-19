import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportService } from './report.service';

@ApiTags('Report')
@Controller('report')
export class ReportController {
  constructor(private reportService: ReportService) {}

  @Get()
  async GetWinLose(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('userCode') userCode: string,
    @Query('userName') userName: string,
  ) {
    return await this.reportService.getWinLose(
      startDate,
      endDate,
      userCode,
      userName,
    );
  }
}
