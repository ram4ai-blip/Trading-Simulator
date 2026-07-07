# Market Mayhem — Trading Simulation

## STEP 1: Set Up Supabase Database

1. Go to your Supabase project → **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy and paste the entire contents of `supabase_schema.sql`
4. Click **Run**
5. You should see "Success" for all statements

---

## STEP 2: Deploy to Vercel

### Option A: Via GitHub (Recommended)

1. Create a free account at [github.com](https://github.com)
2. Create a new repository called `trading-sim`
3. Upload all files from this folder to the repo
4. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
5. Click **Add New Project** → Import your `trading-sim` repo
6. Before deploying, add these **Environment Variables** in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL = https://rvvgenxsprutwelzacff.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ADMIN_PASSWORD = marketadmin2024
```

7. Click **Deploy** — done in ~2 minutes

### Option B: Via Vercel CLI

```bash
npm i -g vercel
cd trading-sim
vercel
# Follow prompts, add env vars when asked
```

---

## STEP 3: Change Admin Password (Optional but Recommended)

In Vercel → Project Settings → Environment Variables → Change `ADMIN_PASSWORD` to something private.

---

## HOW TO RUN THE EVENT

### Before the Event
- Share the Vercel URL with all teams
- You open `/admin` on your laptop

### During the Event

1. **Teams join** by entering their team name on the home page
2. You see them appear in the Admin panel under "Teams Joined"
3. Once all 7 teams are in, click **▶ Start Simulation**
4. Turn on **Auto Advance** toggle — the game runs itself!
   - Every 60 seconds, the next minute advances automatically
   - After 6 minutes of trading, a 2-minute break starts automatically
   - After the break, the next day starts automatically
5. Watch the leaderboard update in real time

### Manual Mode (if you want full control)
- Keep Auto Advance OFF
- Click **⏭ Next Minute** yourself every 60 seconds
- Click **▶ Start Day X** after each break

---

## GAME STRUCTURE

| Phase | Duration |
|-------|----------|
| Trading Day (6 minutes) | 1 minute per market minute |
| Analysis Break | 2 minutes |
| Total (5 days) | ~40 minutes |

---

## TEAMS
- Alpha Bulls
- Bear Slayers  
- Market Mavens
- Nifty Ninjas
- Profit Pirates
- The Quants
- Wall Street Warriors

## TRADING RULES
- Starting Capital: ₹10,00,000
- Min trade: 10 shares
- Max trade: 100 shares per order
- Multiples of 10 only
- No short selling
- Zero brokerage

---

## ADMIN PASSWORD
Default: `marketadmin2024`
Change this in Vercel environment variables before the event.
