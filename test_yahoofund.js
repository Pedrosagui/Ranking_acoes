async function testYahooFund() {
  const ticker = 'BBAS3.SA';
  // v7/finance/quote provides basic quote info, including eps and bookValue sometimes.
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ticker}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const result = data.quoteResponse.result[0];
    console.log("Ticker:", result.symbol);
    console.log("EPS (LPA):", result.epsTrailingTwelveMonths);
    console.log("Book Value (VPA):", result.bookValue);
    console.log("Trailing PE:", result.trailingPE);
    console.log("Price to Book:", result.priceToBook);
  } catch(e) {
    console.error(e);
  }
}
testYahooFund();
