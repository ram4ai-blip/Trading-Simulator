-- Run this entire file in Supabase SQL Editor

-- Game state table (single row)
CREATE TABLE IF NOT EXISTS game_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  status TEXT DEFAULT 'waiting', -- waiting | trading | break | finished
  current_day INTEGER DEFAULT 1,
  current_minute INTEGER DEFAULT 0,
  phase_ends_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO game_state (id, status, current_day, current_minute) 
VALUES (1, 'waiting', 1, 0)
ON CONFLICT (id) DO NOTHING;

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  cash BIGINT DEFAULT 1000000,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock prices table (current live prices)
CREATE TABLE IF NOT EXISTS stock_prices (
  symbol TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sector TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  base_price NUMERIC(10,2) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Holdings table
CREATE TABLE IF NOT EXISTS holdings (
  id SERIAL PRIMARY KEY,
  team_name TEXT NOT NULL REFERENCES teams(name),
  symbol TEXT NOT NULL REFERENCES stock_prices(symbol),
  quantity INTEGER DEFAULT 0,
  avg_buy_price NUMERIC(10,2) DEFAULT 0,
  UNIQUE(team_name, symbol)
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
  id SERIAL PRIMARY KEY,
  team_name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  trade_type TEXT NOT NULL, -- buy | sell
  quantity INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  day INTEGER NOT NULL,
  minute INTEGER NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable realtime on all tables
ALTER PUBLICATION supabase_realtime ADD TABLE game_state;
ALTER PUBLICATION supabase_realtime ADD TABLE stock_prices;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE holdings;
ALTER PUBLICATION supabase_realtime ADD TABLE trades;

-- Disable RLS for simplicity (this is a controlled event)
ALTER TABLE game_state DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_prices DISABLE ROW LEVEL SECURITY;
ALTER TABLE holdings DISABLE ROW LEVEL SECURITY;
ALTER TABLE trades DISABLE ROW LEVEL SECURITY;
