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
    masterUserName: string[],

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

    if (typeof masterUserName === 'string') {
      masterUserName = [masterUserName];
    }
    masterUserName = masterUserName.filter((userName) => userName !== '');

    this.checkUserValid(user, superUserName, masterUserName);

    return JSON.stringify(user);
  }

  async getSupers(superUserName: string[], startDate: string, endDate: string) {
    if (typeof superUserName === 'string') {
      superUserName = [superUserName];
    }

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
    masterUserName: string[],
    startDate: string,
    endDate: string,
  ) {
    if (typeof superUserName === 'string') {
      superUserName = [superUserName];
    }

    if (typeof masterUserName === 'string') {
      masterUserName = [masterUserName];
    }
    masterUserName = masterUserName.filter((userName) => userName !== '');

    const admin: User = JSON.parse(
      await this.reportService.getWinLose(startDate, endDate, 'admin'),
    );

    let singleMasters: User[];

    // master ở cây super lớn
    const mastersFromSuper = admin.children
      .filter((child) => superUserName.includes(child.full_name))
      .flatMap((sup) => sup.children) // Triển khai con trực tiếp
      .filter((master) => master.profit !== 0 || master.outstanding !== 0);
    // .sort((a, b) => b.profit - a.profit); // Sắp xếp giảm dần theo lợi nhuận

    if (masterUserName.length > 0) {
      singleMasters = admin.children
        .flatMap((sup) => sup.children) // Triển khai con trực tiếp
        .filter((master) => masterUserName.includes(master.full_name)) // thêm filter master
        .filter((master) => master.profit !== 0 || master.outstanding !== 0);
    }

    const masters = mastersFromSuper
      .concat(singleMasters)
      .sort((a, b) => b.profit - a.profit);

    return JSON.stringify(masters);
  }

  async getAgents(
    superUserName: string[],
    masterUserName: string[],

    startDate: string,
    endDate: string,
  ) {
    if (typeof superUserName === 'string') {
      superUserName = [superUserName];
    }

    if (typeof masterUserName === 'string') {
      masterUserName = [masterUserName];
    }
    masterUserName = masterUserName.filter((userName) => userName !== '');

    const admin: User = JSON.parse(
      await this.reportService.getWinLose(startDate, endDate, 'admin'),
    );

    // master ở cây super lớn
    const mastersFromSuper = admin.children
      .filter((child) => superUserName.includes(child.full_name))
      .flatMap((sup) => sup.children); // Triển khai con trực tiếp
    // .filter((master) => master.profit !== 0 || master.outstanding !== 0);
    // .sort((a, b) => b.profit - a.profit); // Sắp xếp giảm dần theo lợi nhuận

    let singleMasters: User[];

    if (masterUserName.length > 0) {
      singleMasters = admin.children
        .flatMap((sup) => sup.children) // Triển khai con trực tiếp
        .filter((master) => masterUserName.includes(master.full_name)); // thêm filter master
      // .filter((master) => master.profit !== 0 || master.outstanding !== 0);
    }

    const agents = mastersFromSuper
      .concat(singleMasters)
      .flatMap((master) => master.children)
      .filter((agent) => agent.profit !== 0 || agent.outstanding !== 0)
      .sort((a, b) => b.profit - a.profit);
    return JSON.stringify(agents);
  }

  async getMembers(
    superUserName: string[],
    masterUserName: string[],
    startDate: string,
    endDate: string,
  ) {
    if (typeof superUserName === 'string') {
      superUserName = [superUserName];
    }

    if (typeof masterUserName === 'string') {
      masterUserName = [masterUserName];
    }
    masterUserName = masterUserName.filter((userName) => userName !== '');

    const admin: User = JSON.parse(
      await this.reportService.getWinLose(startDate, endDate, 'admin'),
    );

    // master ở cây super lớn
    const mastersFromSuper = admin.children
      .filter((child) => superUserName.includes(child.full_name))
      .flatMap((sup) => sup.children); // Triển khai con trực tiếp
    // .filter((master) => master.profit !== 0 || master.outstanding !== 0);
    // .sort((a, b) => b.profit - a.profit); // Sắp xếp giảm dần theo lợi nhuận

    let singleMasters: User[];

    if (masterUserName.length > 0) {
      singleMasters = admin.children
        .flatMap((sup) => sup.children) // Triển khai con trực tiếp
        .filter((master) => masterUserName.includes(master.full_name)); // thêm filter master
      // .filter((master) => master.profit !== 0 || master.outstanding !== 0);
    }

    const members = mastersFromSuper
      .concat(singleMasters)
      .flatMap((master) => master.children.flatMap((agent) => agent.children))
      .filter((member) => member.profit !== 0 || member.outstanding !== 0)
      .sort((a, b) => b.profit - a.profit);

    return JSON.stringify(members);

    // const members = admin.children
    //   .filter((child) => superUserName.includes(child.full_name))
    //   .flatMap((sup) =>
    //     sup.children.flatMap((master) =>
    //       master.children.flatMap((agent) => agent.children),
    //     ),
    //   ) // Triển khai ba cấp con
    //   .filter((member) => member.profit !== 0 || member.outstanding !== 0)
    //   .sort((a, b) => b.profit - a.profit); // Sắp xếp giảm dần theo lợi nhuận
    // return JSON.stringify(members);
  }

  async getUserOsBet(
    superUserName: string[],
    masterUserName: string[],
    endDate: string,
    userName: string,
  ) {
    const user = JSON.parse(
      await this.reportService.getWinLose(endDate, endDate, userName),
    );

    if (typeof superUserName === 'string') {
      superUserName = [superUserName];
    }

    if (typeof masterUserName === 'string') {
      masterUserName = [masterUserName];
    }
    masterUserName = masterUserName.filter((userName) => userName !== '');

    this.checkUserValid(user, superUserName, masterUserName);

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

  private checkUserValid(
    user: User,
    superUserNames: string[],
    masterUserNames: string[],
  ) {
    if (user.level < 2) {
      throw new NotFoundException();
    }

    const line = user.line;
    const lineStr = line.split('<br/>');

    if (user.level === 2) {
      if (superUserNames.includes(user.full_name)) {
        return;
      } else {
        throw new NotFoundException();
      }
    } else if (user.level === 3) {
      if (lineStr.length != 2) {
        throw new NotFoundException();
      }

      // case: master ở nhánh super lớn
      if (superUserNames.includes(lineStr[0])) {
        return;
      } else {
        // case: master nằm trong list masters
        if (masterUserNames.length > 0) {
          if (!masterUserNames.includes(user.full_name)) {
            throw new NotFoundException();
          } else {
            return;
          }
        } else {
          throw new NotFoundException();
        }
      }
    } else if (user.level === 4) {
      if (lineStr.length != 3) {
        throw new NotFoundException();
      }

      // case: agent ở nhánh super lớn
      if (superUserNames.includes(lineStr[0])) {
        return;
      } else {
        // case: agent nằm trong list masters
        if (masterUserNames.length > 0) {
          if (!masterUserNames.includes(lineStr[1])) {
            throw new NotFoundException();
          } else {
            return;
          }
        } else {
          throw new NotFoundException();
        }
      }
    } else if (user.level === 5) {
      if (lineStr.length != 4) {
        throw new NotFoundException();
      }

      // case: agent ở nhánh super lớn
      if (superUserNames.includes(lineStr[0])) {
        return;
      } else {
        // case: member nằm trong list masters
        if (masterUserNames.length > 0) {
          if (!masterUserNames.includes(lineStr[1])) {
            throw new NotFoundException();
          } else {
            return;
          }
        } else {
          throw new NotFoundException();
        }
      }
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
