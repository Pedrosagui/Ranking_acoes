import axios from 'axios';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

async function test() {
  const res = await axios.get('https://www.fundamentus.com.br/balancos.php?papel=ITUB4&tipo=1', {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    responseType: 'arraybuffer'
  });
  const html = iconv.decode(res.data, 'iso-8859-1');
  const $ = cheerio.load(html);
  
  const headers = [];
  $('table th').each((i, el) => {
    headers.push($(el).text().trim());
  });
  
  console.log("Colunas encontradas:", headers);
}
test();
