async function test() {
  const res = await fetch('https://brapi.dev/api/quote/ITUB4?modules=balanceSheetHistory');
  const data = await res.json();
  const history = data.results[0]?.balanceSheetHistory?.balanceSheetStatements || [];
  console.log("Datas do Balanço:", history.map(b => b.endDate));
}
test();
