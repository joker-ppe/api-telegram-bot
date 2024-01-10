import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { BetItem, User } from './dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ReportService implements OnModuleInit {
  private baseUrl: string;
  private apiKey: string;
  private minuteHasResults: number = 34;
  private isRunningCron = false;

  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    this.baseUrl = await this.getBaseUrlFromDatabase();
    this.apiKey = await this.getApiKeyFromDatabase();
  }
  ////////////////////////////////////////////////////////////////////////////////////////////////

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  @Cron(CronExpression.EVERY_MINUTE, { name: 'fetchAndStoreBets' }) // Đặt tần suất cập nhật theo nhu cầu
  async handleCron() {
    await this.fetchAndStoreBets();
  }

  async fetchAndStoreBets() {
    console.log('\n----------------------------------------------------\n');

    if (this.isRunningCron) {
      console.log('Cron job is running. Skip this time.');
      return;
    }

    this.isRunningCron = true;

    try {
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

      const date = new Date();

      const weekInfo = this.getInfoFromDate(date);

      console.log(JSON.stringify(weekInfo));

      const parts = formatter.formatToParts(currentDate);

      const year = parts.find((part) => part.type === 'year').value;
      const month = parts.find((part) => part.type === 'month').value;
      const day = parts.find((part) => part.type === 'day').value;

      const currentDateString = `${year}-${month}-${day}`;

      await this.getWinLoseCron(weekInfo.startDate, currentDateString);
    } finally {
      this.isRunningCron = false;
      console.log('Done cron job');
    }
  }

  ////////////////////////////////////////////////////////////////

  async getWinLose(startDate: string, endDate: string, userName: string) {
    const uniqueDatesSearch = this.generateDateRange(startDate, endDate);
    console.log(uniqueDatesSearch);

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

    // const parts = formatter.formatToParts(currentDate);

    // const year = parts.find((part) => part.type === 'year').value;
    // const month = parts.find((part) => part.type === 'month').value;
    // const day = parts.find((part) => part.type === 'day').value;
    // const hour = parts.find((part) => part.type === 'hour').value;
    // const minute = parts.find((part) => part.type === 'minute').value;

    console.log(`Current date: ${formattedDate}`);

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

    if (betFullData && listUsers) {
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
      // console.log('listAdmins: ' + listAdmins);

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
          const master = await this.getUserData(user.parent_uuid);
          const superAdmin = await this.getUserData(master.parent_uuid);
          line = `${superAdmin.parent.full_name}<br/>${master.parent.full_name}<br/>${user.parent.full_name}<br/>${user.full_name}`;
          listUserUuid.push(user.uuid);
        } else if (user.level === 4) {
          title = 'Đại Lý';
          const superAdmin = await this.getUserData(user.parent_uuid);
          line = `${superAdmin.parent.full_name}<br/>${user.parent.full_name}<br/>${user.full_name}`;

          user.children.forEach((member) => {
            listChildren.push({
              full_name: member.full_name,
              outstanding: member.outstanding,
              profit: member.profit,
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
            // summary[betType] = [];

            // data[betType].forEach((bet) => {
            //   summary[betType].push({
            //     number: bet.number,
            //     point: bet.point,
            //     price: bet.price,
            //     amount: bet.amount,
            //   });
            // });

            // // Sắp xếp mảng theo point
            // summary[betType].sort((a, b) => b.point - a.point);

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

      console.log('Not found');
      throw new NotFoundException('Not found');
    } else {
      console.log('Not found data source');
      throw new NotFoundException('Not found data source');
    }
  }

  async getWinLoseCron(startDate: string, endDate: string) {
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

    const parts = formatter.formatToParts(currentDate);

    const year = parts.find((part) => part.type === 'year').value;
    const month = parts.find((part) => part.type === 'month').value;
    const day = parts.find((part) => part.type === 'day').value;
    const hour = parts.find((part) => part.type === 'hour').value;
    const minute = parts.find((part) => part.type === 'minute').value;

    console.log(`Current date: ${formattedDate}`);

    const currentDateString = `${year}-${month}-${day}`;

    const uniqueDatesSearch = this.generateDateRange(startDate, endDate);
    console.log(uniqueDatesSearch);

    // let betFullData: BetItem[] = [];
    for (let i = 0; i < uniqueDatesSearch.length; i++) {
      const date = uniqueDatesSearch[i];
      console.log('*******************\nChecking data date: ' + date);

      let hasResultBet = false;

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
          hasResult: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      if (currentDateString === date) {
        if (
          (parseInt(hour) === 18 && parseInt(minute) > this.minuteHasResults) ||
          parseInt(hour) > 18
        ) {
          if (!dataDate.hasResult) {
            if (dataDate.data) {
              // xóa kết quả ngày hôm đó
              await this.prismaService.data.delete({
                where: {
                  date: date,
                },
              });

              // update current data date
              dataDate = {
                date: date,
                lastTotalPage: 1,
                lastTotalRow: 0,
                data: null,
                hasResult: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
            }
          }
          hasResultBet = true;
        } else {
          hasResultBet = false;
        }
      } else {
        hasResultBet = true;
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
          dataDate.hasResult = hasResultBet;

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
                hasResult: dataDate.hasResult,
              },
            });
          } else {
            await this.prismaService.data.create({
              data: {
                date: date,
                data: dataDate.data,
                lastTotalPage: dataDate.lastTotalPage,
                lastTotalRow: dataDate.lastTotalRow,
                hasResult: dataDate.hasResult,
              },
            });
          }

          console.log(
            `Updated new data: total page now=${dataDate.lastTotalPage}, total row now=${dataDate.lastTotalRow}, hasResult=${dataDate.hasResult}`,
          );
        } else {
          console.error(
            `Không khớp số lượng bet data: new dateData: ${dateData.length} - rowCount: ${betData.rowCount}, hasResult=${dataDate.hasResult}`,
          );

          // alert(`Có lỗi xảy ra. Load lại trang`);

          // return last_data; // Or handle this case as needed
        }
      } else {
        console.log('No need update');
      }

      // Thêm dữ liệu vào mảng betFullData
      // if (dataDate.data) {
      //   betFullData = betFullData.concat(JSON.parse(dataDate.data));
      // }
    }

    // const listUsers: User[] = await this.getListUsers();

    // return listUsers;

    // if (betFullData && listUsers) {
    //   const uniqueDates: string[] = Array.from(
    //     new Set(
    //       betFullData
    //         .filter((record: BetItem) => record != null)
    //         .filter((record: BetItem) => record.term != null)
    //         .map((record: BetItem) => record.term),
    //     ),
    //   );
    //   uniqueDates.sort((a, b) => a.localeCompare(b));

    //   const listAdmins: User[] = await this.parseData(
    //     listUsers,
    //     betFullData,
    //     uniqueDates,
    //   );

    //   //   let user: User = null;
    //   //   return listAdmins;
    //   // console.log('listAdmins: ' + listAdmins);

    //   const user: User = this.findUser(listAdmins, userName);
    //   if (user) {
    //     // user.children.length = 0;

    //     let line = 'admin';
    //     let title = 'Admin';

    //     const listChildren = [];

    //     let userData = betFullData;
    //     const listUserUuid = [];

    //     if (user.level === 5) {
    //       title = 'Hội Viên';
    //       const master = await this.getUserData(user.parent_uuid);
    //       const superAdmin = await this.getUserData(master.parent_uuid);
    //       line = `${superAdmin.parent.full_name}<br/>${master.parent.full_name}<br/>${user.parent.full_name}<br/>${user.full_name}`;
    //       listUserUuid.push(user.uuid);
    //     } else if (user.level === 4) {
    //       title = 'Đại Lý';
    //       const superAdmin = await this.getUserData(user.parent_uuid);
    //       line = `${superAdmin.parent.full_name}<br/>${user.parent.full_name}<br/>${user.full_name}`;

    //       user.children.forEach((member) => {
    //         listChildren.push({
    //           full_name: member.full_name,
    //           outstanding: member.outstanding,
    //           profit: member.profit,
    //         });
    //         listUserUuid.push(member.uuid);
    //       });
    //     } else if (user.level === 3) {
    //       title = 'Tổng Đại Lý';
    //       line = `${user.parent.full_name}<br/>${user.full_name}`;

    //       user.children.forEach((agent) => {
    //         listChildren.push({
    //           full_name: agent.full_name,
    //           outstanding: agent.outstanding,
    //           profit: agent.profit,
    //         });
    //         agent.children.forEach((member) => {
    //           listUserUuid.push(member.uuid);
    //         });
    //       });
    //     } else if (user.level === 2) {
    //       title = 'Cổ Đông';
    //       line = user.full_name;
    //       user.children.forEach((master) => {
    //         listChildren.push({
    //           full_name: master.full_name,
    //           outstanding: master.outstanding,
    //           profit: master.profit,
    //         });
    //         master.children.forEach((agent) => {
    //           agent.children.forEach((member) => {
    //             listUserUuid.push(member.uuid);
    //           });
    //         });
    //       });
    //     }

    //     if (user.level != 1) {
    //       userData = betFullData.filter((betSlip) =>
    //         listUserUuid.includes(betSlip.user_uuid),
    //       );
    //     }

    //     userData = userData.filter((betSlip) => betSlip.term === endDate);

    //     const categorizedList = userData.reduce((acc, item) => {
    //       // Create a key for each combination of bet_type and number
    //       const key = `${item.bet_type}`;
    //       if (!acc[key]) {
    //         acc[key] = [];
    //       }
    //       acc[key].push(item);
    //       return acc;
    //     }, {});

    //     const summarizeNumbersByBetType = (data) => {
    //       const summary = {};

    //       for (const betType in data) {
    //         // summary[betType] = [];

    //         // data[betType].forEach((bet) => {
    //         //   summary[betType].push({
    //         //     number: bet.number,
    //         //     point: bet.point,
    //         //     price: bet.price,
    //         //     amount: bet.amount,
    //         //   });
    //         // });

    //         // // Sắp xếp mảng theo point
    //         // summary[betType].sort((a, b) => b.point - a.point);

    //         let point = 0;
    //         let amount = 0;

    //         data[betType].forEach((bet) => {
    //           point += bet.point;
    //           amount += bet.amount;
    //         });

    //         summary[betType] = {
    //           point: point,
    //           amount: amount,
    //         };
    //       }

    //       return summary;
    //     };

    //     const summarizedNumbers = summarizeNumbersByBetType(categorizedList);
    //     // console.log(categorizedList);

    //     user['line'] = line;
    //     user['title'] = title;
    //     user['list_children'] = listChildren;
    //     user['data_bet'] = summarizedNumbers;

    //     // console.log(user['data']);

    //     return JSON.stringify(user);
    //   }

    //   console.log('Not found');
    //   throw new NotFoundException('Not found');
    // } else {
    //   console.log('Not found data source');
    //   throw new NotFoundException('Not found data source');
    // }
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

    let superAdmin: User[] = admin.children;
    superAdmin = superAdmin.filter(
      (sup) => sup.profit !== 0 || sup.outstanding !== 0,
    );
    superAdmin.sort((a, b) => (a.profit > b.profit ? -1 : 1));

    return JSON.stringify(superAdmin);
  }

  async getMasters(startDate: string, endDate: string) {
    const admin = JSON.parse(
      await this.getWinLose(startDate, endDate, 'admin'),
    );

    const supers = admin.children;
    let masters: User[] = [];

    // console.log(masters);

    supers.forEach((sup: User) => {
      masters = masters.concat(sup.children);
    });

    masters = masters.filter(
      (master) => master.profit !== 0 || master.outstanding !== 0,
    );
    masters.sort((a, b) => (a.profit > b.profit ? -1 : 1));
    return JSON.stringify(masters);
  }

  async getAgents(startDate: string, endDate: string) {
    const admin = JSON.parse(
      await this.getWinLose(startDate, endDate, 'admin'),
    );

    let agents: User[] = [];

    admin.children.forEach((sup: User) => {
      sup.children.forEach((master: User) => {
        agents = agents.concat(master.children);
      });
    });
    agents = agents.filter(
      (agent) => agent.profit !== 0 || agent.outstanding !== 0,
    );
    agents.sort((a, b) => (a.profit > b.profit ? -1 : 1));
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
  private async getUserData(uuid: string) {
    const url = `${this.baseUrl}/partner/user/index?api_key=${this.apiKey}&uuid=${uuid}&type=1`;

    // console.log(url);

    try {
      const response = await fetch(url);
      const data = await response.json();
      // console.log(data);
      return data.data[0];
    } catch (error) {
      console.error('Error loading data:', error);
      return null; // return null or handle error as needed
    } finally {
    }
  }

  private findUser(listAdmins: User[], userName: string): User | undefined {
    for (const admin of listAdmins) {
      if (admin.username === userName || admin.full_name === userName) {
        return admin;
      }
      for (const superAdmin of admin.children) {
        if (
          superAdmin.username === userName ||
          superAdmin.full_name === userName
        ) {
          return superAdmin;
        }
        for (const master of superAdmin.children) {
          if (master.username === userName || master.full_name === userName) {
            return master;
          }
          for (const agent of master.children) {
            if (agent.username === userName || agent.full_name === userName) {
              return agent;
            }
            for (const member of agent.children) {
              if (
                member.username === userName ||
                member.full_name === userName
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
          this.fetchBetDataPage(i + 1, fromDate, toDate, type, userUuid),
        ),
      );

      const betData = results.flat(); // Kết hợp tất cả kết quả vào một mảng duy nhất

      console.log('bet data', betData);

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
            this.fetchBetDataPage(
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
        return {
          needUpdate: false,
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

    console.log(url);

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
        return []; // Trả về mảng rỗng nếu có lỗi
      });
  }

  private async parseData(
    listUsers: User[],
    betData: any[],
    uniqueDates: string[],
  ) {
    const date = new Date(this.createDateFromDateString(uniqueDates[0]));

    const weekInfo = this.getInfoFromDate(date);

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

      parent.children.forEach((child: any) => {
        profit += child.profit;
        companyCommission += child.companyCommission;
        adminCommission += child.adminCommission;
        superCommission += child.superCommission;
        masterCommission += child.masterCommission;
        agentCommission += child.agentCommission;
        outstanding += child.outstanding;
      });
      parent['profit'] = profit;
      parent['companyCommission'] = companyCommission;
      parent['adminCommission'] = adminCommission;
      parent['superCommission'] = superCommission;
      parent['masterCommission'] = masterCommission;
      parent['agentCommission'] = agentCommission;
      parent['outstanding'] = outstanding;

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
              acc + (master.profit * (80 - master.bidPercent)) / 100,
            0,
          ),
        );
      } else {
        parent['bidOutside'] = (parent.profit * (80 - parent.bidPercent)) / 100;
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
    console.log(dateString);

    const parts = dateString.split('-');
    if (parts.length !== 3) {
      throw new Error("Invalid date format. Use 'yyyy-mm-dd'.");
    }

    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Months are 0-based, so subtract 1
    const day = parseInt(parts[2]);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      throw new Error("Invalid date format. Use 'yyyy-mm-dd'.");
    }

    return new Date(year, month, day);
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
    const startDate = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startDate.getTime()) / 86400000);
    const weekNumber = Math.ceil((days + startDate.getDay() + 1) / 7);
    return weekNumber;
  }

  private getStartAndEndDateOfWeek(weekNumber: number, year: number) {
    if (weekNumber < 1 || weekNumber > 53) {
      throw new Error('Invalid week number. Week should be between 1 and 53.');
    }

    const january4th = new Date(year, 0, 4); // January is month 0
    const daysToFirstThursday = 4 - january4th.getDay();
    january4th.setDate(january4th.getDate() + daysToFirstThursday);

    const startDate = new Date(january4th);
    startDate.setDate(startDate.getDate() + (weekNumber - 1) * 7);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 0);

    // Ensure the start date is a Monday (1) and the end date is a Sunday (0).
    while (startDate.getDay() !== 1) {
      startDate.setDate(startDate.getDate() - 1);
    }

    while (endDate.getDay() !== 0) {
      endDate.setDate(endDate.getDate() + 1);
    }

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
}
