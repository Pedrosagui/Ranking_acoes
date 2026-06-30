async function testV2() {
  const token = 'j9AenuWTpLNEGCKi8fbEwn';
  
  // Test v2 quote with modules? Let's see if modules works on v2
  const url = `https://brapi.dev/api/v2/stocks/quote?symbols=PETR4&modules=summaryProfile,financialData,defaultKeyStatistics&token=${token}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(Object.keys(data.results[0]));
    console.log(data.results[0].defaultKeyStatistics);
  } catch(e) {
    console.error(e);
  }
}
testV2();
