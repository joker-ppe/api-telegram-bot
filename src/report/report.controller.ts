import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { Response } from 'express';

@ApiTags('Report')
@Controller('report')
export class ReportController {
  constructor(private reportService: ReportService) {}

  @Get()
  async GetWinLose(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('userName') userName: string,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'application/json');
    return response.send(
      await this.reportService.getWinLose(startDate, endDate, userName),
    );
  }

  @Get('bidOutside')
  async GetBidOutSide(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'application/json');
    return response.send(
      await this.reportService.getTotalOutsideBid(startDate, endDate),
    );
  }

  @Get('supers')
  async GetSupers(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'application/json');
    return response.send(
      await this.reportService.getSupers(startDate, endDate),
    );
  }

  @Get('masters')
  async GetMasters(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'application/json');
    return response.send(
      await this.reportService.getMasters(startDate, endDate),
    );
  }

  @Get('agents')
  async GetAgents(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'application/json');
    return response.send(
      await this.reportService.getAgents(startDate, endDate),
    );
  }

  @Get('members')
  async GetMembers(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'application/json');
    return response.send(
      await this.reportService.getMembers(startDate, endDate),
    );
  }

  @Get('user')
  async GetUser(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('yesterday') yesterday: string,
    @Query('userName') userName: string,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'application/json');
    return response.send(
      await this.reportService.getUser(startDate, endDate, yesterday, userName),
    );
  }

  @Get('user/os_number')
  async GetUserOsNumber(
    @Query('endDate') endDate: string,
    @Query('userName') userName: string,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'application/json');
    return response.send(
      await this.reportService.getUserOsNumber(endDate, userName),
    );
  }

  @Get('user/os_bet')
  async GetUserOsBet(
    @Query('endDate') endDate: string,
    @Query('userName') userName: string,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'application/json');
    return response.send(
      await this.reportService.getUserOsBet(endDate, userName),
    );
  }

  @Get('numbers')
  async GetReportNumber(
    @Query('endDate') endDate: string,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'application/json');
    return response.send(await this.reportService.getReportNumber(endDate));
  }
}
