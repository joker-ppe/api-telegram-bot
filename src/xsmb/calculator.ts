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

export default {
  getWinLoseTest,
};
