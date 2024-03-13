import { JSDOM } from 'jsdom';

const getResultXsmb = async () => {
  const date = getCurrentDate();
  // let date = getCurrentDate();
  // date = '10-3-2024';
  console.log(date);
  // https://az24.vn/xsmb-11-3-2024.html
  // https://api-xsmb.cyclic.app/api/v1
  const response = await fetch(`https://az24.vn/xsmb-${date}.html`);
  const data = await response.text();
  // Process the fetched data here
  // Create a new DOMParser
  const dom = new JSDOM(data);
  // Use the DOMParser to parse the HTML string into a Document object
  const document = dom.window.document;

  // const tableResult = document.querySelector('.table-result');

  const prizeDB = document
    .querySelector('.v-gdb')
    .innerHTML.replaceAll('...', '')
    .trim();
  // console.log(prizeDB);

  const prize1 = document
    .querySelector('.v-g1')
    .innerHTML.replaceAll('...', '')
    .trim();
  // console.log(prize1);

  const prize2Item0 = document
    .querySelector('.v-g2-0')
    .innerHTML.replaceAll('...', '')
    .trim();
  const prize2Item1 = document
    .querySelector('.v-g2-1')
    .innerHTML.replaceAll('...', '')
    .trim();
  // console.log(prize2Item0, prize2Item1);

  const prize3Item0 = document
    .querySelector('.v-g3-0')
    .innerHTML.replaceAll('...', '')
    .trim();
  const prize3Item1 = document
    .querySelector('.v-g3-1')
    .innerHTML.replaceAll('...', '')
    .trim();
  const prize3Item2 = document
    .querySelector('.v-g3-2')
    .innerHTML.replaceAll('...', '')
    .trim();
  const prize3Item3 = document
    .querySelector('.v-g3-3')
    .innerHTML.replaceAll('...', '')
    .trim();
  const prize3Item4 = document
    .querySelector('.v-g3-4')
    .innerHTML.replaceAll('...', '')
    .trim();
  const prize3Item5 = document
    .querySelector('.v-g3-5')
    .innerHTML.replaceAll('...', '')
    .trim();

  // console.log(
  //   prize3Item0,
  //   prize3Item1,
  //   prize3Item2,
  //   prize3Item3,
  //   prize3Item4,
  //   prize3Item5,
  // );

  const prize4Item0 = document
    .querySelector('.v-g4-0')
    .innerHTML.replaceAll('...', '')
    .trim();
  const prize4Item1 = document
    .querySelector('.v-g4-1')
    .innerHTML.replaceAll('...', '')
    .trim();
  const prize4Item2 = document
    .querySelector('.v-g4-2')
    .innerHTML.replaceAll('...', '')
    .trim();
  const prize4Item3 = document
    .querySelector('.v-g4-3')
    .innerHTML.replaceAll('...', '')
    .trim();

  // console.log(prize4Item0, prize4Item1, prize4Item2, prize4Item3);

  const prize5Item0 = document
    .querySelector('.v-g5-0')
    .innerHTML.replaceAll('...', '')
    .trim();
  const prize5Item1 = document
    .querySelector('.v-g5-1')
    .innerHTML.replaceAll('...', '')
    .trim();
  const prize5Item2 = document
    .querySelector('.v-g5-2')
    .innerHTML.replaceAll('...', '')
    .trim();
  const prize5Item3 = document
    .querySelector('.v-g5-3')
    .innerHTML.replaceAll('...', '')
    .trim();
  const prize5Item4 = document
    .querySelector('.v-g5-4')
    .innerHTML.replaceAll('...', '')
    .trim();
  const prize5Item5 = document
    .querySelector('.v-g5-5')
    .innerHTML.replaceAll('...', '')
    .trim();

  // console.log(
  //   prize5Item0,
  //   prize5Item1,
  //   prize5Item2,
  //   prize5Item3,
  //   prize5Item4,
  //   prize5Item5,
  // );

  const prize6Item0 = document
    .querySelector('.v-g6-0')
    .innerHTML.replaceAll('...', '')
    .trim();
  const prize6Item1 = document
    .querySelector('.v-g6-1')
    .innerHTML.replaceAll('...', '')
    .trim();
  const prize6Item2 = document
    .querySelector('.v-g6-2')
    .innerHTML.replaceAll('...', '')
    .trim();

  // console.log(prize6Item0, prize6Item1, prize6Item2);

  const prize7Item0 = document
    .querySelector('.v-g7-0')
    .innerHTML.replaceAll('...', '')
    .trim();
  const prize7Item1 = document
    .querySelector('.v-g7-1')
    .innerHTML.replaceAll('...', '')
    .trim();
  const prize7Item2 = document
    .querySelector('.v-g7-2')
    .innerHTML.replaceAll('...', '')
    .trim();
  const prize7Item3 = document
    .querySelector('.v-g7-3')
    .innerHTML.replaceAll('...', '')
    .replaceAll('<span class="cl-red"', '')
    .replaceAll('</span>', '')
    .trim();

  // console.log(prize7Item0, prize7Item1, prize7Item2, prize7Item3);

  // get results from data
  let ketQuaDeDau = '';
  let ketQuaDeDuoi = '';
  let ketQuaDeDauGiai1 = '';
  let ketQuaDeDuoiGiai1 = '';
  const ketQuaLoDau = [];
  const ketQuaLoDuoi = [];
  let ketQuaXien2 = [];
  let ketQuaXien3 = [];
  let ketQuaXien4 = [];

  if (prizeDB.length > 0) {
    ketQuaDeDau = getTwoFirstDigits(prizeDB);
    ketQuaDeDuoi = getTwoLastDigits(prizeDB);

    ketQuaLoDau.push(getTwoFirstDigits(prizeDB));
    ketQuaLoDuoi.push(getTwoLastDigits(prizeDB));
  }

  if (prize1.length > 0) {
    ketQuaDeDauGiai1 = getTwoFirstDigits(prize1);
    ketQuaDeDuoiGiai1 = getTwoLastDigits(prize1);

    ketQuaLoDau.push(getTwoFirstDigits(prize1));
    ketQuaLoDuoi.push(getTwoLastDigits(prize1));
  }

  if (prize2Item0.length > 0) {
    ketQuaLoDau.push(getTwoFirstDigits(prize2Item0));
    ketQuaLoDuoi.push(getTwoLastDigits(prize2Item0));
  }
  if (prize2Item1.length > 0) {
    ketQuaLoDau.push(getTwoFirstDigits(prize2Item1));
    ketQuaLoDuoi.push(getTwoLastDigits(prize2Item1));
  }

  if (prize3Item0.length > 0) {
    ketQuaLoDau.push(getTwoFirstDigits(prize3Item0));
    ketQuaLoDuoi.push(getTwoLastDigits(prize3Item0));
  }
  if (prize3Item1.length > 0) {
    ketQuaLoDau.push(getTwoFirstDigits(prize3Item1));
    ketQuaLoDuoi.push(getTwoLastDigits(prize3Item1));
  }
  if (prize3Item2.length > 0) {
    ketQuaLoDau.push(getTwoFirstDigits(prize3Item2));
    ketQuaLoDuoi.push(getTwoLastDigits(prize3Item2));
  }
  if (prize3Item3.length > 0) {
    ketQuaLoDau.push(getTwoFirstDigits(prize3Item3));
    ketQuaLoDuoi.push(getTwoLastDigits(prize3Item3));
  }
  if (prize3Item4.length > 0) {
    ketQuaLoDau.push(getTwoFirstDigits(prize3Item4));
    ketQuaLoDuoi.push(getTwoLastDigits(prize3Item4));
  }
  if (prize3Item5.length > 0) {
    ketQuaLoDau.push(getTwoFirstDigits(prize3Item5));
    ketQuaLoDuoi.push(getTwoLastDigits(prize3Item5));
  }

  if (prize4Item0.length > 0) {
    ketQuaLoDau.push(getTwoFirstDigits(prize4Item0));
    ketQuaLoDuoi.push(getTwoLastDigits(prize4Item0));
  }
  if (prize4Item1.length > 0) {
    ketQuaLoDau.push(getTwoFirstDigits(prize4Item1));
    ketQuaLoDuoi.push(getTwoLastDigits(prize4Item1));
  }
  if (prize4Item2.length > 0) {
    ketQuaLoDau.push(getTwoFirstDigits(prize4Item2));
    ketQuaLoDuoi.push(getTwoLastDigits(prize4Item2));
  }
  if (prize4Item3.length > 0) {
    ketQuaLoDau.push(getTwoFirstDigits(prize4Item3));
    ketQuaLoDuoi.push(getTwoLastDigits(prize4Item3));
  }

  if (prize5Item0.length > 0) {
    ketQuaLoDau.push(getTwoFirstDigits(prize5Item0));
    ketQuaLoDuoi.push(getTwoLastDigits(prize5Item0));
  }
  if (prize5Item1.length > 0) {
    ketQuaLoDau.push(getTwoFirstDigits(prize5Item1));
    ketQuaLoDuoi.push(getTwoLastDigits(prize5Item1));
  }
  if (prize5Item2.length > 0) {
    ketQuaLoDau.push(getTwoFirstDigits(prize5Item2));
    ketQuaLoDuoi.push(getTwoLastDigits(prize5Item2));
  }
  if (prize5Item3.length > 0) {
    ketQuaLoDau.push(getTwoFirstDigits(prize5Item3));
    ketQuaLoDuoi.push(getTwoLastDigits(prize5Item3));
  }
  if (prize5Item4.length > 0) {
    ketQuaLoDau.push(getTwoFirstDigits(prize5Item4));
    ketQuaLoDuoi.push(getTwoLastDigits(prize5Item4));
  }
  if (prize5Item5.length > 0) {
    ketQuaLoDau.push(getTwoFirstDigits(prize5Item5));
    ketQuaLoDuoi.push(getTwoLastDigits(prize5Item5));
  }

  if (prize6Item0.length > 0) {
    ketQuaLoDau.push(getTwoFirstDigits(prize6Item0));
    ketQuaLoDuoi.push(getTwoLastDigits(prize6Item0));
  }
  if (prize6Item1.length > 0) {
    ketQuaLoDau.push(getTwoFirstDigits(prize6Item1));
    ketQuaLoDuoi.push(getTwoLastDigits(prize6Item1));
  }
  if (prize6Item2.length > 0) {
    ketQuaLoDau.push(getTwoFirstDigits(prize6Item2));
    ketQuaLoDuoi.push(getTwoLastDigits(prize6Item2));
  }

  if (prize7Item0.length > 0) {
    ketQuaLoDau.push(getTwoFirstDigits(prize7Item0));
    ketQuaLoDuoi.push(getTwoLastDigits(prize7Item0));
  }
  if (prize7Item1.length > 0) {
    ketQuaLoDau.push(getTwoFirstDigits(prize7Item1));
    ketQuaLoDuoi.push(getTwoLastDigits(prize7Item1));
  }
  if (prize7Item2.length > 0) {
    ketQuaLoDau.push(getTwoFirstDigits(prize7Item2));
    ketQuaLoDuoi.push(getTwoLastDigits(prize7Item2));
  }
  if (prize7Item3.length > 0) {
    ketQuaLoDau.push(getTwoFirstDigits(prize7Item3));
    ketQuaLoDuoi.push(getTwoLastDigits(prize7Item3));
  }

  // ketQuaLoDuoi = ['22', '12', '02', '78', '45', '57'];
  // add results Xien 2
  ketQuaXien2 = getResultXien2(ketQuaLoDuoi);
  console.log({ ketQuaXien2: ketQuaXien2.length });
  // add results Xien 3
  ketQuaXien3 = getResultXien3(ketQuaLoDuoi);
  console.log({ ketQuaXien3: ketQuaXien3.length });
  // add results Xien 4
  ketQuaXien4 = getResultXien4(ketQuaLoDuoi);
  console.log({ ketQuaXien4: ketQuaXien4.length });

  return {
    date: date,
    prizeDb: prizeDB,
    prizeG1: prize1,
    prizeG2: [prize2Item0, prize2Item1].filter((item) => item !== ''),
    prizeG3: [
      prize3Item0,
      prize3Item1,
      prize3Item2,
      prize3Item3,
      prize3Item4,
      prize3Item5,
    ].filter((item) => item !== ''),
    prizeG4: [prize4Item0, prize4Item1, prize4Item2, prize4Item3].filter(
      (item) => item !== '',
    ),
    prizeG5: [
      prize5Item0,
      prize5Item1,
      prize5Item2,
      prize5Item3,
      prize5Item4,
      prize5Item5,
    ].filter((item) => item !== ''),
    prizeG6: [prize6Item0, prize6Item1, prize6Item2].filter(
      (item) => item !== '',
    ),
    prizeG7: [prize7Item0, prize7Item1, prize7Item2, prize7Item3].filter(
      (item) => item !== '',
    ),
    ketQuaDeDau: ketQuaDeDau,
    ketQuaDeDuoi: ketQuaDeDuoi,
    ketQuaDeDauGiai1: ketQuaDeDauGiai1,
    ketQuaDeDuoiGiai1: ketQuaDeDuoiGiai1,
    ketQuaLoDau: ketQuaLoDau,
    ketQuaLoDuoi: ketQuaLoDuoi,
    ketQuaXien2: ketQuaXien2,
    ketQuaXien3: ketQuaXien3,
    ketQuaXien4: ketQuaXien4,
  };
};

function getCurrentDate(): string {
  const date = new Date();
  const day = String(date.getDate()).padStart(1, '0');
  const month = String(date.getMonth() + 1).padStart(1, '0'); // Months are 0-based in JavaScript
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

function getCurrentDateFormatApi(): string {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based in JavaScript
  const year = date.getFullYear();

  return `${year}-${month}-${day}`;
}

function convertDateFormatApi(date: string): string {
  const [day, month, year] = date.split('-');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function getTwoLastDigits(str: string): string {
  return str.slice(-2);
}

function getTwoFirstDigits(str: string): string {
  return str.slice(0, 2);
}

// kiểm tra Đề Đầu
function checkDeDau(strNumber: string, result: string): boolean {
  return getTwoFirstDigits(strNumber) === getTwoFirstDigits(result);
}

// kiểm tra Đề Đuôi
function checkDeDuoi(strNumber: string, result: string): boolean {
  return getTwoLastDigits(strNumber) === getTwoLastDigits(result);
}

// kiểm tra Lô Đầu/ Đuôi
function checkLo(strNumber: string, results: string[]): number {
  let time = 0;
  for (let i = 0; i < results.length; i++) {
    if (strNumber === results[i]) {
      time++;
    }
  }
  return time;
}

// kiểm tra Lô Đuôi
// function checkLoDuoi(strNumber: string, results: string[]): number {
//   let time = 0;
//   for (let i = 0; i < results.length; i++) {
//     if (strNumber === results[i]) {
//       time++;
//     }
//   }
//   return time;
// }

// check xiên
function checkXien(strNumber: string, results: string[]) {
  for (let i = 0; i < results.length; i++) {
    if (strNumber === results[i]) {
      return true;
    }
  }
  return false;
}

// kiểm tra xiên 2
function checkXien2(
  strNumber1: string,
  strNumber2: string,
  results: string[],
): boolean {
  let resultNumber1 = false;
  let resultNumber2 = false;

  for (let i = 0; i < results.length; i++) {
    if (strNumber1 === results[i]) {
      resultNumber1 = true;
      break;
    }
  }
  for (let i = 0; i < results.length; i++) {
    if (strNumber2 === results[i]) {
      resultNumber2 = true;
      break;
    }
  }
  return resultNumber1 && resultNumber2;
}

// kiểm tra xiên 3
function checkXien3(
  strNumber1: string,
  strNumber2: string,
  strNumber3: string,
  results: Array<string>,
): boolean {
  let resultNumber1 = false;
  let resultNumber2 = false;
  let resultNumber3 = false;

  for (let i = 0; i < results.length; i++) {
    if (getTwoLastDigits(strNumber1) === getTwoLastDigits(results[i])) {
      resultNumber1 = true;
      break;
    }
  }
  for (let i = 0; i < results.length; i++) {
    if (getTwoLastDigits(strNumber2) === getTwoLastDigits(results[i])) {
      resultNumber2 = true;
      break;
    }
  }
  for (let i = 0; i < results.length; i++) {
    if (getTwoLastDigits(strNumber3) === getTwoLastDigits(results[i])) {
      resultNumber3 = true;
      break;
    }
  }
  return resultNumber1 && resultNumber2 && resultNumber3;
}

// kiểm tra xiên 4
function checkXien4(
  strNumber1: string,
  strNumber2: string,
  strNumber3: string,
  strNumber4: string,
  results: Array<string>,
): boolean {
  let resultNumber1 = false;
  let resultNumber2 = false;
  let resultNumber3 = false;
  let resultNumber4 = false;

  for (let i = 0; i < results.length; i++) {
    if (getTwoLastDigits(strNumber1) === getTwoLastDigits(results[i])) {
      resultNumber1 = true;
      break;
    }
  }
  for (let i = 0; i < results.length; i++) {
    if (getTwoLastDigits(strNumber2) === getTwoLastDigits(results[i])) {
      resultNumber2 = true;
      break;
    }
  }
  for (let i = 0; i < results.length; i++) {
    if (getTwoLastDigits(strNumber3) === getTwoLastDigits(results[i])) {
      resultNumber3 = true;
      break;
    }
  }
  for (let i = 0; i < results.length; i++) {
    if (getTwoLastDigits(strNumber4) === getTwoLastDigits(results[i])) {
      resultNumber4 = true;
      break;
    }
  }
  return resultNumber1 && resultNumber2 && resultNumber3 && resultNumber4;
}

function getResultXien2(ketQuaLoDuoi: Array<string>) {
  console.log({ ketQuaLoDuoiStart: ketQuaLoDuoi.length });
  ketQuaLoDuoi = ketQuaLoDuoi
    .filter((item, index) => ketQuaLoDuoi.indexOf(item) === index)
    .sort((a, b) => parseInt(a) - parseInt(b));
  console.log({ ketQuaLoDuoiEnd: ketQuaLoDuoi.length });
  if (ketQuaLoDuoi.length < 2) {
    return [];
  }
  let ketQuaXien2 = [];
  for (let i = 0; i < ketQuaLoDuoi.length - 1; i++) {
    for (let j = i + 1; j < ketQuaLoDuoi.length; j++) {
      ketQuaXien2.push(`${ketQuaLoDuoi[i]}-${ketQuaLoDuoi[j]}`);
    }
  }
  ketQuaXien2 = ketQuaXien2.filter(
    (item, index) => ketQuaXien2.indexOf(item) === index,
  );
  return ketQuaXien2;
}

function getResultXien3(ketQuaLoDuoi: Array<string>) {
  ketQuaLoDuoi = ketQuaLoDuoi
    .filter((item, index) => ketQuaLoDuoi.indexOf(item) === index)
    .sort((a, b) => parseInt(a) - parseInt(b));
  if (ketQuaLoDuoi.length < 3) {
    return [];
  }
  let ketQuaXien3 = [];
  for (let i = 0; i < ketQuaLoDuoi.length - 2; i++) {
    for (let j = i + 1; j < ketQuaLoDuoi.length - 1; j++) {
      for (let k = j + 1; k < ketQuaLoDuoi.length; k++) {
        ketQuaXien3.push(
          `${ketQuaLoDuoi[i]}-${ketQuaLoDuoi[j]}-${ketQuaLoDuoi[k]}`,
        );
      }
    }
  }
  ketQuaXien3 = ketQuaXien3.filter(
    (item, index) => ketQuaXien3.indexOf(item) === index,
  );
  return ketQuaXien3;
}

function getResultXien4(ketQuaLoDuoi: Array<string>) {
  ketQuaLoDuoi = ketQuaLoDuoi
    .filter((item, index) => ketQuaLoDuoi.indexOf(item) === index)
    .sort((a, b) => parseInt(a) - parseInt(b));
  if (ketQuaLoDuoi.length < 4) {
    return [];
  }
  let ketQuaXien4 = [];
  for (let i = 0; i < ketQuaLoDuoi.length - 3; i++) {
    for (let j = i + 1; j < ketQuaLoDuoi.length - 2; j++) {
      for (let k = j + 1; k < ketQuaLoDuoi.length - 1; k++) {
        for (let l = k + 1; l < ketQuaLoDuoi.length; l++) {
          ketQuaXien4.push(
            `${ketQuaLoDuoi[i]}-${ketQuaLoDuoi[j]}-${ketQuaLoDuoi[k]}-${ketQuaLoDuoi[l]}`,
          );
        }
      }
    }
  }
  ketQuaXien4 = ketQuaXien4.filter(
    (item, index) => ketQuaXien4.indexOf(item) === index,
  );
  return ketQuaXien4;
}

function getHourMinute() {
  const date = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };
  const formatter = new Intl.DateTimeFormat([], options);

  const timeParts = formatter.formatToParts(date);
  const currentHour = timeParts.find((part) => part.type === 'hour').value;
  const currentMinute = timeParts.find((part) => part.type === 'minute').value;

  return {
    currentHour: currentHour,
    currentMinute: currentMinute,
  };
}

export default {
  getResultXsmb,
  getTwoFirstDigits,
  getTwoLastDigits,
  checkDeDau,
  checkDeDuoi,
  checkLo,
  checkXien2,
  checkXien,
  checkXien3,
  checkXien4,
  convertDateFormatApi,
  getCurrentDateFormatApi,
  getCurrentDate,
  getHourMinute,
};
