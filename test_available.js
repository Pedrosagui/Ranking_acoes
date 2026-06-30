async function testAvailable() {
  const url = `https://brapi.dev/api/available`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Total disponíveis:", data.stocks.length);
    console.log("Primeiros 10:", data.stocks.slice(0, 10));
    console.log("Contém POMO3?", data.stocks.includes('POMO3'));
    console.log("Contém BBDC3?", data.stocks.includes('BBDC3'));
  } catch(e) {
    console.error(e);
  }
}
testAvailable();
