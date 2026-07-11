# Catch Phrase 🎉

A pass-and-play party game for the browser. One phone, two teams, a hidden
timer, and a buzzer nobody wants to be holding.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · installable PWA
(works offline). Pure client-side — no backend.

## How to Play

1. Pick a category (or **Everything** for a random mix), name your teams, and
   tap **Start Game**.
2. The phone holder describes the phrase on screen **without saying any word
   in it**. Teammates shout guesses.
3. When they get it, tap **Got it! Pass it on** and hand the phone to the
   other team. Beeps speed up as time runs out.
4. When the buzzer sounds, the team **not** holding the phone scores a point.
5. First team to **7** wins.

**Optional steal rule** (toggle on the home screen): after the buzzer, the
non-holding team may guess the final phrase for a bonus point (+2 instead
of +1).

**Skips** are unlimited; skipped phrases return to the bottom of the deck.

## Development

```bash
npm install
npm run dev            # dev server (service worker disabled in dev)
npm test               # unit tests (Vitest)
npm run test:coverage  # coverage gate: 80% on src/lib/**
npm run build          # production build (webpack — required by Serwist)
```

### Architecture notes

- **Game logic is pure.** `src/lib/game/reducer.ts` is an immutable state
  machine with no browser APIs; randomness is injected, so everything is
  deterministic under test.
- **Beeps are scheduled on the audio clock.** `src/lib/audio/beepPlayer.ts`
  schedules every beep of a round against `AudioContext.currentTime`, immune
  to JS timer throttling. A `setTimeout` fallback in
  `src/hooks/useRoundTimer.ts` ends the round even if audio is unavailable.
- **Single route.** All screens are phase-switched client state — an
  accidental back-swipe can't destroy a game (a history guard confirms first).

## Known device caveats

- **iOS silent switch mutes the beeps.** The game still works — the buzzer
  also triggers a full-screen flash, and the round ends via a timer that
  doesn't depend on audio. Flip the ring switch for the full experience.
- **No vibration on iPhone.** iOS Safari doesn't support the Vibration API;
  Android devices buzz on the buzzer.
- **Audio unlocks on the Start tap.** If you mute/close the tab mid-round,
  audio resumes on the next round start.

## Deploying to Vercel

Push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new)
— zero configuration needed. Every push to `main` auto-deploys.

To install on a phone: open the deployed site, then **Add to Home Screen**
(Safari share sheet on iOS, browser menu on Android). It works offline after
the first load.
