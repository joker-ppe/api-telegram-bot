import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { BetItem, User } from './dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ReportService implements OnModuleInit {
  private baseUrl: string;
  private apiKey: string;
  // private minuteHasResults: number = 34;
  private isRunningCron = false;

  private token = '6695572072:AAGxx6Rn8wyTshwhFfOnfSY6AKfhSvJIa6o'; // Replace with your Telegram bot's token
  private chatId = '-1002109063811';

  private outstandingData = new Map<string, number>();

  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    this.baseUrl = await this.getBaseUrlFromDatabase();
    this.apiKey = await this.getApiKeyFromDatabase();
  }

  sendMessage = async (message: string) => {
    console.log(message);

    const url = `https://api.telegram.org/bot${
      this.token
    }/sendMessage?chat_id=${this.chatId}&text=${encodeURIComponent(message)}`;

    try {
      const response = await fetch(url, { method: 'GET' });
      const data = await response.json();
      console.log('Message sent: ', data);
    } catch (error) {
      console.error('Error sending message: ', error);
    }
  };
  ////////////////////////////////////////////////////////////////////////////////////////////////

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  @Cron(CronExpression.EVERY_30_SECONDS, { name: 'fetchAndStoreBets' }) // Đặt tần suất cập nhật theo nhu cầu
  async handleCron() {
    // await this.fetchAndStoreBets();
    if (process.env.INSTANCE_ROLE === 'cron') {
      // Chạy cron job
      // console.log('I am a Cron job instance');
      await this.fetchAndStoreBets();
    } else {
      // console.log('Not a Cron job instance');
    }
  }

  async fetchAndStoreBets() {
    console.log('\n----------------------------------------------------\n');

    if (this.isRunningCron) {
      console.log('Cron job is running. Skip this time.');
      return;
    }

    this.isRunningCron = true;

    try {
      const currentDateString = this.getCurrentDateString();

      const date = new Date(this.createDateFromDateString(currentDateString));

      ////////////////////////////////////////////////////////////////
      console.log('Sync data last week to this week');

      const lastWeekInfo = this.getWeekOfDate(this.getDateLastWeek(date));

      console.log(JSON.stringify(lastWeekInfo));

      ////////////////////////////////////////////////////////////////
      // console.log('Sync data this week');

      // const weekInfo = this.getWeekOfDate(date);

      // console.log(JSON.stringify(weekInfo));

      // await this.getWinLoseCron(weekInfo.startDate, currentDateString);

      await this.getWinLoseCron(lastWeekInfo.startDate, currentDateString);

      console.log('################################');

      await this.getAdminInfo(currentDateString);

      await this.deleteOldData();
    } finally {
      this.isRunningCron = false;
      console.log(
        '===========>         Done cron job\n================================',
      );
    }
  }

  private async deleteOldData() {
    const date = new Date();
    date.setDate(date.getDate() - 14);

    const weekInfo = this.getWeekOfDate(date);
    const uniqueDatesSearch = this.generateDateRange(
      weekInfo.startDate,
      weekInfo.sundayOfWeek,
    );

    for (let i = 0; i < uniqueDatesSearch.length; i++) {
      const dateStr = uniqueDatesSearch[i];

      const data = await this.prismaService.data.findUnique({
        where: {
          date: dateStr,
        },
      });

      if (data) {
        console.log(`Find data at ${dateStr}. Deleting...`);
        return await this.prismaService.data.delete({
          where: {
            date: dateStr,
          },
        });
      }
    }
  }

  private getDateLastWeek(inputDate: Date) {
    const date = new Date(inputDate);
    date.setDate(date.getDate() - 7);
    return date;
  }

  async getReportDate(endDate: string) {
    const dataDate = await this.prismaService.data.findUnique({
      where: {
        date: endDate,
      },
    });

    if (!dataDate) {
      return [];
    } else {
      return dataDate.data;
    }
  }

  async getReportNickName(endDate: string, nickName: string) {
    const date = new Date(this.createDateFromDateString(endDate));

    console.log('After parse:', date);

    const weekInfo = this.getWeekOfDate(date);

    console.log(JSON.stringify(weekInfo));

    const dataFilePath = `https://raw.githubusercontent.com/joker-ppe/commission/main/config-super/config-week-${weekInfo.weekNumberInYear}-${weekInfo.year}.json`;

    try {
      const response = await fetch(dataFilePath);
      const listSupersInfo = await response.json();

      const superInfo = listSupersInfo.find(
        (superInfo: any) => superInfo.nickName === nickName,
      );

      if (superInfo) {
        // console.log({ superInfo });

        const listSupers = superInfo.super.toString().split(';');
        const listMasters = superInfo.master.toString().split(';');

        // console.log({ listSupers });
        // console.log({ listMasters });

        const listMastersData = [];
        const listSupersData = [];

        for (let i = 0; i < listSupers.length; i++) {
          const superAdmin = JSON.parse(
            await this.getWinLose(
              weekInfo.startDate,
              weekInfo.sundayOfWeek,
              listSupers[i].trim(),
            ),
          );
          if (superAdmin) {
            listSupersData.push(superAdmin);
            // listMastersData = listMastersData.concat(superAdmin.children);
          }
        }

        for (let i = 0; i < listMasters.length; i++) {
          const tmpMaster = listMastersData.filter(
            (master) => master.full_name === listMasters[i],
          );
          if (tmpMaster.length === 0) {
            const master = JSON.parse(
              await this.getWinLose(
                weekInfo.startDate,
                weekInfo.sundayOfWeek,
                listMasters[i].trim(),
              ),
            );
            listMastersData.push(master);
          }
        }

        superInfo['listMasters'] = listMastersData.filter((master) => master);
        superInfo['listSupers'] = listSupersData.filter(
          (superAdmin) => superAdmin,
        );

        return JSON.stringify(superInfo);
      } else {
        throw new NotFoundException('Not found');
      }
    } catch (error) {
      console.error(error);
      console.error(
        `Chưa có cấu hình báo cáo tuần này: ${weekInfo.weekNumberInYear}-${weekInfo.year}`,
      );

      throw new NotFoundException(error);
    }
  }

  ////////////////////////////////////////////////////////////////

  private roundDownToNearestTenPower(num: number): number {
    return Math.floor(num / 1e9) * 1e9;
  }

  async getAdminInfo(endDate: string) {
    const admin = JSON.parse(await this.getWinLose(endDate, endDate, 'admin'));

    const currentOutstanding = admin.outstanding;
    let oldOutstanding = this.outstandingData.get(endDate);

    if (!oldOutstanding) {
      oldOutstanding = 0;
      this.outstandingData.set(endDate, 0);
    }

    if (currentOutstanding > 0) {
      if (currentOutstanding - oldOutstanding >= 1000000000) {
        this.outstandingData.set(
          endDate,
          this.roundDownToNearestTenPower(currentOutstanding),
        );

        await this.sendMessage(
          `Os hiện tại: ${admin.outstanding.toLocaleString('en-US')}`,
        );
      } else {
        if (oldOutstanding === 0) {
          await this.sendMessage(
            `Os hiện tại: ${admin.outstanding.toLocaleString('en-US')}`,
          );

          this.outstandingData.set(endDate, 1);
        }
      }
    }

    if (currentOutstanding === 0 && oldOutstanding !== 0) {
      this.outstandingData.set(endDate, 0);

      await this.sendMessage(
        `Thắng thua hôm nay: ${admin.profit.toLocaleString('en-US')}`,
      );
    }

    console.table({
      Ngưỡng: this.outstandingData.get(endDate).toLocaleString('en-US'),
      'Hiện tại': admin.outstanding.toLocaleString('en-US'),
    });
  }

  async getListUsersWithDataCron(startDate: string, endDate: string) {
    const uniqueDatesSearch = this.generateDateRange(startDate, endDate);
    console.log(uniqueDatesSearch);

    console.log(`Current date: ${this.getCurrentDateString()}`);

    // const currentDateString = `${year}-${month}-${day}`;

    let betFullData: BetItem[] = [];
    for (let i = 0; i < uniqueDatesSearch.length; i++) {
      const date = uniqueDatesSearch[i];
      const dataDate = await this.prismaService.data.findUnique({
        where: {
          date: date,
        },
      });

      // Thêm dữ liệu vào mảng betFullData
      if (dataDate && dataDate.data) {
        betFullData = betFullData.concat(JSON.parse(dataDate.data));
      }
    }

    const listUsers: User[] = await this.getListUsers();

    // return listUsers;

    if (betFullData.length > 0 && listUsers && listUsers.length > 0) {
      const uniqueDates: string[] = Array.from(
        new Set(
          betFullData
            .filter((record: BetItem) => record != null)
            .filter((record: BetItem) => record.term != null)
            .map((record: BetItem) => record.term),
        ),
      );
      uniqueDates.sort((a, b) => a.localeCompare(b));

      const listAdmins: User[] = await this.parseData(
        listUsers,
        betFullData,
        uniqueDates,
      );

      //   let user: User = null;
      //   return listAdmins;
      // console.log('listAdmins: ' + JSON.stringify(listAdmins));
      return {
        listAdmins: listAdmins,
        betFullData: betFullData,
      };
    } else {
      console.log('Not found data source');
      return {
        listAdmins: [],
        betFullData: [],
      };
    }
  }

  async getWinLose(startDate: string, endDate: string, userName: string) {
    const uniqueDatesSearch = this.generateDateRange(startDate, endDate);
    console.log(uniqueDatesSearch);

    const date = new Date(this.createDateFromDateString(startDate));

    const weekInfo = this.getWeekOfDate(date);
    // console.log(weekInfo);

    let listAdmins: User[] = [];
    let betFullData: BetItem[] = [];

    if (startDate === endDate) {
      console.log('Case 1: today ->', userName);

      const dateData = await this.prismaService.data.findUnique({
        where: {
          date: endDate,
        },
      });
      if (dateData) {
        listAdmins = JSON.parse(dateData.adminDataToDay).listAdmins;
        betFullData = JSON.parse(dateData.adminDataToDay).betFullData;
      }
    } else if (startDate === weekInfo.startDate && startDate !== endDate) {
      console.log('Case 2: this week ->', userName);

      const dateData = await this.prismaService.data.findUnique({
        where: {
          date: endDate,
        },
      });
      if (dateData) {
        listAdmins = JSON.parse(dateData.adminDataThisWeek).listAdmins;
        betFullData = JSON.parse(dateData.adminDataThisWeek).betFullData;
      }
    } else {
      console.log('Case 3: random days');

      for (let i = 0; i < uniqueDatesSearch.length; i++) {
        const date = uniqueDatesSearch[i];
        const dataDate = await this.prismaService.data.findUnique({
          where: {
            date: date,
          },
        });

        // Thêm dữ liệu vào mảng betFullData
        if (dataDate && dataDate.data) {
          betFullData = betFullData.concat(JSON.parse(dataDate.data));
        }
      }

      const listUsers: User[] = await this.getListUsers();

      if (betFullData.length > 0 && listUsers && listUsers.length > 0) {
        const uniqueDates: string[] = Array.from(
          new Set(
            betFullData
              .filter((record: BetItem) => record != null)
              .filter((record: BetItem) => record.term != null)
              .map((record: BetItem) => record.term),
          ),
        );
        uniqueDates.sort((a, b) => a.localeCompare(b));

        listAdmins = await this.parseData(listUsers, betFullData, uniqueDates);

        //   let user: User = null;
        //   return listAdmins;
        // console.log('listAdmins: ' + JSON.stringify(listAdmins));
      } else {
        console.log('Not found data source');
      }
    }

    if (!listAdmins) {
      listAdmins = [];
    }
    if (!betFullData) {
      betFullData = [];
    }

    const user: User = this.findUser(listAdmins, userName);
    if (user) {
      // user.children.length = 0;

      let line = 'admin';
      let title = 'Admin';

      const listChildren = [];

      let userData = betFullData;
      const listUserUuid = [];

      if (user.level === 5) {
        title = 'Hội Viên';
        const master = this.findUser(listAdmins, user.parent_uuid);
        const superAdmin = this.findUser(listAdmins, master.parent_uuid);
        line = `${superAdmin.parent.full_name}<br/>${master.parent.full_name}<br/>${user.parent.full_name}<br/>${user.full_name}`;
        listUserUuid.push(user.uuid);
      } else if (user.level === 4) {
        title = 'Đại Lý';
        const superAdmin = this.findUser(listAdmins, user.parent_uuid);
        line = `${superAdmin.parent.full_name}<br/>${user.parent.full_name}<br/>${user.full_name}`;

        user.children.forEach((member) => {
          listChildren.push({
            full_name: member.full_name,
            outstanding: member.outstanding,
            profit: member.profit,
            commission: 0,
          });
          listUserUuid.push(member.uuid);
        });
      } else if (user.level === 3) {
        title = 'Tổng Đại Lý';
        line = `${user.parent.full_name}<br/>${user.full_name}`;

        user.children.forEach((agent) => {
          listChildren.push({
            full_name: agent.full_name,
            outstanding: agent.outstanding,
            profit: agent.profit,
            commission: agent.agentCommission,
          });
          agent.children.forEach((member) => {
            listUserUuid.push(member.uuid);
          });
        });
      } else if (user.level === 2) {
        title = 'Cổ Đông';
        line = user.full_name;
        user.children.forEach((master) => {
          listChildren.push({
            full_name: master.full_name,
            outstanding: master.outstanding,
            profit: master.profit,
            commission: master.masterCommission,
          });
          master.children.forEach((agent) => {
            agent.children.forEach((member) => {
              listUserUuid.push(member.uuid);
            });
          });
        });
      }

      if (user.level != 1) {
        userData = betFullData.filter((betSlip) =>
          listUserUuid.includes(betSlip.user_uuid),
        );
      }

      userData = userData.filter((betSlip) => betSlip.term === endDate);

      const categorizedList = userData.reduce((acc, item) => {
        // Create a key for each combination of bet_type and number
        const key = `${item.bet_type}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(item);
        return acc;
      }, {});

      const summarizeNumbersByBetType = (data) => {
        const summary = {};

        for (const betType in data) {
          let point = 0;
          let amount = 0;

          data[betType].forEach((bet) => {
            point += bet.point;
            amount += bet.amount;
          });

          summary[betType] = {
            point: point,
            amount: amount,
          };
        }

        return summary;
      };

      const summarizedNumbers = summarizeNumbersByBetType(categorizedList);
      // console.log(categorizedList);

      user['line'] = line;
      user['title'] = title;
      user['list_children'] = listChildren;
      user['data_bet'] = summarizedNumbers;

      // console.log(user['data']);

      return JSON.stringify(user);
    }
    return null;
  }

  async getWinLoseCron(startDate: string, endDate: string) {
    console.log(`Current date: ${this.getCurrentDateString()}`);

    // const currentDateString = `${year}-${month}-${day}`;

    const uniqueDatesSearch = this.generateDateRange(startDate, endDate);
    console.log(uniqueDatesSearch);

    // let betFullData: BetItem[] = [];
    for (let i = 0; i < uniqueDatesSearch.length; i++) {
      const date = uniqueDatesSearch[i];
      console.log('*******************\nChecking data date: ' + date);

      // let hasResultBet = false;

      let dataDate = await this.prismaService.data.findUnique({
        where: {
          date: date,
        },
      });

      // console.log(`${date} - ${JSON.stringify(dataDate)}`);,

      if (!dataDate) {
        dataDate = {
          date: date,
          lastTotalPage: 1,
          lastTotalRow: 0,
          data: null,
          adminDataToDay: null,
          adminDataThisWeek: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      let lastData = JSON.parse(dataDate.data);

      if (
        !dataDate.data ||
        dataDate.data === 'null' ||
        dataDate.data === '[]'
      ) {
        lastData = [];
      }

      console.log(`Current total page on db: ${dataDate.lastTotalPage}`);
      console.log(`Current total row on db: ${dataDate.lastTotalRow}`);
      console.log(`Current data size on db: ${lastData.length}`);

      const betData = await this.getBetDataCron(
        date,
        date,
        'betLog',
        dataDate.lastTotalPage,
        dataDate.lastTotalRow,
      );

      if (betData.needUpdate) {
        console.log(`results new data: ${betData.betData.length}`);
        // console.log(`results new data: ${JSON.stringify(betData.betData)}`);
        const newData = betData.betData.filter(
          (item: BetItem) =>
            !lastData.some((lastItem: BetItem) => lastItem.code === item.code),
        );
        console.log(`new data no duplicated: ${newData.length}`);

        const dateData = lastData.concat(newData);

        if (dateData.length === betData.rowCount) {
          dataDate.data = JSON.stringify(dateData);
          dataDate.lastTotalPage = betData.totalPage;
          dataDate.lastTotalRow = betData.rowCount;

          const currentDataDate = await this.prismaService.data.findUnique({
            where: {
              date: date,
            },
          });

          if (currentDataDate) {
            await this.prismaService.data.update({
              where: {
                date: date,
              },
              data: {
                data: dataDate.data,
                lastTotalPage: dataDate.lastTotalPage,
                lastTotalRow: dataDate.lastTotalRow,
              },
            });
          } else {
            await this.prismaService.data.create({
              data: {
                date: date,
                data: dataDate.data,
                lastTotalPage: dataDate.lastTotalPage,
                lastTotalRow: dataDate.lastTotalRow,
              },
            });
          }

          console.log(
            `Updated new data: total page now = ${dataDate.lastTotalPage}, total row now = ${dataDate.lastTotalRow}`,
          );

          // update admin data
          await this.updateAdminData(date);

          // await this.sendMessage(
          //   `Sync at: ${formattedDate}\n${date} => New record: ${newData.length} - Total record now: ${dataDate.lastTotalRow}`,
          // );
        } else {
          console.error(
            `Không khớp số lượng bet data: new dateData: ${dateData.length} - rowCount: ${betData.rowCount}`,
          );

          // alert(`Có lỗi xảy ra. Load lại trang`);

          // return last_data; // Or handle this case as needed
        }
      } else {
        console.log('==> No need update number row');

        let currentDataDate = await this.prismaService.data.findUnique({
          where: {
            date: date,
          },
        });

        if (!currentDataDate) {
          currentDataDate = {
            date: date,
            lastTotalPage: 1,
            lastTotalRow: 0,
            data: null,
            adminDataToDay: null,
            adminDataThisWeek: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }

        if (
          !currentDataDate.data ||
          currentDataDate.data === 'null' ||
          currentDataDate.data === '[]'
        ) {
        } else {
          const itemInDb = JSON.parse(currentDataDate.data)[0];

          if (itemInDb.status === 0) {
            console.log('==> Need update status record');
            if (betData.sampleData.status === 1) {
              console.log('==> Have results from server.........');

              await this.sendMessage(
                `Sync at: ${this.getCurrentDateTimeString()}\n${date} ==> Have results from server.........'`,
              );

              if (currentDataDate.data) {
                console.log(
                  '==> Delete data on db ......... Wait next cron time',
                );
                // xóa kết quả ngày hôm đó
                await this.prismaService.data.delete({
                  where: {
                    date: date,
                  },
                });
              }
            } else {
              console.log('==> Do not have results from server.........');

              console.log('==> Check admin data...');
              // check admin data
              if (!currentDataDate.adminDataToDay) {
                await this.updateAdminData(date);
              } else {
                console.log('==> No need update admin data...');
              }
            }
          } else {
            console.log('==> No need update status record');

            console.log('==> Check admin data...');
            // check admin data
            if (!currentDataDate.adminDataToDay) {
              await this.updateAdminData(date);
            } else {
              console.log('==> No need update admin data...');
            }
          }
        }
      }
    }
  }

  async updateAdminData(endDate: string) {
    const date = new Date(this.createDateFromDateString(endDate));

    const weekInfo = this.getWeekOfDate(date);
    const startDate = weekInfo.startDate;

    console.log(`\n\nUpdating admin data: ${startDate} -> ${endDate}`);

    const dataToDay = await this.getListUsersWithDataCron(endDate, endDate);

    const dataThisWeek = await this.getListUsersWithDataCron(
      startDate,
      endDate,
    );

    await this.prismaService.data.update({
      where: {
        date: endDate,
      },
      data: {
        adminDataToDay: JSON.stringify(dataToDay),
        adminDataThisWeek: JSON.stringify(dataThisWeek),
      },
    });

    console.log(`Completed update admin data: ${startDate} -> ${endDate}`);
  }

  async getTotalOutsideBid(startDate: string, endDate: string) {
    const admin = JSON.parse(
      await this.getWinLose(startDate, endDate, 'admin'),
    );

    let outsideBid = 0;
    for (let i = 0; i < admin.children.length; i++) {
      // console.log(listUsers[i]["profit"]);

      outsideBid += admin.children[i].bidOutside;
    }

    return JSON.stringify({ outsideBid: outsideBid });
  }

  async getSupers(startDate: string, endDate: string) {
    const admin = JSON.parse(
      await this.getWinLose(startDate, endDate, 'admin'),
    );

    const superAdmin = admin.children
      .filter((sup: User) => sup.profit !== 0 || sup.outstanding !== 0)
      .sort((a: User, b: User) => b.profit - a.profit);

    return JSON.stringify(superAdmin);
  }

  async getMasters(startDate: string, endDate: string) {
    const admin = JSON.parse(
      await this.getWinLose(startDate, endDate, 'admin'),
    );

    const masters = admin.children
      .flatMap((sup: User) => sup.children)
      .filter((master: User) => master.profit !== 0 || master.outstanding !== 0)
      .sort((a: User, b: User) => b.profit - a.profit);
    return JSON.stringify(masters);
  }

  async getAgents(startDate: string, endDate: string) {
    const admin = JSON.parse(
      await this.getWinLose(startDate, endDate, 'admin'),
    );

    const agents = admin.children
      .flatMap((sup: User) => sup.children.flatMap((master) => master.children))
      .filter((agent: User) => agent.profit !== 0 || agent.outstanding !== 0)
      .sort((a: User, b: User) => b.profit - a.profit);
    return JSON.stringify(agents);
  }

  async getMembers(startDate: string, endDate: string) {
    const admin = JSON.parse(
      await this.getWinLose(startDate, endDate, 'admin'),
    );

    let members: User[] = [];

    admin.children.forEach((sup: User) => {
      sup.children.forEach((master: User) => {
        master.children.forEach((agent: User) => {
          members = members.concat(agent.children);
        });
      });
    });
    members = members.filter(
      (member) => member.profit !== 0 || member.outstanding !== 0,
    );
    members.sort((a, b) => (a.profit > b.profit ? -1 : 1));
    return JSON.stringify(members);
  }

  async getMembersInactive(startDate: string, endDate: string) {
    const admin = JSON.parse(
      await this.getWinLose(startDate, endDate, 'admin'),
    );

    let members: User[] = [];

    admin.children.forEach((sup: User) => {
      sup.children.forEach((master: User) => {
        master.children.forEach((agent: User) => {
          members = members.concat(agent.children);
        });
      });
    });
    members = members.filter(
      (member) => member.profit === 0 && member.outstanding === 0,
    );
    members.sort((a, b) => (a.profit > b.profit ? -1 : 1));
    return JSON.stringify(members);
  }

  async getUser(
    startDate: string,
    endDate: string,
    yesterday: string,
    userName: string,
  ) {
    const user = JSON.parse(
      await this.getWinLose(startDate, endDate, userName),
    );

    let yesterdayData = user.history[yesterday];
    if (!yesterdayData) {
      yesterdayData = 0;
    }

    let todayData = user.history[endDate];
    if (!todayData) {
      todayData = 0;
    }

    user['yesterdayData'] = yesterdayData;
    user['todayData'] = todayData;

    ////////////////////////////////////////////////////////////////////////

    user.parent = {};

    // const userBetData = [];
    // userBetData.forEach((betSlip) => {});

    return JSON.stringify(user);
  }

  async getUserLastWeek(userName: string) {
    const currentDateString = this.getCurrentDateString();

    const date = new Date(this.createDateFromDateString(currentDateString));
    const lastWeekInfo = this.getWeekOfDate(this.getDateLastWeek(date));

    return this.getUser(
      lastWeekInfo.startDate,
      lastWeekInfo.sundayOfWeek,
      lastWeekInfo.saturdayOfWeek,
      userName,
    );
  }

  async getUserOsBet(endDate: string, userName: string) {
    const user = JSON.parse(await this.getWinLose(endDate, endDate, userName));

    if (user.level === 5) {
      let betData = await this.getBetData(
        endDate,
        endDate,
        'betSlip',
        user.uuid,
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
  // private async getUserData(uuid: string) {
  //   const url = `${this.baseUrl}/partner/user/index?api_key=${this.apiKey}&uuid=${uuid}&type=1`;

  //   // console.log(url);

  //   try {
  //     const response = await fetch(url);
  //     const data = await response.json();
  //     // console.log(data);
  //     return data.data[0];
  //   } catch (error) {
  //     console.error('Error loading data:', error);
  //     return null; // return null or handle error as needed
  //   } finally {
  //   }
  // }

  private findUser(listAdmins: User[], userName: string): User | undefined {
    for (const admin of listAdmins) {
      if (
        admin.username === userName ||
        admin.full_name === userName ||
        admin.uuid === userName
      ) {
        return admin;
      }
      for (const superAdmin of admin.children) {
        if (
          superAdmin.username === userName ||
          superAdmin.full_name === userName ||
          superAdmin.uuid === userName
        ) {
          return superAdmin;
        }
        for (const master of superAdmin.children) {
          if (
            master.username === userName ||
            master.full_name === userName ||
            master.uuid === userName
          ) {
            return master;
          }
          for (const agent of master.children) {
            if (
              agent.username === userName ||
              agent.full_name === userName ||
              agent.uuid === userName
            ) {
              return agent;
            }
            for (const member of agent.children) {
              if (
                member.username === userName ||
                member.full_name === userName ||
                member.uuid === userName
              ) {
                return member;
              }
            }
          }
        }
      }
    }
    return undefined;
  }

  private async getConfig() {
    const url = `${this.baseUrl}/partner/user/index?api_key=${this.apiKey}&type=1`;

    // console.log(url);

    try {
      const response = await fetch(url);
      const data = await response.json();
      // console.log(data);
      return data;
    } catch (error) {
      console.error('Error loading data:', error);
      return null; // return null or handle error as needed
    } finally {
    }
  }

  private async getListUsers(): Promise<User[]> {
    try {
      const config = await this.getConfig();
      // console.log(JSON.stringify(users));

      const totalPage = config.optional.paging_info.total_page;
      console.log('users_page', totalPage);

      const rowCount = config.optional.paging_info.row_count;
      console.log('users', rowCount);

      const results = await Promise.all(
        Array.from({ length: totalPage }, (_, i) => this.fetchUserPage(i + 1)),
      );

      const listUsers: User[] = results.flat(); // Kết hợp tất cả kết quả vào một mảng duy nhất

      if (listUsers.length === rowCount) {
        return listUsers;
      } else {
        console.error('Không khớp số lượng tài khoản');
        return null; // Or handle this case as needed
      }
    } catch (error) {
      console.error('Error loading data:', error);
      return null; // Or handle this error as needed
    } finally {
    }
  }

  private async fetchUserPage(page: number) {
    const url = `${this.baseUrl}/partner/user/index?api_key=${this.apiKey}&type=1&p=${page}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error loading data for page ${page}:`, error);
      //   alert('Mạng đểu rồi. Load lại trang đi sếp');
      return [];
    }
  }

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

  private generateDateRange(startDate: string, endDate: string) {
    const dates = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  async getBetData(
    fromDate: string,
    toDate: string,
    type: string,
    userUuid: string,
  ) {
    const config = await this.getConfigBet(fromDate, toDate, type, userUuid);
    // console.log(JSON.stringify(users));
    try {
      const totalPage = config.optional.paging_info.total_page;
      console.log(`bet page ${type} ${fromDate} -> ${toDate}`, totalPage);

      const rowCount = config.optional.paging_info.row_count;
      console.log('bet record', rowCount);

      const results = await Promise.all(
        Array.from({ length: totalPage }, (_, i) =>
          this.fetchWithRetry(3, i + 1, fromDate, toDate, type, userUuid),
        ),
      );

      const betData = results.flat(); // Kết hợp tất cả kết quả vào một mảng duy nhất

      // console.log('bet data', betData);

      if (betData.length === rowCount) {
        return betData;
      } else {
        console.error(
          `Không khớp số lượng bet data: betData: ${betData.length} - rowCount: ${rowCount}`,
        );

        // alert(`Có lỗi xảy ra. Load lại trang`);

        return null; // Or handle this case as needed
      }
    } catch (error) {
      console.error('Error loading all data:', error);
      return null; // Or handle this error as needed
    } finally {
    }
  }

  async getBetDataCron(
    fromDate: string,
    toDate: string,
    type: string,
    lastTotalPage: number,
    lastTotalRow: number,
  ) {
    // console.log(JSON.stringify(users));
    try {
      const config = await this.getConfigBet(fromDate, toDate, type, null);

      const totalPage = config.optional.paging_info.total_page;
      console.log(`Total page from api:`, totalPage);

      const rowCount = config.optional.paging_info.row_count;
      console.log('Total row from api:', rowCount);

      if (rowCount !== lastTotalRow) {
        // lấy thêm data
        const results = await Promise.all(
          Array.from({ length: totalPage - lastTotalPage + 1 }, (_, i) =>
            this.fetchWithRetry(
              3, // max tries to fetch
              i + 1, // lấy data từ page cũ
              // i + 1,
              fromDate,
              toDate,
              type,
              null,
            ),
          ),
        );

        const betData = results.flat(); // Kết hợp tất cả kết quả vào một mảng duy nhất

        return {
          needUpdate: true,
          betData: betData,
          rowCount: rowCount,
          totalPage: totalPage,
        };

        // console.log(`results new data: ${betData.length}`);
        // const newData = betData.filter((item) => !last_data.includes(item));
        // console.log(`new data: ${newData.length}`);

        // const dateData = last_data.concat(newData);

        // if (dateData.length === rowCount) {
        //   return dateData;
        // } else {
        //   console.error(
        //     `Không khớp số lượng bet data: betData: ${dateData.length} - rowCount: ${rowCount}`,
        //   );

        //   // alert(`Có lỗi xảy ra. Load lại trang`);

        //   return last_data; // Or handle this case as needed
        // }
      } else {
        const data = config.data;
        let sampleData = {
          status: 0,
        };
        if (data.length > 0) {
          sampleData = data[0];
        }
        return {
          needUpdate: false,
          sampleData: sampleData,
        };
      }
    } catch (error) {
      console.error('Error loading all data:', error);
      return {
        needUpdate: false,
      }; // Or handle this error as needed
    } finally {
    }
  }

  private async getConfigBet(
    from_date: string,
    to_date: string,
    type: string,
    userUuid: string,
  ) {
    let url: string;

    if (userUuid === null) {
      url = `${this.baseUrl}/partner/game/${type}?api_key=${this.apiKey}&from_date=${from_date}&to_date=${to_date}`;
    } else {
      url = `${this.baseUrl}/partner/game/${type}?api_key=${this.apiKey}&from_date=${from_date}&to_date=${to_date}&user_uuid=${userUuid}`;
    }

    // console.log(url);

    try {
      const response = await fetch(url);
      const data = await response.json();
      // console.log(data);
      return data;
    } catch (error) {
      console.error('Error loading data:', error);

      return null; // return null or handle error as needed
    } finally {
    }
  }

  private async fetchBetDataPage(
    page: number,
    fromDate: string,
    toDate: string,
    type: string,
    userUuid: string,
  ) {
    // showLoadingIndicator(`lịch sử bet ${page}/${totalPage}`)
    // console.log(`lịch sử bet ${page}/${totalPage}`);
    let url: string;
    if (userUuid === null) {
      url = `${this.baseUrl}/partner/game/${type}?api_key=${this.apiKey}&from_date=${fromDate}&to_date=${toDate}&p=${page}`;
    } else {
      url = `${this.baseUrl}/partner/game/${type}?api_key=${this.apiKey}&from_date=${fromDate}&to_date=${toDate}&p=${page}&user_uuid=${userUuid}`;
    }

    return fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => data.data)
      .catch((error) => {
        console.error(`Error loading data for page ${page}:`, error);
        throw new Error(`Failed to fetch page ${page}`);
        // return []; // Trả về mảng rỗng nếu có lỗi
      });
  }

  private async fetchWithRetry(
    maxRetries: number,
    page: number,
    fromDate: string,
    toDate: string,
    type: string,
    userUuid: string,
  ) {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        return await this.fetchBetDataPage(
          page,
          fromDate,
          toDate,
          type,
          userUuid,
        );
      } catch (error) {
        console.error(`Retry ${retries + 1} for page ${page}:`, error);
        retries++;
        // Optionally, you can add a delay here before retrying
      }
    }
    return [];
  }

  private async parseData(
    listUsers: User[],
    betData: any[],
    uniqueDates: string[],
  ) {
    const date = new Date(this.createDateFromDateString(uniqueDates[0]));

    console.log('After parse:', date);

    const weekInfo = this.getWeekOfDate(date);

    console.log(JSON.stringify(weekInfo));

    const dataFilePath = `https://raw.githubusercontent.com/joker-ppe/commission/main/config/config-week-${weekInfo.weekNumberInYear}-${weekInfo.year}.json`;

    try {
      const response = await fetch(dataFilePath);
      const listUsersInfo = await response.json();

      if (listUsersInfo) {
        if (listUsersInfo.length > 0) {
          // add % bid

          for (let i = 0; i < listUsers.length; i++) {
            if (listUsers[i].level < 5) {
              const listChildren: User[] = listUsers.filter(
                (user: User) => user.parent_uuid === listUsers[i].uuid,
              );
              listUsers[i]['children'] = listChildren;
            } else {
              const uuid = listUsers[i].uuid;

              const data = this.getDataOfMember(uuid, betData);

              listUsers[i]['profit'] = data.profit;
              listUsers[i]['companyCommission'] = data.companyCommission;
              listUsers[i]['adminCommission'] = data.adminCommission;
              listUsers[i]['superCommission'] = data.superCommission;
              listUsers[i]['masterCommission'] = data.masterCommission;
              listUsers[i]['agentCommission'] = data.agentCommission;
              listUsers[i]['outstanding'] = data.outstanding;
              listUsers[i]['history'] = data.history;
            }
          }

          let listAdmins = listUsers.filter((user) => user.level === 1);

          listAdmins.forEach((admin: User) => {
            // admin.children = addDataToListUsers(admin.children, listUsersInfo);

            admin.children.forEach((superAdmin: User) => {
              // superAdmin.children = addDataToListUsers(superAdmin.children, listUsersInfo);

              superAdmin.children.forEach((master: User) => {
                master.children = this.addDataToListUsers(
                  master.children,
                  listUsersInfo,
                );
              });
            });
          });

          listAdmins.forEach((admin: User) => {
            // admin.children = addDataToListUsers(admin.children, listUsersInfo);

            admin.children.forEach((superAdmin: User) => {
              superAdmin.children = this.addDataToListUsers(
                superAdmin.children,
                listUsersInfo,
              );

              superAdmin.children.forEach((master: User) => {
                master.children = this.addDataToListUsers(
                  master.children,
                  listUsersInfo,
                );
              });
            });
          });

          listAdmins.forEach((admin: User) => {
            admin.children = this.addDataToListUsers(
              admin.children,
              listUsersInfo,
            );

            admin.children.forEach((superAdmin: User) => {
              superAdmin.children = this.addDataToListUsers(
                superAdmin.children,
                listUsersInfo,
              );

              superAdmin.children.forEach((master: User) => {
                master.children = this.addDataToListUsers(
                  master.children,
                  listUsersInfo,
                );
              });
            });
          });

          listAdmins = this.addDataToListUsers(listAdmins, listUsersInfo);

          // console.log(listAgents.filter((user) => user.full_name === "joker.a1"));

          // listAdmins;

          // console.log(listAdmins);

          // showUI(listAdmins, listUsers, uniqueDates);
          return listAdmins;
        }
      }

      return null;
    } catch (error) {
      console.error(error);
      console.error(
        `Chưa có cấu hình thầu tuần này: ${weekInfo.weekNumberInYear}-${weekInfo.year}`,
      );

      return null;
    }
  }

  private addDataToListUsers(parents: any[], listUsersInfo: any[]) {
    parents.forEach((parent: any) => {
      let profit = 0;
      let companyCommission = 0;
      let adminCommission = 0;
      let superCommission = 0;
      let masterCommission = 0;
      let agentCommission = 0;
      let outstanding = 0;
      let downLineCommission = 0;

      parent.children.forEach((child: any) => {
        profit += child.profit;
        companyCommission += child.companyCommission;
        adminCommission += child.adminCommission;
        superCommission += child.superCommission;
        masterCommission += child.masterCommission;
        agentCommission += child.agentCommission;
        outstanding += child.outstanding;

        if (parent.level < 5) {
          if (parent.level === 1) {
            downLineCommission += Math.round(
              ((child.superCommission + child.downLineCommission) *
                (100 - child.bidPercent)) /
                100,
            );
          } else if (parent.level === 2) {
            downLineCommission += Math.round(
              ((child.masterCommission + child.downLineCommission) *
                (100 - child.bidPercent)) /
                100,
            );
          } else if (parent.level === 3) {
            downLineCommission += Math.round(
              (child.agentCommission * (100 - child.bidPercent)) / 100,
            );
          }
        }
      });
      parent['profit'] = profit;
      parent['companyCommission'] = companyCommission;
      parent['adminCommission'] = adminCommission;
      parent['superCommission'] = superCommission;
      parent['masterCommission'] = masterCommission;
      parent['agentCommission'] = agentCommission;
      parent['outstanding'] = outstanding;
      parent['downLineCommission'] = downLineCommission;

      const bidPercent = this.getBidPercentOfUser(
        parent.username,
        listUsersInfo,
      );

      parent['bidPercent'] = bidPercent;

      parent['bid'] = Math.round((parent.profit * bidPercent) / 100);

      if (parent.full_name === 'luckyx68') {
        parent['bidOutside'] = Math.round(
          parent.children.reduce(
            (acc: any, master: any) =>
              acc +
              ((master.profit + master.downLineCommission) *
                (80 - master.bidPercent)) /
                100,
            0,
          ),
        );
      } else {
        parent['bidOutside'] = Math.round(
          ((parent.profit + parent.downLineCommission) *
            (80 - parent.bidPercent)) /
            100,
        );
      }

      const historySumByDate = {};

      parent.children.forEach((user: any) => {
        // Iterate over each user's history
        for (const [date, amount] of Object.entries(user.history)) {
          // Check if the date already exists in the historySumByDate object
          if (historySumByDate[date]) {
            // Add the amount to the existing date
            historySumByDate[date] += amount;
          } else {
            // Initialize the date with the amount
            historySumByDate[date] = amount;
          }
        }
      });

      parent['history'] = historySumByDate;
    });

    return parents;
  }

  private getBidPercentOfUser(username: string, listUsersInfo: any[]) {
    const user = listUsersInfo.find(
      (account) => account.accountCode === username,
    );
    if (user) {
      return user.accountPercent;
    }
    return 0;
  }

  private getDataOfMember(uuid: string, betData: any[]) {
    let profit = 0;
    let companyCommission = 0;
    let adminCommission = 0;
    let superCommission = 0;
    let masterCommission = 0;
    let agentCommission = 0;

    let outstanding = 0;

    for (let i = 0; i < betData.length; i++) {
      if (betData[i].user_uuid === uuid) {
        if (betData[i].status === 1) {
          profit += betData[i].payout - betData[i].amount;

          companyCommission +=
            ((betData[i].extra_price_exchange_default
              ? betData[i].extra_price_exchange_default
              : 0) +
              (betData[i].extra_price_point
                ? betData[i].extra_price_point
                : 0)) *
            betData[i].point;

          adminCommission +=
            (betData[i].extra_price_admin_default
              ? betData[i].extra_price_admin_default
              : 0) * betData[i].point;

          superCommission +=
            (betData[i].extra_price_super_default
              ? betData[i].extra_price_super_default
              : 0) * betData[i].point;

          masterCommission +=
            (betData[i].extra_price_master_default
              ? betData[i].extra_price_master_default
              : 0) * betData[i].point;

          agentCommission +=
            (betData[i].extra_price_agent_default
              ? betData[i].extra_price_agent_default
              : 0) * betData[i].point;
        } else {
          outstanding += betData[i].amount;
        }
      }
    }

    const tmpBetData = JSON.parse(JSON.stringify(betData));
    const userBetData = tmpBetData.filter(
      (record: any) => record.user_uuid === uuid,
    );

    const termUserMap = userBetData.reduce((acc: any, item: any) => {
      // Kiểm tra xem 'term' đã tồn tại trong accumulator hay chưa
      if (item.status === 1) {
        if (acc[item.term]) {
          // Cộng dồn 'amount' nếu 'term' đã tồn tại
          acc[item.term] += item.payout - item.amount;
        } else {
          // Nếu 'term' chưa tồn tại, khởi tạo với 'amount' của item hiện tại
          acc[item.term] = item.payout - item.amount;
        }
      }

      return acc;
    }, {});

    return {
      profit: profit,
      companyCommission: companyCommission,
      adminCommission: adminCommission,
      superCommission: superCommission,
      masterCommission: masterCommission,
      agentCommission: agentCommission,
      outstanding: outstanding,
      history: termUserMap,
    };
  }

  private createDateFromDateString(dateString: string) {
    console.log('Before parse:', dateString);

    const parts = dateString.split('-');
    if (parts.length !== 3) {
      throw new Error("Invalid date format. Use 'yyyy-mm-dd'.");
    }

    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      throw new Error("Invalid date format. Use 'yyyy-mm-dd'.");
    }

    // Create a date in UTC that corresponds to midnight in Bangkok
    const bangkokOffset = 7; // Bangkok is UTC+7
    const date = new Date(Date.UTC(year, month, day));

    // Adjust the time to Bangkok's timezone
    date.setHours(date.getHours() + bangkokOffset);

    return date;
  }

  private getInfoFromDate(date: Date) {
    const weekNumber = this.getWeekNumberForDate(date);
    // const weekNumberInMonth = getWeekNumberInMonth(weekNumber, date.getFullYear());
    const weekInfo = this.getStartAndEndDateOfWeek(
      weekNumber,
      date.getFullYear(),
    );

    return {
      date: this.formatDate(date),
      weekNumberInYear: weekNumber,
      // weekNumberInMonth: weekNumberInMonth,
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      startDate: weekInfo.startDate,
      endDate: weekInfo.endDate,
    };
  }

  private formatDate(date: Date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  private getWeekNumberForDate(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor(
      (date.getTime() - firstDayOfYear.getTime()) / 86400000,
    );

    // Adjust for the first day of the year being Monday
    const adjustment =
      firstDayOfYear.getDay() === 0 ? 6 : firstDayOfYear.getDay() - 1;
    const weekNumber = Math.ceil((days + adjustment) / 7);

    return weekNumber;
  }

  private getStartAndEndDateOfWeek(weekNumber: number, year: number) {
    if (weekNumber < 1 || weekNumber > 53) {
      throw new Error('Invalid week number. Week should be between 1 and 53.');
    }

    // 1. Calculate the Thursday of the desired week (ISO 8601):
    const thursday = new Date(year, 0, 1 + (weekNumber - 1) * 7 - 3); // Adjust for Thursday

    // 2. Determine the start of the week based on the desired starting day:
    const startDate = new Date(thursday);
    startDate.setDate(startDate.getDate() - 4); // Shift to Monday (ISO 8601)

    // 3. Set the end of the week:
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    // 4. Format the dates:
    const formatDate = (date) => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();

      return `${year}-${month}-${day}`;
    };

    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    };
  }

  private getWeekOfDate(date: Date) {
    // Lấy ngày đầu tiên của tuần
    const firstDayOfWeek = this.getMonday(date)[0];
    const sundayOfWeek = this.getMonday(date)[6];
    const saturdayOfWeek = this.getMonday(date)[5];

    // Lấy số tuần của ngày đó
    const weekOfYear =
      Math.floor(
        (new Date(firstDayOfWeek).getTime() -
          new Date(date.getFullYear(), 0, 1).getTime()) /
          (1000 * 60 * 60 * 24) /
          7,
      ) + 1;

    return {
      date: date,
      weekNumberInYear: weekOfYear,
      startDate: firstDayOfWeek,
      sundayOfWeek: sundayOfWeek,
      saturdayOfWeek: saturdayOfWeek,
      year: date.getFullYear(),
    };
  }

  private getMonday(inputDate) {
    const d = new Date(inputDate);
    const out = [];

    // set to "Sunday" for the previous week
    d.setDate(d.getDate() - (d.getDay() || 7)); // if getDay is 0 (Sunday), take 7 days
    for (let i = 0; i < 7; i++) {
      // note, the value of i is unused
      out.push(new Date(d.setDate(d.getDate() + 1)).toISOString().slice(0, 10)); // increment by one day
    }
    return out;
  }

  private getCurrentDateString(): string {
    const currentDate = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const formattedDate = formatter.format(currentDate);

    console.log(`Fetching at ${formattedDate}`);

    const parts = formatter.formatToParts(currentDate);

    const year = parts.find((part) => part.type === 'year').value;
    const month = parts.find((part) => part.type === 'month').value;
    const day = parts.find((part) => part.type === 'day').value;

    const currentDateString = `${year}-${month}-${day}`;

    return currentDateString;
  }

  private getCurrentDateTimeString(): string {
    const currentDate = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const formattedDate = formatter.format(currentDate);

    return formattedDate;
  }
}
