const fetch = require('node-fetch');

async function testBrapi() {
  const url = 'https://brapi.dev/api/quote/ITUB4?modules=summaryProfile,financialData,defaultKeyStatistics';
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Data:", JSON.stringify(data).substring(0, 500));
  } catch (err) {
    console.error("Error:", err);
  }
}

testBrapi();
