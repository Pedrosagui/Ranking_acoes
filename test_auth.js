async function testAuth() {
  const token = 'j9AenuWTpLNEGCKi8fbEwn';
  const url = `https://brapi.dev/api/quote/PETR4?modules=summaryProfile,financialData,defaultKeyStatistics`;
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Results length:", data.results.length);
  } catch(e) {
    console.error(e);
  }
}
testAuth();
