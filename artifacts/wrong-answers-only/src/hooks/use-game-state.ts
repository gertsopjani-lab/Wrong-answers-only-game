import { useState } from "react";

export interface LeaderboardEntry {
  streak: number;
  score: number;
  topic: string;
  difficulty: "easy" | "hard";
  date: string;
}

const LEADERBOARD_KEY = "wao_leaderboard";
const STREAK_KEY = "wao_streak";
const SCORE_KEY = "wao_score";
const MAX_ENTRIES = 5;

function loadLeaderboard(): LeaderboardEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LEADERBOARD_KEY) ?? "[]") as LeaderboardEntry[];
  } catch {
    return [];
  }
}

function saveLeaderboard(entries: LeaderboardEntry[]): void {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
}

export function useGameState() {
  const [streak, setStreak] = useState(() =>
    parseInt(localStorage.getItem(STREAK_KEY) ?? "0")
  );
  const [score, setScore] = useState(() =>
    parseInt(sessionStorage.getItem(SCORE_KEY) ?? "0")
  );
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(loadLeaderboard);

  const incrementScoreAndStreak = () => {
    const newStreak = streak + 1;
    const newScore = score + 1;
    setStreak(newStreak);
    setScore(newScore);
    localStorage.setItem(STREAK_KEY, newStreak.toString());
    sessionStorage.setItem(SCORE_KEY, newScore.toString());
  };

  const resetStreak = () => {
    setStreak(0);
    localStorage.setItem(STREAK_KEY, "0");
  };

  const saveToLeaderboard = (topic: string, difficulty: "easy" | "hard") => {
    if (streak === 0 && score === 0) return;
    const entry: LeaderboardEntry = {
      streak,
      score,
      topic,
      difficulty,
      date: new Date().toISOString(),
    };
    const existing = loadLeaderboard();
    const updated = [...existing, entry]
      .sort((a, b) => b.streak - a.streak || b.score - a.score)
      .slice(0, MAX_ENTRIES);
    saveLeaderboard(updated);
    setLeaderboard(updated);
  };

  return { streak, score, leaderboard, incrementScoreAndStreak, resetStreak, saveToLeaderboard };
}
