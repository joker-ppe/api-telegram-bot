import { JSDOM } from 'jsdom';

const getResultXsmb = async (): Promise<void> => {
  fetch('https://xoso.com.vn/')
    .then((response) => response.text())
    .then((data) => {
      // Process the fetched data here
      // Create a new DOMParser
      const dom = new JSDOM(data);
      // Use the DOMParser to parse the HTML string into a Document object
      const document = dom.window.document;

      const tableResult = document.querySelector('.table-result');

      const prizeDB = tableResult.querySelector('#mb_prizeDB_item0').innerHTML;
      console.log(prizeDB);

      const prize1 = tableResult.querySelector('#mb_prize1_item0').innerHTML;
      console.log(prize1);

      const prize2Item0 =
        tableResult.querySelector('#mb_prize2_item0').innerHTML;
      const prize2Item1 =
        tableResult.querySelector('#mb_prize2_item1').innerHTML;
      console.log(prize2Item0, prize2Item1);

      const prize3Item0 =
        tableResult.querySelector('#mb_prize3_item0').innerHTML;
      const prize3Item1 =
        tableResult.querySelector('#mb_prize3_item1').innerHTML;
      const prize3Item2 =
        tableResult.querySelector('#mb_prize3_item2').innerHTML;
      const prize3Item3 =
        tableResult.querySelector('#mb_prize3_item3').innerHTML;
      const prize3Item4 =
        tableResult.querySelector('#mb_prize3_item4').innerHTML;
      const prize3Item5 =
        tableResult.querySelector('#mb_prize3_item5').innerHTML;

      console.log(
        prize3Item0,
        prize3Item1,
        prize3Item2,
        prize3Item3,
        prize3Item4,
        prize3Item5,
      );

      const prize4Item0 =
        tableResult.querySelector('#mb_prize4_item0').innerHTML;
      const prize4Item1 =
        tableResult.querySelector('#mb_prize4_item1').innerHTML;
      const prize4Item2 =
        tableResult.querySelector('#mb_prize4_item2').innerHTML;
      const prize4Item3 =
        tableResult.querySelector('#mb_prize4_item3').innerHTML;

      console.log(prize4Item0, prize4Item1, prize4Item2, prize4Item3);

      const prize5Item0 =
        tableResult.querySelector('#mb_prize5_item0').innerHTML;
      const prize5Item1 =
        tableResult.querySelector('#mb_prize5_item1').innerHTML;
      const prize5Item2 =
        tableResult.querySelector('#mb_prize5_item2').innerHTML;
      const prize5Item3 =
        tableResult.querySelector('#mb_prize5_item3').innerHTML;
      const prize5Item4 =
        tableResult.querySelector('#mb_prize5_item4').innerHTML;
      const prize5Item5 =
        tableResult.querySelector('#mb_prize5_item5').innerHTML;

      console.log(
        prize5Item0,
        prize5Item1,
        prize5Item2,
        prize5Item3,
        prize5Item4,
        prize5Item5,
      );

      const prize6Item0 =
        tableResult.querySelector('#mb_prize6_item0').innerHTML;
      const prize6Item1 =
        tableResult.querySelector('#mb_prize6_item1').innerHTML;
      const prize6Item2 =
        tableResult.querySelector('#mb_prize6_item2').innerHTML;

      console.log(prize6Item0, prize6Item1, prize6Item2);

      const prize7Item0 =
        tableResult.querySelector('#mb_prize7_item0').innerHTML;
      const prize7Item1 =
        tableResult.querySelector('#mb_prize7_item1').innerHTML;
      const prize7Item2 =
        tableResult.querySelector('#mb_prize7_item2').innerHTML;
      const prize7Item3 =
        tableResult.querySelector('#mb_prize7_item3').innerHTML;

      console.log(prize7Item0, prize7Item1, prize7Item2, prize7Item3);
    })
    .catch((error) => {
      // Handle any errors that occurred during the fetch
      console.error(error);
    });
};

export default {
  getResultXsmb,
};
