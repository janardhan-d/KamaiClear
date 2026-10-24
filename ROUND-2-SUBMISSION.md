# KamaiClear

## Know what your shift really pays.

**Competition:** Indiathon – Powered by E-Cell IIIT Bhubaneswar, co-powered by LearnApart
**Participant:** Janardhan Devarala
**Round:** Round 2 — Build Your MVP / documentation submission
**Prototype:** `index.html` in this folder

---

## 1. Problem statement

Delivery riders and other gig workers can see their platform payout, but that number is not the same as take-home income. Fuel, charging, maintenance, phone data, waiting time and other operating costs reduce the money that actually remains with the worker.

Most workers do not have a simple way to answer:

> “After all the costs of this shift, what did I really earn per hour?”

Without that answer, workers may spend hours on shifts that look profitable on the platform but are weak or loss-making after expenses.

## 2. Target users

### Primary users

- Food-delivery riders
- Quick-commerce delivery workers
- Bike-taxi and ride-hailing drivers

### First validation group

The first version is designed for delivery riders because their work pattern is easy to record: hours online, orders completed, kilometres travelled, platform payout and operating costs.

## 3. Proposed solution

**KamaiClear** is a worker-owned earnings log that converts a gross platform payout into a transparent net-pay view.

A worker can:

1. Record a shift without logging in to any delivery platform.
2. Enter gross payout, tips, hours, orders and kilometres.
3. Add fuel/charging, maintenance reserve, phone/data and other costs.
4. See net earnings and true hourly pay immediately.
5. Save the shift in a private history.
6. Generate a shareable **Net Pay Receipt**.

## 4. MVP scope

### Included in the prototype

- Dashboard with net income, true hourly pay, hours and cost rate.
- Manual shift entry form.
- Live calculator while the user types.
- Local shift history with platform filtering.
- Recent-shift trend chart.
- Net Pay Receipt with print / save as PDF support.
- Responsive desktop and mobile layouts.

### Explicitly not included in this MVP

- Direct login or API integration with Zomato, Swiggy or other platforms.
- Scraping platform applications.
- Automated legal or minimum-wage claims.
- Lending, insurance or employer scoring.
- GPS tracking.

This keeps the first version useful, privacy-conscious and feasible to validate quickly.

## 5. Core calculation

```text
Gross earnings = platform payout + tips + incentives

Operating costs = fuel/charging + maintenance reserve + phone/data + other costs

Net earnings = gross earnings − operating costs

True hourly pay = net earnings ÷ hours online
```

### Example demo record

```text
Platform payout:       ₹1,150
Fuel:                    ₹240
Maintenance reserve:     ₹60
Phone/data:               ₹20
Net earnings:           ₹830
Hours online:           8.5
True hourly pay:       ₹97.65
```

The values above are illustrative demo values, not a representative survey.

## 6. User journey

```text
Open KamaiClear
      ↓
Select “Log a shift”
      ↓
Enter earnings, time, distance and costs
      ↓
See live net-pay calculation
      ↓
Save the shift
      ↓
Review history and trend
      ↓
Print or share the Net Pay Receipt
```

## 7. Innovation and differentiation

KamaiClear is not only a payout tracker. Its central output is a **transparent, worker-controlled Net Pay Receipt**.

### Why it is different

- It focuses on net income rather than gross payout.
- Every cost assumption is visible and editable.
- It works without platform credentials.
- The data belongs to the worker in the prototype.
- The result can be understood in one minute and shared as a receipt.

## 8. Technology and feasibility

The prototype is intentionally lightweight:

- Next.js App Router with TypeScript for the interactive web MVP.
- Tailwind CSS foundation with a focused custom design layer and shadcn-style accessible controls.
- Browser `localStorage` for demo persistence while the product is validated.
- Responsive phone-first interface for mobile and desktop use.
- Browser print flow for PDF export.
- KamaiClear Saathi assistant with text questions, multilingual browser speech-to-text, text-to-speech and speech-to-speech mode.
- Three-color product identity using ocean navy, working teal and saffron for actions and attention states.

The product can later move to a hosted database, add optional screenshot OCR, connect a reviewed AI provider and support anonymous aggregate benchmarks after consent and adequate sample size. The current assistant uses local intent handling so it remains usable without credentials.

## 9. Impact

KamaiClear can help workers:

- Identify low-margin shifts.
- Understand the real cost of vehicle-based work.
- Make better decisions about when and where to work.
- Build a consistent personal record of earnings.

At scale, anonymised and consented data could support worker organisations, researchers and policy discussions. The prototype does not make population-level claims until real pilot data is collected.

## 10. Validation plan

Before the final video, the next validation step is:

1. Interview at least five riders or drivers.
2. Ask each participant what costs they track today.
3. Record anonymised sample shifts with consent.
4. Compare gross payout with net hourly pay.
5. Note where the form is confusing or missing a cost category.

The final pitch will label the number of participants and shifts clearly. No pilot results will be invented.

## 11. Demo plan for judges

1. Start with the question: “A rider sees ₹1,150. What did they really earn?”
2. Open **Log a shift**.
3. Change the hours and fuel values while showing the live calculator.
4. Save the shift.
5. Open the Net Pay Receipt.
6. Show that ₹1,150 gross becomes ₹830 net and ₹97.65 per hour.
7. Close with the worker-owned and privacy-first value proposition.

## 12. Current status

- Interactive MVP: complete as a local Next.js prototype.
- Manual calculator: complete.
- Local shift history: complete.
- Receipt generation: complete through browser print / PDF.
- Real-user validation: pending.
- Hosted deployment: pending.

The seed records in the prototype are clearly illustrative and must be replaced with labelled pilot data before making traction claims. Supabase/Auth, Neon, payments and email remain integration boundaries until real-user validation is complete.
