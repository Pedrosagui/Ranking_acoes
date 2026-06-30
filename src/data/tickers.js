// src/data/tickers.js
// Lista completa de ~150 principais ativos da B3
// Inclui IBOVESPA, IBrA, FIIs e blue chips mais líquidos

export const TICKERS_B3 = [
  // ── BANCOS & FINANCEIRAS ──────────────────────────────────────
  { ticker: 'ITUB4', empresa: 'Itaú Unibanco', setor: 'Financeiro' },
  { ticker: 'BBDC4', empresa: 'Bradesco', setor: 'Financeiro' },
  { ticker: 'BBAS3', empresa: 'Banco do Brasil', setor: 'Financeiro' },
  { ticker: 'SANB11', empresa: 'Santander Brasil', setor: 'Financeiro' },
  { ticker: 'BPAC11', empresa: 'BTG Pactual', setor: 'Financeiro' },
  { ticker: 'BRSR6', empresa: 'Banrisul', setor: 'Financeiro' },
  { ticker: 'ABCB4', empresa: 'ABC Brasil', setor: 'Financeiro' },
  { ticker: 'BMGB4', empresa: 'Banco BMG', setor: 'Financeiro' },
  { ticker: 'PINE4', empresa: 'Banco Pine', setor: 'Financeiro' },
  { ticker: 'BIDI11', empresa: 'Banco Inter', setor: 'Financeiro' },

  // ── SEGUROS & PREVIDÊNCIA ────────────────────────────────────
  { ticker: 'BBSE3', empresa: 'BB Seguridade', setor: 'Seguros' },
  { ticker: 'EGIE3', empresa: 'Engie Brasil', setor: 'Energia' },
  { ticker: 'CXSE3', empresa: 'Caixa Seguridade', setor: 'Seguros' },
  { ticker: 'IRBR3', empresa: 'IRB Brasil RE', setor: 'Seguros' },
  { ticker: 'PSSA3', empresa: 'Porto Seguro', setor: 'Seguros' },

  // ── PETRÓLEO & GÁS ───────────────────────────────────────────
  { ticker: 'PETR4', empresa: 'Petrobras PN', setor: 'Petróleo e Gás' },
  { ticker: 'PETR3', empresa: 'Petrobras ON', setor: 'Petróleo e Gás' },
  { ticker: 'PRIO3', empresa: 'PetroRio', setor: 'Petróleo e Gás' },
  { ticker: 'RECV3', empresa: 'PetroRecôncavo', setor: 'Petróleo e Gás' },
  { ticker: 'RRRP3', empresa: '3R Petroleum', setor: 'Petróleo e Gás' },
  { ticker: 'UGPA3', empresa: 'Ultrapar', setor: 'Petróleo e Gás' },

  // ── MINERAÇÃO & SIDERURGIA ───────────────────────────────────
  { ticker: 'VALE3', empresa: 'Vale', setor: 'Mineração' },
  { ticker: 'CSNA3', empresa: 'CSN', setor: 'Siderurgia' },
  { ticker: 'GGBR4', empresa: 'Gerdau PN', setor: 'Siderurgia' },
  { ticker: 'GGBR3', empresa: 'Gerdau ON', setor: 'Siderurgia' },
  { ticker: 'USIM5', empresa: 'Usiminas PNA', setor: 'Siderurgia' },
  { ticker: 'CMIN3', empresa: 'CSN Mineração', setor: 'Mineração' },

  // ── ENERGIA ELÉTRICA ────────────────────────────────────────
  { ticker: 'ELET3', empresa: 'Eletrobras ON', setor: 'Energia' },
  { ticker: 'ELET6', empresa: 'Eletrobras PNB', setor: 'Energia' },
  { ticker: 'CPFE3', empresa: 'CPFL Energia', setor: 'Energia' },
  { ticker: 'ENGI11', empresa: 'Energisa', setor: 'Energia' },
  { ticker: 'EQTL3', empresa: 'Equatorial', setor: 'Energia' },
  { ticker: 'TAEE11', empresa: 'Taesa', setor: 'Energia' },
  { ticker: 'TRPL4', empresa: 'Transmissão Paulista', setor: 'Energia' },
  { ticker: 'CPLE6', empresa: 'Copel', setor: 'Energia' },
  { ticker: 'CMIG4', empresa: 'Cemig PN', setor: 'Energia' },
  { ticker: 'CMIG3', empresa: 'Cemig ON', setor: 'Energia' },
  { ticker: 'AURE3', empresa: 'Auren Energia', setor: 'Energia' },
  { ticker: 'ENBR3', empresa: 'EDP Brasil', setor: 'Energia' },
  { ticker: 'NEOE3', empresa: 'Neoenergia', setor: 'Energia' },

  // ── TELECOMUNICAÇÕES ────────────────────────────────────────
  { ticker: 'VIVT3', empresa: 'Vivo (Telefônica)', setor: 'Telecom' },
  { ticker: 'TIMS3', empresa: 'TIM', setor: 'Telecom' },

  // ── SANEAMENTO ──────────────────────────────────────────────
  { ticker: 'SBSP3', empresa: 'Sabesp', setor: 'Saneamento' },
  { ticker: 'SAPR11', empresa: 'Sanepar', setor: 'Saneamento' },
  { ticker: 'CSMG3', empresa: 'Copasa', setor: 'Saneamento' },
  { ticker: 'AEGP3', empresa: 'Aegea Saneamento', setor: 'Saneamento' },

  // ── LOGÍSTICA & INFRAESTRUTURA ───────────────────────────────
  { ticker: 'RAIL3', empresa: 'Rumo', setor: 'Logística' },
  { ticker: 'CCRO3', empresa: 'CCR', setor: 'Logística' },
  { ticker: 'ECOR3', empresa: 'EcoRodovias', setor: 'Logística' },
  { ticker: 'TGMA3', empresa: 'Tegma', setor: 'Logística' },
  { ticker: 'POMO3', empresa: 'Marcopolo ON', setor: 'Logística' },
  { ticker: 'POMO4', empresa: 'Marcopolo PN', setor: 'Logística' },

  // ── AVIAÇÃO ─────────────────────────────────────────────────
  { ticker: 'AZUL4', empresa: 'Azul', setor: 'Aviação' },
  { ticker: 'GOLL4', empresa: 'Gol', setor: 'Aviação' },

  // ── VAREJO ──────────────────────────────────────────────────
  { ticker: 'MGLU3', empresa: 'Magazine Luiza', setor: 'Varejo' },
  { ticker: 'LREN3', empresa: 'Lojas Renner', setor: 'Varejo' },
  { ticker: 'PCAR3', empresa: 'GPA (Pão de Açúcar)', setor: 'Varejo' },
  { ticker: 'CRFB3', empresa: 'Carrefour Brasil', setor: 'Varejo' },
  { ticker: 'NTCO3', empresa: 'Grupo Natura', setor: 'Varejo' },
  { ticker: 'SOMA3', empresa: 'Grupo Soma', setor: 'Varejo' },
  { ticker: 'AMAR3', empresa: 'Marisa', setor: 'Varejo' },
  { ticker: 'CEAB3', empresa: 'C&A', setor: 'Varejo' },
  { ticker: 'VIVA3', empresa: 'Vivara', setor: 'Varejo' },
  { ticker: 'ARZZ3', empresa: 'Arezzo', setor: 'Varejo' },
  { ticker: 'SBFG3', empresa: 'SBF Group (Centauro)', setor: 'Varejo' },

  // ── ALIMENTOS & BEBIDAS ──────────────────────────────────────
  { ticker: 'ABEV3', empresa: 'Ambev', setor: 'Alimentos e Bebidas' },
  { ticker: 'BEEF3', empresa: 'Minerva Foods', setor: 'Alimentos e Bebidas' },
  { ticker: 'BRFS3', empresa: 'BRF', setor: 'Alimentos e Bebidas' },
  { ticker: 'MRFG3', empresa: 'Marfrig', setor: 'Alimentos e Bebidas' },
  { ticker: 'JBSS3', empresa: 'JBS', setor: 'Alimentos e Bebidas' },
  { ticker: 'SMTO3', empresa: 'São Martinho', setor: 'Alimentos e Bebidas' },
  { ticker: 'RAIZ4', empresa: 'Raízen', setor: 'Alimentos e Bebidas' },

  // ── SAÚDE ────────────────────────────────────────────────────
  { ticker: 'RDOR3', empresa: 'Rede D\'Or', setor: 'Saúde' },
  { ticker: 'HAPV3', empresa: 'Hapvida', setor: 'Saúde' },
  { ticker: 'FLRY3', empresa: 'Fleury', setor: 'Saúde' },
  { ticker: 'DASA3', empresa: 'Dasa', setor: 'Saúde' },
  { ticker: 'GNDI3', empresa: 'Intermédica', setor: 'Saúde' },
  { ticker: 'QUAL3', empresa: 'Qualicorp', setor: 'Saúde' },

  // ── CONSTRUÇÃO CIVIL ────────────────────────────────────────
  { ticker: 'CYRE3', empresa: 'Cyrela', setor: 'Construção Civil' },
  { ticker: 'MRVE3', empresa: 'MRV Engenharia', setor: 'Construção Civil' },
  { ticker: 'DIRR3', empresa: 'Direcional', setor: 'Construção Civil' },
  { ticker: 'EVEN3', empresa: 'Even Construtora', setor: 'Construção Civil' },
  { ticker: 'EZTC3', empresa: 'EZTEC', setor: 'Construção Civil' },
  { ticker: 'TRIS3', empresa: 'Trisul', setor: 'Construção Civil' },
  { ticker: 'PLPL3', empresa: 'Plano & Plano', setor: 'Construção Civil' },

  // ── INDÚSTRIA & MÁQUINAS ────────────────────────────────────
  { ticker: 'WEGE3', empresa: 'WEG', setor: 'Indústria' },
  { ticker: 'EMBR3', empresa: 'Embraer', setor: 'Indústria' },
  { ticker: 'ROMI3', empresa: 'Indústrias Romi', setor: 'Indústria' },
  { ticker: 'FRAS3', empresa: 'Fras-le', setor: 'Indústria' },
  { ticker: 'MYPK3', empresa: 'Iochpe-Maxion', setor: 'Indústria' },
  { ticker: 'RAPT4', empresa: 'Randon', setor: 'Indústria' },
  { ticker: 'TUPY3', empresa: 'Tupy', setor: 'Indústria' },

  // ── PAPEL & CELULOSE ────────────────────────────────────────
  { ticker: 'SUZB3', empresa: 'Suzano', setor: 'Papel e Celulose' },
  { ticker: 'KLBN11', empresa: 'Klabin', setor: 'Papel e Celulose' },

  // ── TECNOLOGIA & TELECOM ────────────────────────────────────
  { ticker: 'TOTS3', empresa: 'Totvs', setor: 'Tecnologia' },
  { ticker: 'LWSA3', empresa: 'Locaweb', setor: 'Tecnologia' },
  { ticker: 'INTB3', empresa: 'Intelbras', setor: 'Tecnologia' },
  { ticker: 'CASH3', empresa: 'Méliuz', setor: 'Tecnologia' },
  { ticker: 'POSI3', empresa: 'Positivo', setor: 'Tecnologia' },

  // ── MERCADO DE CAPITAIS & OUTROS FINANCEIROS ────────────────
  { ticker: 'B3SA3', empresa: 'B3 S.A.', setor: 'Financeiro' },
  { ticker: 'CIEL3', empresa: 'Cielo', setor: 'Financeiro' },
  { ticker: 'WIZC3', empresa: 'Wiz Co', setor: 'Financeiro' },

  // ── AGRONEGÓCIO ─────────────────────────────────────────────
  { ticker: 'AGRO3', empresa: 'BrasilAgro', setor: 'Agronegócio' },
  { ticker: 'SLCE3', empresa: 'SLC Agrícola', setor: 'Agronegócio' },
  { ticker: 'CAML3', empresa: 'Camil', setor: 'Agronegócio' },

  // ── SHOPPING & IMOBILIÁRIO ──────────────────────────────────
  { ticker: 'MULT3', empresa: 'Multiplan', setor: 'Imobiliário' },
  { ticker: 'IGTI11', empresa: 'Iguatemi', setor: 'Imobiliário' },
  { ticker: 'ALUP11', empresa: 'Alupar', setor: 'Energia' },
  { ticker: 'BRPR3', empresa: 'BR Properties', setor: 'Imobiliário' },
  { ticker: 'CURY3', empresa: 'Cury Construtora', setor: 'Construção Civil' },


  // ── OUTROS SETORES ───────────────────────────────────────────
  { ticker: 'RADL3', empresa: 'Raia Drogasil', setor: 'Saúde' },
  { ticker: 'ODPV3', empresa: 'Odontoprev', setor: 'Saúde' },
  { ticker: 'CGAS5', empresa: 'Comgás', setor: 'Utilidades' },
  { ticker: 'TTEN3', empresa: 'Três Tentos', setor: 'Agronegócio' },
  { ticker: 'LAVV3', empresa: 'Lavvi', setor: 'Construção Civil' },
  { ticker: 'SIMH3', empresa: 'Simpar', setor: 'Logística' },
];

export const SETORES = [...new Set(TICKERS_B3.map(t => t.setor))].sort();
