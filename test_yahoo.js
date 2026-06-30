async function testYahoo() {
  const ticker = 'PETR4.SA';
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=5y&interval=1mo`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Yahoo Finance API result:", data.chart.result[0].meta.symbol);
    console.log("First timestamp:", new Date(data.chart.result[0].timestamp[0] * 1000));
    console.log("First close price:", data.chart.result[0].indicators.quote[0].close[0]);
  } catch(e) {
    console.error(e);
  }
}
testYahoo();
