async function testBrapi(token) {
  const url = `https://brapi.dev/api/quote/PETR4,VALE3,ITUB4?modules=summaryProfile,financialData,defaultKeyStatistics&token=${token}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log("Error status:", res.status);
      console.log(await res.text());
      return;
    }
    const data = await res.json();
    console.log("Success! Results length:", data.results.length);
  } catch (err) {
    console.error("Error:", err);
  }
}

testBrapi("j9AenuWTpLNEGCKi8fbEwn");
