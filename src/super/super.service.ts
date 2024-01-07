import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from 'src/report/dto';
import { ReportService } from 'src/report/report.service';

@Injectable()
export class SuperService implements OnModuleInit {
  private baseUrl: string;
  private apiKey: string;

  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
    private reportService: ReportService,
  ) {}

  async onModuleInit() {
    this.baseUrl = await this.getBaseUrlFromDatabase();
    this.apiKey = await this.getApiKeyFromDatabase();
  }

  ////////////////////////////////////////////////////////////////

  async getUser(
    superUserName: string[],
    startDate: string,
    endDate: string,
    yesterday: string,
    userName: string,
  ) {
    const user = JSON.parse(
      await this.reportService.getUser(startDate, endDate, yesterday, userName),
    );

    if (typeof superUserName === 'string') {
      superUserName = [superUserName];
    }

    this.checkUserValid(user, superUserName);

    return JSON.stringify(user);
  }

  async getMasters(
    superUserName: string[],
    startDate: string,
    endDate: string,
  ) {
    if (typeof superUserName === 'string') {
      superUserName = [superUserName];
    }

    // console.log(superUserName);

    const admin = JSON.parse(
      await this.reportService.getWinLose(startDate, endDate, 'admin'),
    );

    const supers = admin.children.filter((child: User) => {
      const isSuperUser = superUserName.includes(child.full_name);
      // console.log(`Child: ${child.full_name}, Is SuperUser: ${isSuperUser}`);
      return isSuperUser;
    });

    let masters: User[] = [];

    // console.log(supers);

    supers.forEach((sup: User) => {
      masters = masters.concat(sup.children);
    });

    // console.log(masters);

    masters = masters.filter(
      (master) => master.profit !== 0 || master.outstanding !== 0,
    );
    masters.sort((a, b) => (a.profit > b.profit ? -1 : 1));
    return JSON.stringify(masters);
  }

  async getAgents(superUserName: string[], startDate: string, endDate: string) {
    if (typeof superUserName === 'string') {
      superUserName = [superUserName];
    }

    const admin = JSON.parse(
      await this.reportService.getWinLose(startDate, endDate, 'admin'),
    );

    const supers = admin.children.filter((child: User) => {
      const isSuperUser = superUserName.includes(child.full_name);
      // console.log(`Child: ${child.full_name}, Is SuperUser: ${isSuperUser}`);
      return isSuperUser;
    });

    supers.forEach((sup: User) => {
      sup.children.forEach((master: User) => {
        agents = agents.concat(master.children);
      });
    });

    let agents: User[] = [];

    agents = agents.filter(
      (agent) => agent.profit !== 0 || agent.outstanding !== 0,
    );
    agents.sort((a, b) => (a.profit > b.profit ? -1 : 1));
    return JSON.stringify(agents);
  }

  async getMembers(
    superUserName: string[],
    startDate: string,
    endDate: string,
  ) {
    if (typeof superUserName === 'string') {
      superUserName = [superUserName];
    }

    const admin = JSON.parse(
      await this.reportService.getWinLose(startDate, endDate, 'admin'),
    );

    const supers = admin.children.filter((child: User) => {
      const isSuperUser = superUserName.includes(child.full_name);
      // console.log(`Child: ${child.full_name}, Is SuperUser: ${isSuperUser}`);
      return isSuperUser;
    });

    let members: User[] = [];

    supers.forEach((master: User) => {
      master.children.forEach((agent: User) => {
        members = members.concat(agent.children);
      });
    });

    members = members.filter(
      (member) => member.profit !== 0 || member.outstanding !== 0,
    );
    members.sort((a, b) => (a.profit > b.profit ? -1 : 1));
    return JSON.stringify(members);
  }

  async getUserOsBet(
    superUserName: string[],
    endDate: string,
    userName: string,
  ) {
    const user = JSON.parse(
      await this.reportService.getWinLose(endDate, endDate, userName),
    );

    this.checkUserValid(user, superUserName);

    if (user.level === 5) {
      let betData = await this.reportService.getBetData(
        endDate,
        endDate,
        'betSlip',
      );

      betData = betData.filter((item) => user.uuid === item.user_uuid);

      // console.log(betData);

      betData.sort((a, b) => {
        if (a.bet_type !== b.bet_type) {
          return a.bet_type - b.bet_type; // Compare by property1 first
        } else {
          return b.point - a.point;
        }
      });

      user['data'] = betData;
    } else {
      user['data'] = [];
    }

    user.parent = {};

    // const userBetData = [];
    // userBetData.forEach((betSlip) => {});

    return JSON.stringify(user);
  }

  ////////////////////////////////////////////////////////////////

  private checkUserValid(user: User, superUserNames: string[]) {
    if (user.level < 2) {
      throw new NotFoundException();
    }

    if (user.level === 2) {
      if (superUserNames.includes(user.full_name)) {
        return;
      }
    }

    const line = user.line;

    const lineStr = line.split('<br/>');
    if (lineStr.length < 2) {
      throw new NotFoundException();
    }

    const isDownLine = superUserNames.includes(lineStr[0]);
    if (!isDownLine) {
      throw new NotFoundException();
    }
  }

  ////////////////////////////////////////////////////////////////

  private async getApiKeyFromDatabase() {
    const config = await this.prismaService.key.findFirst({
      where: { name: 'API_KEY_LD' },
    });
    return config.key;
  }

  private async getBaseUrlFromDatabase() {
    const config = await this.prismaService.key.findFirst({
      where: { name: 'BASE_URL_LD' },
    });
    return config.key;
  }
}
