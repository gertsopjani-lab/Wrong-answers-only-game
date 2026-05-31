import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useGameState } from "@/hooks/use-game-state";

export default function Results() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const topic = searchParams.get("topic") ?? "";
  const difficulty = (searchParams.get("difficulty") ?? "easy") as "easy" | "hard";

  const { streak, score, resetStreak, saveToLeaderboard } = useGameState();
  const saved = useRef(false);

  useEffect(() => {
    if (!saved.current) {
      saved.current = true;
      saveToLeaderboard(topic, difficulty);
    }
  }, []);

  const handlePlayAgain = () => {
    if (topic) {
      setLocation(`/quiz?topic=${encodeURIComponent(topic)}&difficulty=${difficulty}`);
    } else {
      setLocation("/");
    }
  };

  const handleNewTopic = () => setLocation("/");

  const handleGiveUp = () => {
    resetStreak();
    setLocation("/");
  };

  return (
    <main className="flex-1 flex flex-col justify-center py-8 gap-8 animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-white">
          Round Over
        </h1>
        <p className="text-muted-foreground font-mono">
          You survived. Barely.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-4 duration-500 stagger-1">
        <div className="bg-card border border-border p-6 rounded-2xl text-center">
          <p className="text-sm font-mono text-muted-foreground uppercase font-bold mb-2">Session Score</p>
          <p className="text-5xl font-black text-primary">{score}</p>
        </div>
        <div className="bg-card border border-border p-6 rounded-2xl text-center">
          <p className="text-sm font-mono text-muted-foreground uppercase font-bold mb-2">Active Streak</p>
          <p className="text-5xl font-black text-secondary">{streak}</p>
        </div>
      </div>

      {topic && (
        <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Topic played</p>
            <p className="font-bold text-foreground">{topic}</p>
          </div>
          <span className={`
            px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-widest border
            ${difficulty === "hard"
              ? "bg-primary/10 text-primary border-primary/30"
              : "bg-secondary/10 text-secondary border-secondary/30"
            }
          `}>
            {difficulty}
          </span>
        </div>
      )}

      <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500 stagger-2">
        <Button
          onClick={handlePlayAgain}
          className="w-full h-16 text-lg font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
          data-testid="button-play-again"
        >
          Play Same Topic Again
        </Button>

        <Button
          variant="outline"
          onClick={handleNewTopic}
          className="w-full h-14 text-lg font-bold uppercase tracking-wider border-2 border-border hover:bg-card hover:border-secondary hover:text-secondary rounded-xl transition-all"
          data-testid="button-new-topic"
        >
          Pick New Topic
        </Button>

        <Button
          variant="ghost"
          onClick={handleGiveUp}
          className="w-full h-12 text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-mono text-sm uppercase mt-4"
          data-testid="button-give-up"
        >
          Give up & reset streak
        </Button>
      </div>
    </main>
  );
}
