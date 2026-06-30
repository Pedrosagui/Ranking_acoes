async function testSpeed() {
  const token = 'j9AenuWTpLNEGCKi8fbEwn';
  for (let i = 0; i < 10; i++) {
    const url = `https://brapi.dev/api/quote/PETR4?modules=summaryProfile,financialData,defaultKeyStatistics&token=${token}`;
    const start = Date.now();
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`Failed at ${i}:`, res.status, await res.text());
      return;
    }
    console.log(`Success ${i} - ${Date.now() - start}ms`);
    await new Promise(r => setTimeout(r, 500));
  }
}
testSpeed();
