# Kisan Setu — Data Sources

Where the app's information comes from, and what is real versus seeded.

---

## ⚠️ Read this first

**The market series is seeded, not live.** The demo runs on a
**hand-built seed dataset** (`frontend/src/lib/engine/seed.ts`) that *replays a
real-shaped Kolar tomato crash* — deterministic and fully offline, so nothing can
break when the network is flaky. Two things are live: the mandi price snapshot card and the climate shock signal from Open-Meteo (https://open-meteo.com), which compares the last 14 days plus a 7 day forecast with the same window in the previous 10 years.

The sources below are what the **real / scaled system ingests from**, and what the
seed is **modeled on**. Say it exactly that way: the demo is reliable by design, and
it scales by pointing the same pipeline at the live API — nothing new to build.

---

## 1. Live data sources (mandi prices + arrivals — the core feed)

| Source | Website | What it provides |
|---|---|---|
| **Agmarknet** — Directorate of Marketing & Inspection, Govt of India | https://agmarknet.gov.in | Daily mandi **prices + arrivals** per crop/market — the backbone of the crash predictor |
| **data.gov.in** — Open Government Data Platform | https://data.gov.in | Hosts the Agmarknet API + agri datasets (the programmatic way to pull the above) |
| Agmarknet dataset on data.gov.in (direct) | https://www.data.gov.in/catalog/current-daily-price-various-commodities-various-markets-mandi | The exact daily price/arrivals catalog to pull from |
| **eNAM** — National Agriculture Market | https://enam.gov.in | Alternate mandi price feed; useful when scaling to more markets |

## 2. Government schemes it plugs into (institutional backing, not data feeds)

The "already-funded pieces" the pitch connects. The processing-unit directory is
modeled on their cluster lists.

| Scheme | Website | Role |
|---|---|---|
| **Operation Greens** — Ministry of Food Processing Industries | https://mofpi.gov.in | Funds price stabilisation for tomato/onion/potato + FPO–processing links |
| **PMFME** — PM Formalisation of Micro Food Processing Enterprises | https://pmfme.mofpi.gov.in | Funds the SHG/FPO micro processing units (our "units") |
| **10,000 FPO Scheme** — SFAC / NABARD / NCDC | https://sfac.in · https://www.nabard.org | Built the farmer producer groups |

## 3. Public statistics we cite (verify + footnote each in the deck)

These figures in the app come from **public reporting and government / ICAR
post-harvest-loss studies** — pin each to a named source before the finals:

- Onion farmers got **₹5–7/kg** while retail was **₹25/kg**
- Farmers receive only **~43%** of the retail price
- **~₹1.5 lakh crore** of food wasted per year

Suggested sources to cite (add the exact page/figure in your deck):

- **ICAR-CIPHET** post-harvest loss study — https://ciphet.icar.gov.in
- **NABARD** reports — https://www.nabard.org
- **MoFPI / Operation Greens** documents — https://mofpi.gov.in
- Mainstream press coverage of the specific onion/tomato crash (add the article link)

## 4. Tech / runtime services (plumbing, no data)

- **Browser Web Speech API** — the spoken alert (built into the phone; no external site)
- **Google Fonts** via `next/font` — self-hosted at build time, no runtime call
- **`qrcode` npm library** — QR generated locally
- **Vercel** — hosting only
- **No external data API is called at runtime** — the app is fully self-contained
