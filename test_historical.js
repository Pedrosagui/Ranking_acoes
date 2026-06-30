async function testHistorical() {
  const token = 'j9AenuWTpLNEGCKi8fbEwn';
  const url = `https://brapi.dev/api/v2/stocks/historical?symbols=BBAS3&range=5y&interval=1mo&token=${token}`;
  
  try {
    const res = await fetch(url);
    console.log("Status:", res.status);
    if (res.ok) {
      const data = await res.json();
      console.log("History length:", data.results[0].historicalDataPrice.length);
      console.log("First record:", data.results[0].historicalDataPrice[0]);
    } else {
      console.log("Error:", await res.text());
    }
  } catch(e) {
    console.error(e);
  }
}
testHistorical();
