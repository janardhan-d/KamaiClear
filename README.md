# KamaiClear MVP

**Tagline:** Know what your shift really pays.

KamaiClear is a phone-first web MVP for delivery riders and other gig workers. It separates gross payout from fuel, maintenance, phone/data and other operating costs, then creates a transparent **Net Pay Receipt**.

## What is implemented

- Overview dashboard with true hourly pay, weekly net, cost rate and best shift.
- Shift logger with live calculation while typing.
- Local shift history with platform filtering.
- Net Pay Receipt with print / save as PDF support.
- Responsive desktop sidebar and mobile bottom navigation.
- Local-only persistence through `localStorage` in the current demo; no platform credentials or real user data are required.
- Typed domain calculations in `src/lib/earnings.ts` and a component-based Next.js App Router interface.
- Accessible labels, live calculation feedback, responsive navigation, empty states and print-friendly receipt output.
- A voice-first **KamaiClear Saathi** assistant with text input, browser speech-to-text, text-to-speech and speech-to-speech mode.
- A focused three-color visual system: ocean navy, working teal and saffron action color.
- A server action route at `/api/assistant` that accepts structured commands, navigates views, fills shift fields and only saves after an explicit save request.
- Libraries.dev motion polish using `voice-glow` for the live microphone beam and `thinking-orbs` while an assistant request is being interpreted.

## Run the Next.js MVP

The source of truth is now the Next.js app under `src/`.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Use these checks before sharing the prototype:

```bash
npm run typecheck
npm run build
```

## Legacy static preview

The original zero-dependency preview remains available as `index.html`. For a local HTTP preview, run any static file server from this directory, for example:

```bash
python -m http.server 4173
```

Then open `http://localhost:4173`.

## Round 2 demo path

1. Open **Log a shift**.
2. Change payout, fuel and hours to show the live calculation.
3. Save the shift.
4. Open the **Net Pay Receipt**.
5. Use **Print / save PDF** if a shareable artifact is needed.

The workspace starts empty for each new browser and stores only records created by the user. Supabase/Auth, Neon, payments and email are intentionally not wired into this MVP until the product is validated with riders; the current local-first boundary prevents the demo from pretending that real user data is already connected.

## Assistant limitations

The assistant works locally without an API key. It answers the supported KamaiClear intents using the current shift records and browser speech APIs. Browser recognition and voice availability differ by device, browser and language. No honest product can guarantee 100% speech recognition or translation accuracy for every language, so the UI always keeps typing as a fallback and asks users to check numbers before saving.

## Real-time model boundary

The assistant request path is:

```text
Voice or text input
  → /api/assistant
  → live OpenAI-compatible model when AI_API_KEY exists
  → local action model fallback when it does not
  → validated action
  → navigation / form fill / explicit save
```

Set `AI_API_KEY`, `AI_BASE_URL` and `AI_MODEL` in a server-only environment to enable the live model. The model must return a validated JSON action; the browser never receives the API key. Without credentials, the same user flow works through the local action parser.
