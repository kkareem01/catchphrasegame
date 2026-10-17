# Catch Phrase 🎉

A pass-and-play party game for the browser. One phone, two teams (or a
free-for-all for any number of players, or a two-player co-op), a hidden
timer, and a buzzer nobody wants to be holding.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · installable PWA
(works offline). Pure client-side — no backend.

## How to Play

1. Pick **Teams** or **Free-for-all**, enter names, choose a category (or
   **Everything** for a random mix) and tap **Start Game**. Your setup is
   remembered for next time.
2. The phone holder describes the phrase on screen **without saying any word
   in it**.
3. When someone gets it, tap **Got it!** — the screen tells you who to pass
   to. Beeps speed up (and rise in pitch) as the hidden timer runs out.
4. When the buzzer blows:
   - **Teams:** the team **not** holding the phone scores. First to **7**
     (configurable) wins.
   - **Free-for-all** (3–10 players — any odd or even count): whoever is
     caught holding the phone takes a strike. Hit the strike limit and you're
     out; fewest strikes wins.
   - **Beat the Bomb** (co-op, 2+ players — great for two): everyone is on
     one team. Each phrase cleared adds to the team score; 3 skips per bomb.
     After each bomb the next one has a shorter fuse. Play 3 (or 5) bombs
     and try to beat your saved high score (kept per category and bomb
     count).
5. **Rematch** keeps the same players and settings.

**Optional steal rule** (Teams, in Rules & sound): after the buzzer, the
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
  deterministic under test. Teams and free-for-all share one model: a list
  of competitors and a `holder` index that walks round the circle.
- **Audio heals itself.** `src/lib/audio/audioEngine.ts` owns the
  AudioContext and is re-checked on every tap (`useAudioUnlock`): a context
  that iOS interrupted, closed, froze, or left as a silent "zombie" after
  backgrounding is replaced on the spot — no app restart needed.
- **Beeps use a lookahead scheduler.** `src/lib/audio/gameAudio.ts` books
  each beep ~120 ms ahead on the audio clock (sample-accurate) rather than
  all at round start, so a rebuilt context picks up mid-round. The
  `setTimeout` in `src/hooks/useRoundTimer.ts` is the source of truth for
  time-up, so rounds end even with no audio.
- **Sound is synthesised, not sampled.** `src/lib/audio/sounds.ts` builds
  every sound from oscillators and noise through a master limiter, tuned for
  the 1–4 kHz band phone speakers actually reproduce. Tweak levels in
  `src/lib/audio/constants.ts`.
- **Single route.** All screens are phase-switched client state — an
  accidental back-swipe can't destroy a game (a history guard confirms first).

## Known device caveats

- **Silent switch:** sound plays even on silent. iOS 16.4+ uses the Audio
  Session API (`playback`); older iOS falls back to a looping silent
  `<audio>` element. Side effect: starting a game pauses music playing from
  the *same* phone (music on a separate speaker is unaffected).
- **Volume buttons still matter.** Silent mode is bypassed; the media volume
  is not. Use **Rules & sound → Test** to check before you play.
- **No vibration on iPhone.** iOS Safari doesn't support the Vibration API;
  Android devices buzz on the buzzer.

## Deploying to Vercel

Push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new)
— zero configuration needed. Every push to `main` auto-deploys.

To install on a phone: open the deployed site, then **Add to Home Screen**
(Safari share sheet on iOS, browser menu on Android). It works offline after
the first load.
