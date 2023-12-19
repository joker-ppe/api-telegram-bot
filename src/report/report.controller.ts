import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportService } from './report.service';

@ApiTags('Report')
@Controller('report')
export class ReportController {
  constructor(private reportService: ReportService) {}

  @Get('win_lose_this_week')
  async GetWinLose(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('userCode') userCode: string,
  ) {
    return await this.reportService.getWinLose(startDate, endDate, userCode);
  }
}
