async function testBBAS3NoModules() {
  const token = 'j9AenuWTpLNEGCKi8fbEwn';
  const url = `https://brapi.dev/api/quote/BBAS3?token=${token}`;
  
  try {
    const res = await fetch(url);
    console.log("Status without modules:", res.status);
    if (res.ok) {
      const data = await res.json();
      const item = data.results[0];
      console.log("BBAS3 Price:", item.regularMarketPrice);
      console.log("BBAS3 EPS:", item.eps);
      console.log("BBAS3 BookValue:", item.bookValue);
    } else {
      console.log("Error:", await res.text());
    }
  } catch(e) {
    console.error(e);
  }
}
testBBAS3NoModules();
