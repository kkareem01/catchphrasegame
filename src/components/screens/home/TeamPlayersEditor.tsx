"use client";

import { useState } from "react";
import { teamColor, tint } from "@/components/ui/colors";
import { MAX_NAME_LENGTH, MAX_PLAYERS_PER_TEAM } from "@/lib/game/constants";

type Rosters = readonly [readonly string[], readonly string[]];

/**
 * Optional player names per team. With names, the game says exactly who to
 * hand the phone to — always someone on the other team — so uneven teams
 * (odd numbers of players) work without teammates ever passing to each other.
 */
export function TeamPlayersEditor({
  teamNames,
  rosters,
  onChange,
}: Readonly<{
  teamNames: readonly [string, string];
  rosters: Rosters;
  onChange: (rosters: Rosters) => void;
}>) {
  const [expanded, setExpanded] = useState(false);
  // Which input was just added, so it can grab focus when it mounts.
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const hasPlayers = rosters.some((players) => players.length > 0);

  const updateTeam = (team: 0 | 1, players: readonly string[]) =>
    onChange(team === 0 ? [players, rosters[1]] : [rosters[0], players]);

  if (!expanded && !hasPlayers) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full rounded-2xl border-2 border-dashed border-line px-4 py-3 text-left active:bg-white/5"
      >
        <span className="block font-bold">+ Add player names</span>
        <span className="block text-xs text-muted">
          Optional — great for odd numbers. The game tells you who to pass to.
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3">
        {([0, 1] as const).map((team) => {
          const color = teamColor(team);
          const players = rosters[team];
          return (
            <div key={team} className="flex min-w-0 flex-col gap-1.5">
              <p className="truncate px-1 text-[0.7rem] font-bold uppercase tracking-wider" style={{ color }}>
                {teamNames[team].trim() || `Team ${team + 1}`}
              </p>
              {players.map((name, index) => {
                const key = `${team}-${index}`;
                return (
                  <div
                    key={key}
                    className="flex items-center rounded-xl border bg-black/25 pl-2.5 transition-colors focus-within:!border-accent"
                    style={{ borderColor: tint(color, 35) }}
                  >
                    <input
                      value={name}
                      onChange={(e) =>
                        updateTeam(team, players.map((n, i) => (i === index ? e.target.value : n)))
                      }
                      // Focus is the point of tapping "+ Add player".
                      autoFocus={justAdded === key}
                      maxLength={MAX_NAME_LENGTH}
                      placeholder={`Player ${index + 1}`}
                      aria-label={`Team ${team + 1} player ${index + 1}`}
                      enterKeyHint="done"
                      className="min-w-0 flex-1 bg-transparent py-2.5 font-bold outline-none placeholder:text-white/30"
                    />
                    <button
                      type="button"
                      onClick={() => updateTeam(team, players.filter((_, i) => i !== index))}
                      aria-label={`Remove team ${team + 1} player ${index + 1}`}
                      className="flex h-10 w-9 shrink-0 items-center justify-center text-lg text-muted active:bg-white/10"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
              {players.length < MAX_PLAYERS_PER_TEAM ? (
                <button
                  type="button"
                  onClick={() => {
                    setJustAdded(`${team}-${players.length}`);
                    updateTeam(team, [...players, ""]);
                  }}
                  className="rounded-xl border border-dashed border-line py-2 text-sm font-bold text-muted active:bg-white/5"
                >
                  + Add player
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      <p className="px-1 text-xs text-muted">
        The phone always goes to the next player on the other team, so pass it
        across the circle if you need to. Uneven teams are fine — the smaller
        team just gets the phone more often.
      </p>
    </div>
  );
}
