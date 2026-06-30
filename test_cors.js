async function testCORS() {
  const token = 'j9AenuWTpLNEGCKi8fbEwn';
  const url = `https://brapi.dev/api/quote/PETR4?modules=financialData,defaultKeyStatistics&token=${token}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Origin': 'http://localhost:5173',
        'Referer': 'http://localhost:5173/'
      }
    });
    console.log("Status:", res.status);
    console.log("CORS headers:", res.headers.get('access-control-allow-origin'));
  } catch(e) {
    console.error(e);
  }
}
testCORS();
