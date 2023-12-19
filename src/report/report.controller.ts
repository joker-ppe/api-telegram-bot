import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Report')
@Controller('report')
export class ReportController {
  @Get('win_lose')
  GetWinLose() {
    return 0;
  }

  @Get('win_lose_today')
  GetWinLoseToday() {
    return 0;
  }

  @Get('win_lose_yesterday')
  GetWinLoseYesterday() {
    return 0;
  }
}
