import { useState } from "react";
import { useLocation } from "wouter";
import { useGetSuggestedTopics, getGetSuggestedTopicsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useGameState } from "@/hooks/use-game-state";
import { Skeleton } from "@/components/ui/skeleton";

type Difficulty = "easy" | "hard";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { streak, leaderboard } = useGameState();
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const { data: topicsData, isLoading } = useGetSuggestedTopics({
    query: { queryKey: getGetSuggestedTopicsQueryKey() }
  });

  const handlePlay = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!topic.trim()) return;
    setLocation(`/quiz?topic=${encodeURIComponent(topic.trim())}&difficulty=${difficulty}`);
  };

  return (
    <main className="flex-1 flex flex-col justify-center gap-8 py-8 animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-4">
        <div className="inline-block px-3 py-1 bg-accent text-accent-foreground text-xs font-mono font-bold uppercase tracking-wider rounded-full rotate-[-2deg] mb-2 shadow-sm">
          Trivia for the confidently incorrect
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight uppercase leading-none text-white drop-shadow-md">
          WRONG<br/>
          <span className="text-accent">ANSWERS</span><br/>
          ONLY
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl font-mono mt-4">
          Every answer is wrong. Pick the one that sounds the most right. Get roasted.
        </p>
      </div>

      {/* Streak + leaderboard toggle */}
      <div className="flex items-center gap-3">
        {streak > 0 && (
          <div className="flex-1 bg-card border border-border p-4 rounded-xl text-center shadow-lg">
            <p className="text-xs font-mono text-muted-foreground uppercase">Current Streak</p>
            <p className="text-3xl font-bold text-secondary">{streak}</p>
          </div>
        )}
        {leaderboard.length > 0 && (
          <button
            onClick={() => setShowLeaderboard((v) => !v)}
            className={`
              flex-1 bg-card border-2 p-4 rounded-xl text-center shadow-lg transition-all
              ${showLeaderboard ? "border-accent text-accent" : "border-border text-muted-foreground hover:border-accent/50 hover:text-foreground"}
            `}
            data-testid="button-toggle-leaderboard"
          >
            <p className="text-xs font-mono uppercase tracking-wider">High Scores</p>
            <p className="text-3xl font-bold">{leaderboard[0]?.streak ?? 0}</p>
          </button>
        )}
      </div>

      {/* Leaderboard panel */}
      {showLeaderboard && leaderboard.length > 0 && (
        <div className="bg-card border-2 border-accent/40 rounded-2xl overflow-hidden animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-accent">Top Streaks</h2>
            <span className="text-xs font-mono text-muted-foreground">Best {leaderboard.length} of all time</span>
          </div>
          <div className="divide-y divide-border">
            {leaderboard.map((entry, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3"
                data-testid={`leaderboard-entry-${i}`}
              >
                <span className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0
                  ${i === 0 ? "bg-accent text-accent-foreground" : i === 1 ? "bg-secondary/20 text-secondary" : "bg-muted text-muted-foreground"}
                `}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground truncate text-sm">{entry.topic}</p>
                  <p className="text-xs font-mono text-muted-foreground">{formatDate(entry.date)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-mono font-bold uppercase
                    ${entry.difficulty === "hard" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}
                  `}>
                    {entry.difficulty}
                  </span>
                  <div className="text-right">
                    <p className="text-lg font-black text-foreground leading-none">{entry.streak}</p>
                    <p className="text-xs font-mono text-muted-foreground">streak</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handlePlay} className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 stagger-2">
        <div className="space-y-3">
          <label htmlFor="topic" className="block text-sm font-mono font-bold uppercase text-muted-foreground ml-1">
            Pick your poison (topic)
          </label>
          <Input
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. 19th Century French Literature"
            className="h-14 text-lg bg-card border-2 border-border focus-visible:border-primary focus-visible:ring-primary rounded-xl"
            data-testid="input-topic"
          />
        </div>

        <div className="space-y-3">
          <p className="text-xs font-mono font-bold uppercase text-muted-foreground ml-1">Or pick a suggestion:</p>
          <div className="flex flex-wrap gap-2">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-24 rounded-full bg-muted" />
              ))
            ) : (
              topicsData?.topics?.map((t) => (
                <Badge
                  key={t}
                  variant="outline"
                  className="cursor-pointer hover:bg-secondary hover:text-secondary-foreground hover:border-secondary transition-colors text-sm py-1.5 px-3 border-border text-foreground rounded-full font-mono bg-card"
                  onClick={() => setTopic(t)}
                  data-testid={`badge-topic-${t.replace(/\s+/g, '-')}`}
                >
                  {t}
                </Badge>
              ))
            )}
          </div>
        </div>

        {/* Difficulty selector */}
        <div className="space-y-3">
          <p className="text-xs font-mono font-bold uppercase text-muted-foreground ml-1">Difficulty:</p>
          <div className="grid grid-cols-2 gap-2 bg-card border-2 border-border rounded-xl p-1.5">
            <button
              type="button"
              onClick={() => setDifficulty("easy")}
              data-testid="button-difficulty-easy"
              className={`
                py-3 px-4 rounded-lg text-sm font-mono font-bold uppercase tracking-wider transition-all duration-200
                ${difficulty === "easy"
                  ? "bg-secondary text-secondary-foreground shadow-md scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              Easy
              <span className={`block text-xs font-normal normal-case tracking-normal mt-0.5 ${difficulty === "easy" ? "opacity-80" : "opacity-50"}`}>
                Absurdly wrong
              </span>
            </button>
            <button
              type="button"
              onClick={() => setDifficulty("hard")}
              data-testid="button-difficulty-hard"
              className={`
                py-3 px-4 rounded-lg text-sm font-mono font-bold uppercase tracking-wider transition-all duration-200
                ${difficulty === "hard"
                  ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              Hard
              <span className={`block text-xs font-normal normal-case tracking-normal mt-0.5 ${difficulty === "hard" ? "opacity-80" : "opacity-50"}`}>
                Deceptively wrong
              </span>
            </button>
          </div>
          <p className="text-xs font-mono text-muted-foreground ml-1">
            {difficulty === "easy"
              ? "Easy: answers are ridiculous. You'll know they're wrong. The chaos is the point."
              : "Hard: answers sound totally legit. You will be fooled. You will be humbled."}
          </p>
        </div>

        <Button
          type="submit"
          disabled={!topic.trim()}
          className="w-full h-16 text-xl font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-[0_0_20px_rgba(255,0,150,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          data-testid="button-play"
        >
          Let's Go
        </Button>
      </form>
    </main>
  );
}
