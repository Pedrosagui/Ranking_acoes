async function testBatch20() {
  const token = 'j9AenuWTpLNEGCKi8fbEwn';
  const url = `https://brapi.dev/api/quote/PETR4,VALE3,ITUB4,BBDC4,BBAS3,SANB11,BPAC11,BBSE3,PETR3,WEGE3,ABEV3,TAEE11,VIVT3,SUZB3,KLBN11,B3SA3,ELET3,RADL3,RENT3,HAPV3?modules=summaryProfile,financialData,defaultKeyStatistics&token=${token}`;
  try {
    const res = await fetch(url);
    console.log("Status:", res.status);
    if (!res.ok) {
      console.log(await res.text());
      return;
    }
    const data = await res.json();
    console.log("Results length:", data.results.length);
  } catch(e) {
    console.error(e);
  }
}
testBatch20();
