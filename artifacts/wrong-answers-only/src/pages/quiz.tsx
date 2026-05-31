import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGenerateQuiz, useExplainAnswer } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useGameState } from "@/hooks/use-game-state";

export default function Quiz() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const topic = searchParams.get("topic");
  const difficulty = (searchParams.get("difficulty") ?? "easy") as "easy" | "hard";

  const { incrementScoreAndStreak } = useGameState();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const generateQuiz = useGenerateQuiz();
  const explainAnswer = useExplainAnswer();

  useEffect(() => {
    if (!topic) {
      setLocation("/");
      return;
    }
    generateQuiz.mutate({ data: { topic, difficulty } });
  }, [topic]);

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    if (!generateQuiz.data) return;
    explainAnswer.mutate({
      data: {
        topic: topic!,
        question: generateQuiz.data.question,
        selectedAnswer: answer,
      },
    });
  };

  const handleNext = () => {
    incrementScoreAndStreak();
    setLocation(`/results?topic=${encodeURIComponent(topic || "")}&difficulty=${difficulty}`);
  };

  const handleRetry = () => {
    setSelectedAnswer(null);
    explainAnswer.reset();
    generateQuiz.reset();
    generateQuiz.mutate({ data: { topic: topic!, difficulty } });
  };

  const handleGoHome = () => {
    setLocation("/");
  };

  // Generation error screen
  if (generateQuiz.isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-8 text-center animate-in fade-in duration-500 py-8">
        <div className="text-6xl font-black text-destructive rotate-3">!</div>
        <div className="space-y-3">
          <h2 className="text-2xl font-bold uppercase tracking-tight">System Paradox</h2>
          <p className="font-mono text-muted-foreground text-base leading-relaxed max-w-sm">
            Our AI accidentally told the truth and caused a system paradox. The laws of this game have been violated.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button
            onClick={handleRetry}
            className="w-full h-12 font-bold uppercase tracking-wider bg-primary text-primary-foreground rounded-xl"
            data-testid="button-retry"
          >
            Try Again
          </Button>
          <Button
            onClick={handleGoHome}
            variant="outline"
            className="w-full h-12 font-mono rounded-xl border-border"
            data-testid="button-go-home"
          >
            Pick a different topic
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (generateQuiz.isPending || !generateQuiz.data) {
    const loadingMessages = [
      "Mining the depths of the internet for factually incorrect garbage...",
      "Consulting historians we found in a dumpster...",
      "Asking an expert who is definitely not qualified...",
      difficulty === "hard"
        ? "Crafting deceptions so convincing even we believe them..."
        : "Generating nonsense at an alarming rate...",
    ];
    const msg = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];

    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-in fade-in duration-500">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xl font-mono text-muted-foreground animate-pulse text-center">{msg}</p>
        {difficulty === "hard" && (
          <div className="bg-card border border-border px-4 py-2 rounded-full">
            <p className="text-xs font-mono text-primary uppercase tracking-widest font-bold">Hard Mode Active</p>
          </div>
        )}
      </div>
    );
  }

  const { question, answers } = generateQuiz.data;

  return (
    <main className="flex-1 flex flex-col py-8 gap-8 animate-in fade-in zoom-in-95 duration-500">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleGoHome}
          className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
          data-testid="button-back-home"
        >
          ← Home
        </button>
        <div className={`
          px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-widest border
          ${difficulty === "hard"
            ? "bg-primary/10 text-primary border-primary/30"
            : "bg-secondary/10 text-secondary border-secondary/30"
          }
        `}>
          {difficulty === "hard" ? "Hard Mode" : "Easy Mode"}
        </div>
      </div>

      {/* Question card */}
      <div className="bg-card border-2 border-border p-6 rounded-2xl shadow-lg relative">
        <div className="absolute -top-3 left-6 bg-secondary text-secondary-foreground text-xs font-mono font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm">
          Topic: {topic}
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mt-2 leading-tight">
          {question}
        </h2>
      </div>

      {/* Answer buttons */}
      <div className="flex flex-col gap-3">
        {answers.map((answer, index) => {
          const isSelected = selectedAnswer === answer;
          return (
            <button
              key={index}
              disabled={selectedAnswer !== null}
              onClick={() => handleAnswer(answer)}
              className={`
                w-full p-4 text-left rounded-xl border-2 transition-all duration-300
                font-medium text-lg
                animate-in slide-in-from-right-8 fade-in fill-mode-both
                ${index === 0 ? "stagger-1" : index === 1 ? "stagger-2" : index === 2 ? "stagger-3" : "stagger-4"}
                ${selectedAnswer === null ? "bg-card border-border hover:border-primary hover:-translate-y-1 hover:shadow-[0_4px_0_hsl(var(--primary))]" : ""}
                ${isSelected ? "bg-primary border-primary text-primary-foreground scale-[1.02] shadow-lg" : selectedAnswer !== null ? "opacity-50 grayscale border-border bg-card" : ""}
              `}
              data-testid={`button-answer-${index}`}
            >
              {answer}
            </button>
          );
        })}
      </div>

      {/* Explain loading */}
      {explainAnswer.isPending && (
        <div className="bg-card border border-border p-6 rounded-xl animate-in slide-in-from-bottom-4 flex items-center gap-4">
          <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
          <p className="font-mono text-muted-foreground">Preparing the roast...</p>
        </div>
      )}

      {/* Explain error */}
      {explainAnswer.isError && (
        <div className="bg-destructive/10 border-2 border-destructive p-6 rounded-2xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
          <p className="font-mono text-destructive font-bold text-sm uppercase tracking-wider mb-2">Roast malfunction</p>
          <p className="text-base text-muted-foreground font-mono mb-4">
            The AI tried to explain your mistake but short-circuited from sheer disappointment. The answer was still wrong though.
          </p>
          <Button
            onClick={handleNext}
            className="w-full h-12 font-bold uppercase tracking-wider bg-destructive text-destructive-foreground rounded-xl"
            data-testid="button-next-after-error"
          >
            Move on (shamefully)
          </Button>
        </div>
      )}

      {/* Explanation reveal */}
      {explainAnswer.data && (
        <div className="bg-accent/10 border-2 border-accent p-6 rounded-2xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 shadow-[0_0_30px_rgba(255,200,0,0.15)] relative">
          <div className="absolute -top-4 -right-4 bg-destructive text-destructive-foreground font-black uppercase italic px-4 py-2 rotate-12 text-xl shadow-lg border-2 border-background">
            WRONG!
          </div>
          <p className="text-lg mb-6 leading-relaxed font-mono">
            {explainAnswer.data.explanation}
          </p>
          <Button
            onClick={handleNext}
            className="w-full h-14 text-lg font-bold uppercase tracking-wider bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-xl"
            data-testid="button-next"
          >
            Continue The Pain
          </Button>
        </div>
      )}
    </main>
  );
}
