import yahooFinancePkg from 'yahoo-finance2';
const yahooFinance = yahooFinancePkg.default || yahooFinancePkg;

async function test() {
  try {
    const quoteSummary = await yahooFinance.quoteSummary('ITUB4.SA', { 
      modules: ['balanceSheetHistory', 'incomeStatementHistory'] 
    });
    
    console.log("balanceSheetHistory:");
    console.log(quoteSummary.balanceSheetHistory?.balanceSheetStatements.map(b => b.endDate));
  } catch (err) {
    console.error(err);
  }
}
test();
