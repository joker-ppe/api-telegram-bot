import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SuperService } from './super.service';
import { Response } from 'express';

@ApiTags('Super')
@Controller('super')
export class SuperController {
  constructor(private superService: SuperService) {}

  //   @Get()
  //   async GetWinLose(
  //     @Query('startDate') startDate: string,
  //     @Query('endDate') endDate: string,
  //     @Query('userName') userName: string,
  //     @Res() response: Response,
  //   ) {
  //     response.setHeader('Content-Type', 'application/json');
  //     return response.send(
  //       await this.superService.getWinLose(startDate, endDate, userName),
  //     );
  //   }

  @Get('supers')
  async GetSupers(
    @Query('super') superUserName: string[],
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'application/json');

    console.log('request: ', {
      api: 'super/supers',
      super: superUserName,
      startDate: startDate,
      endDate: endDate,
    });

    return response.send(
      await this.superService.getSupers(superUserName, startDate, endDate),
    );
  }

  @Get('masters')
  async GetMasters(
    @Query('super') superUserName: string[],
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'application/json');

    console.log('request: ', {
      api: 'super/masters',
      super: superUserName,
      startDate: startDate,
      endDate: endDate,
    });

    return response.send(
      await this.superService.getMasters(superUserName, startDate, endDate),
    );
  }

  @Get('agents')
  async GetAgents(
    @Query('super') superUserName: string[],
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'application/json');

    console.log('request: ', {
      api: 'super/agents',
      super: superUserName,
      startDate: startDate,
      endDate: endDate,
    });

    return response.send(
      await this.superService.getAgents(superUserName, startDate, endDate),
    );
  }

  @Get('members')
  async GetMembers(
    @Query('super') superUserName: string[],
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'application/json');

    console.log('request: ', {
      api: 'super/members',
      super: superUserName,
      startDate: startDate,
      endDate: endDate,
    });

    return response.send(
      await this.superService.getMembers(superUserName, startDate, endDate),
    );
  }

  @Get('user')
  async GetUser(
    @Query('super') superUserName: string[],
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('yesterday') yesterday: string,
    @Query('userName') userName: string,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'application/json');

    console.log('request: ', {
      api: 'super/user',
      super: superUserName,
      startDate: startDate,
      endDate: endDate,
      yesterday: yesterday,
      userName: userName,
    });

    return response.send(
      await this.superService.getUser(
        superUserName,
        startDate,
        endDate,
        yesterday,
        userName,
      ),
    );
  }

  @Get('user/os_bet')
  async GetUserOsBet(
    @Query('super') superUserName: string[],
    @Query('endDate') endDate: string,
    @Query('userName') userName: string,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'application/json');

    console.log('request: ', {
      api: 'super/user/os_bet',
      super: superUserName,
      endDate: endDate,
      userName: userName,
    });

    return response.send(
      await this.superService.getUserOsBet(superUserName, endDate, userName),
    );
  }
}
