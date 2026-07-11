import { GameShell } from "@/components/GameShell";
import { GameProvider } from "@/hooks/useGame";

export default function Home() {
  return (
    <GameProvider>
      <GameShell />
    </GameProvider>
  );
}
