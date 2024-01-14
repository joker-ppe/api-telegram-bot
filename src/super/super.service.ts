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

  async getSupers(superUserName: string[], startDate: string, endDate: string) {
    if (typeof superUserName === 'string') {
      superUserName = [superUserName];
    }

    // console.log(superUserName);

    const admin: User = JSON.parse(
      await this.reportService.getWinLose(startDate, endDate, 'admin'),
    );

    const supers = admin.children
      .filter((child) => superUserName.includes(child.full_name))
      .filter((sup) => sup.profit !== 0 || sup.outstanding !== 0)
      .sort((a, b) => b.profit - a.profit); // Sắp xếp giảm dần theo lợi nhuận

    return JSON.stringify(supers);
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

    const admin: User = JSON.parse(
      await this.reportService.getWinLose(startDate, endDate, 'admin'),
    );

    const masters = admin.children
      .filter((child) => superUserName.includes(child.full_name))
      .flatMap((sup) => sup.children) // Triển khai con trực tiếp
      .filter((master) => master.profit !== 0 || master.outstanding !== 0)
      .sort((a, b) => b.profit - a.profit); // Sắp xếp giảm dần theo lợi nhuận

    return JSON.stringify(masters);
  }

  async getAgents(superUserName: string[], startDate: string, endDate: string) {
    if (typeof superUserName === 'string') {
      superUserName = [superUserName];
    }

    const admin: User = JSON.parse(
      await this.reportService.getWinLose(startDate, endDate, 'admin'),
    );

    const agents = admin.children
      .filter((child) => superUserName.includes(child.full_name))
      .flatMap((sup) => sup.children.flatMap((master) => master.children)) // Triển khai hai cấp con
      .filter((agent) => agent.profit !== 0 || agent.outstanding !== 0)
      .sort((a, b) => b.profit - a.profit); // Sắp xếp giảm dần theo lợi nhuận
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

    const admin: User = JSON.parse(
      await this.reportService.getWinLose(startDate, endDate, 'admin'),
    );

    const members = admin.children
      .filter((child) => superUserName.includes(child.full_name))
      .flatMap((sup) =>
        sup.children.flatMap((master) =>
          master.children.flatMap((agent) => agent.children),
        ),
      ) // Triển khai ba cấp con
      .filter((member) => member.profit !== 0 || member.outstanding !== 0)
      .sort((a, b) => b.profit - a.profit); // Sắp xếp giảm dần theo lợi nhuận
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

    user['data'] =
      user.level === 5
        ? (
            await this.reportService.getBetData(
              endDate,
              endDate,
              'betSlip',
              user.uuid,
            )
          )
            .filter((item) => user.uuid === item.user_uuid)
            .sort((a, b) =>
              a.bet_type !== b.bet_type
                ? a.bet_type - b.bet_type
                : b.point - a.point,
            )
        : [];

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
      } else {
        throw new NotFoundException();
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
