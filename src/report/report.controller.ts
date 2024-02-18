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

    console.log('request: ', {
      api: 'report/GetWinLose',
      startDate: startDate,
      endDate: endDate,
      userName: userName,
    });

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

    console.log('request: ', {
      api: 'report/bidOutside',
      startDate: startDate,
      endDate: endDate,
    });

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

    console.log('request: ', {
      api: 'report/supers',
      startDate: startDate,
      endDate: endDate,
    });

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

    console.log('request: ', {
      api: 'report/masters',
      startDate: startDate,
      endDate: endDate,
    });

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

    console.log('request: ', {
      api: 'report/agents',
      startDate: startDate,
      endDate: endDate,
    });

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

    console.log('request: ', {
      api: 'report/members',
      startDate: startDate,
      endDate: endDate,
    });

    return response.send(
      await this.reportService.getMembers(startDate, endDate),
    );
  }

  @Get('membersInactive')
  async GetMembersInactive(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'application/json');

    console.log('request: ', {
      api: 'report/membersInactive',
      startDate: startDate,
      endDate: endDate,
    });

    return response.send(
      await this.reportService.getMembersInactive(startDate, endDate),
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

    console.log('request: ', {
      api: 'report/user',
      startDate: startDate,
      endDate: endDate,
      yesterday: yesterday,
      userName: userName,
    });

    return response.send(
      await this.reportService.getUser(startDate, endDate, yesterday, userName),
    );
  }

  @Get('userLastWeek')
  async GetUserLastWeek(
    @Query('userName') userName: string,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'application/json');

    console.log('request: ', {
      api: 'report/userLastWeek',
      userName: userName,
    });

    return response.send(await this.reportService.getUserLastWeek(userName));
  }

  @Get('user/send_message_from_bot')
  async GetUserOsNumber(
    @Query('message') message: string,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'application/json');
    return response.send(await this.reportService.sendMessage(message));
  }

  @Get('user/os_bet')
  async GetUserOsBet(
    @Query('endDate') endDate: string,
    @Query('userName') userName: string,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'application/json');

    console.log('request: ', {
      api: 'report/user/os_bet',
      endDate: endDate,
      userName: userName,
    });

    return response.send(
      await this.reportService.getUserOsBet(endDate, userName),
    );
  }

  @Get('date')
  async GetReportNumber(
    @Query('endDate') endDate: string,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'application/json');

    console.log('request: ', {
      api: 'report/date',
      endDate: endDate,
    });

    return response.send(await this.reportService.getReportDate(endDate));
  }

  @Get('nickName')
  async GetReportNickName(
    @Query('endDate') endDate: string,
    @Query('nickName') nickName: string,
    @Query('isLastWeek') isLastWeek: boolean,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'application/json');

    console.log('request: ', {
      api: 'report/nickName',
      endDate: endDate,
      nickName: nickName,
      isLastWeek: isLastWeek,
    });

    return response.send(
      await this.reportService.getReportNickName(endDate, nickName, isLastWeek),
    );
  }

  @Get('nickName/tet')
  async GetReportNickNameTet(
    @Query('nickName') nickName: string,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'application/json');

    console.log('request: ', {
      api: 'report/nickName/tet',
      nickName: nickName,
    });

    return response.send(
      await this.reportService.getReportNickNameTet(nickName, '2024-02-18'),
    );
  }

  @Get('user/tet')
  async GetUserTet(
    @Query('userName') userName: string,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'application/json');

    console.log('request: ', {
      api: 'user/tet',
      userName: userName,
    });

    return response.send(await this.reportService.getUserTet(userName));
  }

  // @Get('nickName/custom')
  // async GetReportNickNameCustom(
  //   @Query('endDate') endDate: string,
  //   @Query('nickName') nickName: string,
  //   @Res() response: Response,
  // ) {
  //   response.setHeader('Content-Type', 'application/json');

  //   console.log('request: ', {
  //     api: 'report/nickName/custom',
  //     endDate: endDate,
  //     nickName: nickName,
  //   });

  //   return response.send(
  //     await this.reportService.getReportNickNameCustom(endDate, nickName),
  //   );
  // }

  @Get('listReportInfo')
  async GetListReportInfo(
    @Query('endDate') endDate: string,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'application/json');

    console.log('request: ', {
      api: 'report/listReportInfo',
      endDate: endDate,
    });

    return response.send(await this.reportService.getListReportInfo(endDate));
  }
}
