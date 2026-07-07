export const SECTORS = ["IT", "Banking", "Pharma", "Energy", "FMCG"];

export const STOCKS = [
  // IT
  { symbol: "TCS", name: "Tata Consultancy Services", sector: "IT", basePrice: 3500 },
  { symbol: "INFY", name: "Infosys", sector: "IT", basePrice: 1750 },
  { symbol: "WIPRO", name: "Wipro", sector: "IT", basePrice: 480 },
  { symbol: "HCLTECH", name: "HCL Technologies", sector: "IT", basePrice: 1600 },
  { symbol: "TECHM", name: "Tech Mahindra", sector: "IT", basePrice: 1350 },
  // Banking
  { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking", basePrice: 1700 },
  { symbol: "ICICIBANK", name: "ICICI Bank", sector: "Banking", basePrice: 1200 },
  { symbol: "SBIN", name: "State Bank of India", sector: "Banking", basePrice: 800 },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", sector: "Banking", basePrice: 1900 },
  { symbol: "AXISBANK", name: "Axis Bank", sector: "Banking", basePrice: 1150 },
  // Pharma
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical", sector: "Pharma", basePrice: 1650 },
  { symbol: "DRREDDY", name: "Dr. Reddy's Laboratories", sector: "Pharma", basePrice: 1250 },
  { symbol: "CIPLA", name: "Cipla", sector: "Pharma", basePrice: 1500 },
  { symbol: "DIVISLAB", name: "Divi's Laboratories", sector: "Pharma", basePrice: 5400 },
  { symbol: "AUROPHARMA", name: "Aurobindo Pharma", sector: "Pharma", basePrice: 1100 },
  // Energy
  { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy", basePrice: 2900 },
  { symbol: "ONGC", name: "ONGC", sector: "Energy", basePrice: 270 },
  { symbol: "NTPC", name: "NTPC", sector: "Energy", basePrice: 360 },
  { symbol: "POWERGRID", name: "Power Grid Corporation", sector: "Energy", basePrice: 320 },
  { symbol: "ADANIGREEN", name: "Adani Green Energy", sector: "Energy", basePrice: 1800 },
  // FMCG
  { symbol: "HINDUNILVR", name: "Hindustan Unilever", sector: "FMCG", basePrice: 2400 },
  { symbol: "ITC", name: "ITC", sector: "FMCG", basePrice: 460 },
  { symbol: "NESTLEIND", name: "Nestle India", sector: "FMCG", basePrice: 2300 },
  { symbol: "DABUR", name: "Dabur India", sector: "FMCG", basePrice: 530 },
  { symbol: "BRITANNIA", name: "Britannia Industries", sector: "FMCG", basePrice: 5200 },
];

// Price multipliers per minute [day][minute] per sector
// Format: { IT, Banking, Pharma, Energy, FMCG, base }
// base applies to all, sector applies on top

// NARRATIVE ARC:
// Day 1: Steady green, cautious optimism
// Day 2: IT & Banking explode - FOMO kicks in
// Day 3: Mixed signals, doubt creeps in
// Day 4: CRASH - IT & Banking collapse
// Day 5: Partial recovery but winners are Pharma & FMCG holders

export const NEWS_SCRIPT: {
  day: number;
  minute: number;
  headline: string;
  detail: string;
  impact: { [sector: string]: number }; // % change
}[] = [
  // ─── DAY 1: Cautious Green ───
  {
    day: 1, minute: 1,
    headline: "Markets open flat as global cues remain stable",
    detail: "Asian markets trade in a narrow range. Analysts expect a quiet session.",
    impact: { IT: 0.8, Banking: 0.6, Pharma: 0.5, Energy: 0.7, FMCG: 0.4 }
  },
  {
    day: 1, minute: 2,
    headline: "RBI holds interest rates steady — banking sector breathes easy",
    detail: "RBI MPC votes unanimously to hold repo rate. Banking stocks inch higher.",
    impact: { IT: 0.3, Banking: 1.8, Pharma: 0.2, Energy: 0.4, FMCG: 0.5 }
  },
  {
    day: 1, minute: 3,
    headline: "IT exports hit record high in Q2 — sector outlook upgraded",
    detail: "NASSCOM data shows 14% YoY growth. TCS and Infosys lead gains.",
    impact: { IT: 2.1, Banking: 0.4, Pharma: 0.3, Energy: 0.2, FMCG: 0.3 }
  },
  {
    day: 1, minute: 4,
    headline: "Crude oil prices dip 2% on demand concerns",
    detail: "WTI crude falls below $80. Energy stocks slide slightly.",
    impact: { IT: 0.2, Banking: 0.3, Pharma: 0.4, Energy: -1.5, FMCG: 0.6 }
  },
  {
    day: 1, minute: 5,
    headline: "FII inflows surge — Nifty poised for breakout",
    detail: "Foreign funds pour ₹4200 Cr into equities. Broad market rally building.",
    impact: { IT: 1.2, Banking: 1.4, Pharma: 0.8, Energy: 0.9, FMCG: 0.7 }
  },
  {
    day: 1, minute: 6,
    headline: "Day 1 closes with broad-based gains — sentiment turns bullish",
    detail: "All sectors end in green. Analysts predict strong follow-through tomorrow.",
    impact: { IT: 0.9, Banking: 0.8, Pharma: 0.6, Energy: 0.5, FMCG: 0.7 }
  },

  // ─── DAY 2: The Rally - FOMO Begins ───
  {
    day: 2, minute: 1,
    headline: "Gap-up opening! IT and Banking lead massive rally",
    detail: "Markets open 1.5% higher. IT stocks surge on US Fed pivot expectations.",
    impact: { IT: 3.2, Banking: 2.8, Pharma: 0.6, Energy: 1.1, FMCG: 0.5 }
  },
  {
    day: 2, minute: 2,
    headline: "BREAKING: US Fed signals rate cut — global markets euphoric",
    detail: "Powell hints at 3 rate cuts in 2025. Tech and financial stocks go parabolic.",
    impact: { IT: 4.5, Banking: 3.9, Pharma: 0.8, Energy: 1.4, FMCG: 0.6 }
  },
  {
    day: 2, minute: 3,
    headline: "TCS wins $2B mega deal — largest in company history",
    detail: "TCS announces landmark contract with European bank. Stock hits all-time high.",
    impact: { IT: 5.1, Banking: 1.2, Pharma: 0.4, Energy: 0.6, FMCG: 0.3 }
  },
  {
    day: 2, minute: 4,
    headline: "HDFC Bank Q3 profit surges 35% — analysts shocked",
    detail: "HDFC Bank beats estimates by massive margin. NPA ratios at decade low.",
    impact: { IT: 1.1, Banking: 4.8, Pharma: 0.5, Energy: 0.7, FMCG: 0.4 }
  },
  {
    day: 2, minute: 5,
    headline: "Retail investors pouring money in — market breadth at 10-year high",
    detail: "SIP inflows hit ₹22,000 Cr monthly record. Everyone is buying.",
    impact: { IT: 2.8, Banking: 2.6, Pharma: 1.2, Energy: 1.8, FMCG: 1.1 }
  },
  {
    day: 2, minute: 6,
    headline: "Day 2 closes at record highs — 'Bull run has just begun' say experts",
    detail: "Nifty up 3.8% in single session. TV anchors declare new era of growth.",
    impact: { IT: 2.1, Banking: 1.9, Pharma: 0.8, Energy: 1.2, FMCG: 0.9 }
  },

  // ─── DAY 3: Cracks Appear ───
  {
    day: 3, minute: 1,
    headline: "Markets open mixed — profit booking at highs",
    detail: "After two days of euphoria, some investors cash out. IT dips slightly.",
    impact: { IT: -1.2, Banking: -0.8, Pharma: 0.9, Energy: -0.5, FMCG: 1.1 }
  },
  {
    day: 3, minute: 2,
    headline: "Inflation data comes in higher than expected — rate cut hopes fade",
    detail: "CPI at 6.2% vs 5.8% expected. Markets confused — was the rally premature?",
    impact: { IT: -2.1, Banking: -2.8, Pharma: 0.7, Energy: -0.9, FMCG: 0.8 }
  },
  {
    day: 3, minute: 3,
    headline: "Reliance Industries announces massive capex — stock falls on concerns",
    detail: "₹75,000 Cr investment plan announced. Investors worried about near-term returns.",
    impact: { IT: -0.4, Banking: -0.6, Pharma: 0.5, Energy: -2.4, FMCG: 0.6 }
  },
  {
    day: 3, minute: 4,
    headline: "Sun Pharma gets USFDA approval for blockbuster drug",
    detail: "Pharma sector gets a shot in the arm. Defensive stocks attract buyers.",
    impact: { IT: -0.3, Banking: -0.4, Pharma: 3.8, Energy: -0.2, FMCG: 1.2 }
  },
  {
    day: 3, minute: 5,
    headline: "Rumours: Major IT company to miss quarterly estimates",
    detail: "Unconfirmed reports of weak guidance from top IT firm. Sector sells off.",
    impact: { IT: -2.8, Banking: -1.1, Pharma: 0.6, Energy: -0.4, FMCG: 0.9 }
  },
  {
    day: 3, minute: 6,
    headline: "Day 3 ends flat — bulls and bears in standoff",
    detail: "Volume thins out. Market awaits clarity. Defensive stocks outperform.",
    impact: { IT: -0.9, Banking: -0.7, Pharma: 1.1, Energy: -0.3, FMCG: 0.8 }
  },

  // ─── DAY 4: THE CRASH ───
  {
    day: 4, minute: 1,
    headline: "CIRCUIT BREAKER: Markets crash on global meltdown fears",
    detail: "Asian markets collapse overnight. Nifty opens 4% lower. Panic selling begins.",
    impact: { IT: -5.8, Banking: -6.2, Pharma: -1.2, Energy: -4.1, FMCG: -0.8 }
  },
  {
    day: 4, minute: 2,
    headline: "BREAKING: US economy enters technical recession — Dow futures -800 pts",
    detail: "GDP contracts for second consecutive quarter. Global risk-off mode triggers.",
    impact: { IT: -7.2, Banking: -5.8, Pharma: -0.9, Energy: -5.4, FMCG: -0.6 }
  },
  {
    day: 4, minute: 3,
    headline: "FII selling at record pace — ₹12,000 Cr outflows in single session",
    detail: "Foreign funds exit Indian markets. Rupee hits all-time low vs dollar.",
    impact: { IT: -4.1, Banking: -6.9, Pharma: -0.7, Energy: -3.8, FMCG: -0.5 }
  },
  {
    day: 4, minute: 4,
    headline: "HDFC Bank CEO resigns — governance scandal rocks banking sector",
    detail: "Shock resignation amid audit irregularities. Banking stocks in free fall.",
    impact: { IT: -2.3, Banking: -8.4, Pharma: -0.4, Energy: -2.1, FMCG: 0.8 }
  },
  {
    day: 4, minute: 5,
    headline: "Pharma & FMCG emerge as safe havens amid market carnage",
    detail: "Defensive sectors attract panic buyers. HUL, Sun Pharma buck the trend.",
    impact: { IT: -3.1, Banking: -4.2, Pharma: 2.8, Energy: -2.9, FMCG: 2.4 }
  },
  {
    day: 4, minute: 6,
    headline: "Day 4 bloodbath — IT down 18%, Banking down 22% from Day 2 peak",
    detail: "Worst single-day fall in 5 years. Those who didn't sell are praying.",
    impact: { IT: -4.2, Banking: -3.8, Pharma: 1.1, Energy: -3.4, FMCG: 1.3 }
  },

  // ─── DAY 5: Too Late for Most ───
  {
    day: 5, minute: 1,
    headline: "Dead cat bounce — markets attempt recovery after historic crash",
    detail: "Bargain hunters cautiously enter. But is it too early?",
    impact: { IT: 2.1, Banking: 2.4, Pharma: 0.8, Energy: 1.6, FMCG: 0.5 }
  },
  {
    day: 5, minute: 2,
    headline: "Government announces ₹50,000 Cr stimulus package",
    detail: "Fiscal boost announced for infrastructure. Energy and FMCG cheer.",
    impact: { IT: 1.4, Banking: 1.8, Pharma: 1.2, Energy: 3.2, FMCG: 2.8 }
  },
  {
    day: 5, minute: 3,
    headline: "IT sector reality check — recovery will take months say analysts",
    detail: "Deal pipelines slow. IT stocks fail to sustain morning bounce.",
    impact: { IT: -1.8, Banking: 0.9, Pharma: 1.4, Energy: 1.1, FMCG: 1.6 }
  },
  {
    day: 5, minute: 4,
    headline: "Britannia, HUL, Dabur hit 52-week highs — FMCG the clear winner",
    detail: "Consumer staples prove resilient. Those who held FMCG are smiling.",
    impact: { IT: -0.6, Banking: 0.4, Pharma: 1.9, Energy: 0.8, FMCG: 4.1 }
  },
  {
    day: 5, minute: 5,
    headline: "Final hour — markets volatile as positions square off",
    detail: "Last chance to rebalance. The gap between winners and losers is massive.",
    impact: { IT: 1.2, Banking: 1.1, Pharma: 1.6, Energy: 1.4, FMCG: 1.8 }
  },
  {
    day: 5, minute: 6,
    headline: "MARKET CLOSED — Final results are in. Who played it smart?",
    detail: "The simulation ends. Defensive players and early exiters come out on top.",
    impact: { IT: 0.5, Banking: 0.4, Pharma: 0.8, Energy: 0.6, FMCG: 0.9 }
  },
];

export const TEAMS = [
  "Alpha Bulls",
  "Bear Slayers",
  "Market Mavens",
  "Nifty Ninjas",
  "Profit Pirates",
  "The Quants",
  "Wall Street Warriors",
];

export const STARTING_CAPITAL = 1000000; // ₹10 Lakhs
export const TOTAL_DAYS = 5;
export const TRADING_MINUTES = 6;
export const BREAK_MINUTES = 2;
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "marketadmin2024";
