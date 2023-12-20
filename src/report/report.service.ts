import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { BetItem, User } from './dto';

@Injectable()
export class ReportService implements OnModuleInit {
  private baseUrl: string;
  private apiKey: string;

  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    this.baseUrl = await this.getBaseUrlFromDatabase();
    this.apiKey = await this.getApiKeyFromDatabase();
  }

  async getWinLose(
    startDate: string,
    endDate: string,
    userCode: string,
    userName: string,
  ) {
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

    const parts = formatter.formatToParts(currentDate);

    const year = parts.find((part) => part.type === 'year').value;
    const month = parts.find((part) => part.type === 'month').value;
    const day = parts.find((part) => part.type === 'day').value;
    const hour = parts.find((part) => part.type === 'hour').value;
    const minute = parts.find((part) => part.type === 'minute').value;

    console.log(`Current date: ${formattedDate}`);

    const currentDateString = `${year}-${month}-${day}`;

    let betFullData: BetItem[] = [];
    for (let i = 0; i < uniqueDatesSearch.length; i++) {
      const date = uniqueDatesSearch[i];
      let hasData = true;
      let dataDate = await this.prismaService.data.findUnique({
        where: {
          date: date,
        },
      });

      if (!dataDate) {
        hasData = false;
        dataDate = {
          date: date,
          data: null,
        };
      }

      if (date === currentDateString) {
        if (!dataDate.data || dataDate.data === 'null') {
          // console.log(`${hour} - ${minute}`);

          const betData = await this.getBetData(date, date);
          dataDate.data = JSON.stringify(betData);

          if (
            (parseInt(hour) === 18 && parseInt(minute) > 40) ||
            parseInt(hour) > 18
          ) {
            if (hasData) {
              await this.prismaService.data.update({
                where: {
                  date: date,
                },
                data: {
                  data: JSON.stringify(betData),
                },
              });
            } else {
              await this.prismaService.data.create({
                data: {
                  date: date,
                  data: JSON.stringify(betData),
                },
              });
            }
          }
        }
      } else {
        if (!dataDate.data || dataDate.data === 'null') {
          const betData = await this.getBetData(date, date);
          if (hasData) {
            await this.prismaService.data.update({
              where: {
                date: date,
              },
              data: {
                data: JSON.stringify(betData),
              },
            });
          } else {
            await this.prismaService.data.create({
              data: {
                date: date,
                data: JSON.stringify(betData),
              },
            });
          }
          dataDate.data = JSON.stringify(betData);
        }
      }

      // Thêm dữ liệu vào mảng betFullData
      if (dataDate.data) {
        betFullData = betFullData.concat(JSON.parse(dataDate.data));
      }
    }

    const listUsers: User[] = await this.getListUsers();

    // return listUsers;

    if (betFullData && listUsers) {
      const uniqueDates: string[] = Array.from(
        new Set(betFullData.map((record: BetItem) => record.term)),
      );
      uniqueDates.sort((a, b) => a.localeCompare(b));

      const listAdmins: User[] = await this.parseData(
        listUsers,
        betFullData,
        uniqueDates,
      );

      //   let user: User = null;
      //   return listAdmins;
      console.log('userCode: ' + userCode);

      const user = this.findUser(listAdmins, userCode, userName);
      if (user) {
        user.children.length = 0;

        console.log(user.full_name);

        return JSON.stringify(user);
      }

      console.log('Not found');
      throw new NotFoundException('Not found');
    } else {
      console.log('Not found data source');
      throw new NotFoundException('Not found data source');
    }
  }

  private findUser(
    listAdmins: User[],
    userCode: string,
    userName: string,
  ): User | undefined {
    for (const admin of listAdmins) {
      if (admin.username === userCode || admin.full_name === userName) {
        return admin;
      }
      for (const superAdmin of admin.children) {
        if (
          superAdmin.username === userCode ||
          superAdmin.full_name === userName
        ) {
          return superAdmin;
        }
        for (const master of superAdmin.children) {
          if (master.username === userCode || master.full_name === userName) {
            return master;
          }
          for (const agent of master.children) {
            if (agent.username === userCode || agent.full_name === userName) {
              return agent;
            }
            for (const member of agent.children) {
              if (
                member.username === userCode ||
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
    const config = await this.getConfig();
    // console.log(JSON.stringify(users));

    const totalPage = config.optional.paging_info.total_page;
    console.log('users_page', totalPage);

    const rowCount = config.optional.paging_info.row_count;
    console.log('users', rowCount);

    try {
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

  private async getBetData(from_date: string, to_date: string) {
    const config = await this.getConfigBet(from_date, to_date);
    // console.log(JSON.stringify(users));

    const totalPage = config.optional.paging_info.total_page;
    console.log('bet page', totalPage);

    const rowCount = config.optional.paging_info.row_count;
    console.log('bet record', rowCount);

    try {
      const results = await Promise.all(
        Array.from({ length: totalPage }, (_, i) =>
          this.fetchBetDataPage(i + 1, from_date, to_date),
        ),
      );

      const betData = results.flat(); // Kết hợp tất cả kết quả vào một mảng duy nhất

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

  private async getConfigBet(from_date: string, to_date: string) {
    const url = `${this.baseUrl}/partner/game/betLog?api_key=${this.apiKey}&from_date=${from_date}&to_date=${to_date}`;

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
    from_date: string,
    to_date: string,
  ) {
    // showLoadingIndicator(`lịch sử bet ${page}/${totalPage}`)
    // console.log(`lịch sử bet ${page}/${totalPage}`);

    const url = `${this.baseUrl}/partner/game/betLog?api_key=${this.apiKey}&from_date=${from_date}&to_date=${to_date}&p=${page}`;
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
      if (acc[item.term]) {
        // Cộng dồn 'amount' nếu 'term' đã tồn tại
        acc[item.term] += item.payout - item.amount;
      } else {
        // Nếu 'term' chưa tồn tại, khởi tạo với 'amount' của item hiện tại
        acc[item.term] = item.payout - item.amount;
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

      return `${day}/${month}/${year}`;
    };

    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    };
  }
}
