import { BetItem, User } from '../report/dto';

async function getWinLoseTest(
  // startDate: string,
  // endDate: string,
  // userName: string,
  betFullData: BetItem[],
  listAdmins: User[],
) {
  // const startDate = '2024-03-15';
  const endDate = '2024-03-15';
  const userName = 'admin';
  console.log('endDate: ' + endDate);

  // const uniqueDatesSearch = this.generateDateRange(startDate, endDate);

  // console.log('range date', uniqueDatesSearch);

  // const date = new Date(this.createDateFromDateString(endDate));

  // const weekInfo = this.getWeekOfDate(date);
  // console.log(weekInfo);

  const user: User = findUser(listAdmins, userName);
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
        const listNumber = [];

        data[betType].forEach((bet: BetItem) => {
          point += bet.point;
          amount += bet.amount;

          let number = bet.number[0];

          bet.number = bet.number.sort((a, b) => parseInt(a) - parseInt(b));

          if (bet.number.length === 2) {
            number = bet.number[0] + '-' + bet.number[1];
          } else if (bet.number.length === 3) {
            number = bet.number[0] + '-' + bet.number[1] + '-' + bet.number[2];
          } else if (bet.number.length === 4) {
            number =
              bet.number[0] +
              '-' +
              bet.number[1] +
              '-' +
              bet.number[2] +
              '-' +
              bet.number[3];
          }

          const numberData = listNumber.find((n) => n.number === number);
          if (numberData) {
            numberData.point += bet.point;
            numberData.amount += bet.amount;
          } else {
            listNumber.push({
              number: number,
              point: bet.point,
              amount: bet.amount,
            });
          }
        });

        summary[betType] = {
          point: point,
          amount: amount,
          listNumber: listNumber.sort((a, b) => a.number - b.number),
        };
      }

      return summary;
    };

    const summarizedNumbers = summarizeNumbersByBetType(categorizedList);
    // console.log(categorizedList);

    user['line'] = line;
    user['title'] = title;
    user['list_children'] = listChildren.filter(
      (child) => child.profit !== 0 || child.outstanding !== 0,
    );
    user['data_bet'] = summarizedNumbers;

    // console.log(user['data']);

    return JSON.stringify(user);
  }
  return null;
}

function findUser(listAdmins: User[], userName: string): User | undefined {
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

async function getWinLoseCron(
  startDate: string,
  endDate: string,
  prismaService: any,
) {
  console.log(`Current date: ${getCurrentDateString()}`);

  // const currentDateString = `${year}-${month}-${day}`;

  const uniqueDatesSearch = generateDateRange(startDate, endDate);
  console.log(uniqueDatesSearch);

  // let betFullData: BetItem[] = [];
  for (let i = 0; i < uniqueDatesSearch.length; i++) {
    const date = uniqueDatesSearch[i];
    console.log('*******************\nChecking data date: ' + date);

    // let hasResultBet = false;

    let dataDate = await prismaService.data.findUnique({
      where: {
        date: date,
      },
    });

    // console.log(`${date} - ${JSON.stringify(dataDate)}`);,

    if (!dataDate) {
      dataDate = {
        date: date,
        lastTotalPage: 1,
        lastTotalRow: -1,
        data: null,
        adminDataToDay: null,
        adminDataThisWeek: null,
        adminDataTet: null,
        done: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    let lastData = JSON.parse(dataDate.data);

    if (!dataDate.data || dataDate.data === 'null' || dataDate.data === '[]') {
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

        const currentDataDate = await prismaService.data.findUnique({
          where: {
            date: date,
          },
        });

        if (currentDataDate) {
          await prismaService.data.update({
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
          await prismaService.data.create({
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

      let currentDataDate = await prismaService.data.findUnique({
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
          adminDataTet: null,
          done: false,
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
              await prismaService.data.delete({
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

function getCurrentDateString(): string {
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

  return `${year}-${month}-${day}`;
}

function generateDateRange(startDate: string, endDate: string) {
  const dates = [];
  const currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

export default {
  getWinLoseTest,
  // getWinLoseCron,
};
