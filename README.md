# Wrong Answers Only

A quiz game where **every single answer is factually wrong** — that's the entire joke. Pick a topic, get a real trivia question, and choose from four confidently incorrect options. Then get roasted by an AI for the specific wrong answer you picked.

Built for the Solution25 Applied AI Engineer intern task.

---

## What It Does

1. You pick a topic (or choose from suggestions)
2. You pick a difficulty: **Easy** (absurdly wrong answers) or **Hard** (deceptively plausible wrong answers)
3. The AI generates a real trivia question and **four wrong answers** — no correct option exists
4. You pick one. You're wrong. The AI explains exactly why, with wit
5. Your streak and top scores are saved locally

---

## Run Locally (under 5 minutes)

### Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [pnpm](https://pnpm.io/installation) — `npm install -g pnpm`
- An OpenAI API key (get one at [platform.openai.com](https://platform.openai.com))

### Steps

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd wrong-answers-only

# 2. Install dependencies
pnpm install

# 3. Set your OpenAI API key
#    Create a .env file in artifacts/api-server/:
echo "OPENAI_API_KEY=sk-..." > artifacts/api-server/.env

# 4. Start the API server (port 8080)
pnpm --filter @workspace/api-server run dev

# 5. In a separate terminal, start the frontend (port 19180)
pnpm --filter @workspace/wrong-answers-only run dev

# 6. Open http://localhost:19180
```

That's it. No database required — everything stateful lives in `localStorage`.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS v4 + shadcn/ui |
| Routing | Wouter |
| Data fetching | TanStack Query + Orval-generated hooks |
| Backend | Express 5 + Node.js 24 |
| AI | OpenAI `gpt-4o-mini` |
| Monorepo | pnpm workspaces |
| API contract | OpenAPI 3.1 + Zod validation |

---

## Project Structure

```
artifacts/
  api-server/          Express 5 API — quiz generation + explanation routes
  wrong-answers-only/  React + Vite frontend
lib/
  api-spec/            OpenAPI spec (source of truth for all API contracts)
  api-client-react/    Auto-generated React Query hooks (from Orval)
  api-zod/             Auto-generated Zod validation schemas (from Orval)
  db/                  Drizzle ORM schema (unused for this app — no DB needed)
```

---

## Prompts Used

This section documents the iterative prompts that shaped the app. These were submitted to Replit Agent.

### Prompt 1 — Initial build

> "I want to build a web-based quiz game called 'Wrong Answers Only' the 4th one in the pdf. Core Gameplay Rules:
> 1. The user inputs or picks a topic.
> 2. The app uses an LLM to generate a question about that topic and four plausible-but-wrong multiple-choice answers.
> 3. CRITICAL RULE: There must be NO correct answer. All 4 choices must be factually incorrect but sound highly believable or funny. The system prompt for the LLM must strictly enforce this.
> 4. When the user selects an answer, the LLM provides a witty explanation of why that specific wrong answer is wrong.
> Please set up a clean, modern web interface (using React and Tailwind CSS if possible) with a Node.js backend to handle the LLM API requests safely."

This produced: the full full-stack scaffold — Express API with `/quiz/generate` and `/quiz/explain` routes, React frontend with landing, quiz, and results pages, topic suggestions, streak counter in localStorage, and a bold dark neon design system.

### Prompt 2 — Difficulty calibration + error handling

> "Yes, implement the difficulty mode selector:
> - Easy Mode: The 4 wrong answers should be absurdly, hilariously wrong (e.g., 'It's a type of cheese').
> - Hard Mode: The 4 wrong answers should be deceptively, convincingly wrong — sounding highly technical or historically plausible to really trick the user.
> - Add a toggle or segmented control on the landing page.
> - Double-check that if the OpenAI API fails, times out, or returns bad JSON, the frontend displays a graceful, witty error screen (e.g., 'Our AI accidentally told the truth and caused a system paradox')."

This produced: two separate LLM system prompts calibrated for each difficulty mode, the Easy/Hard segmented control on the landing page, difficulty carried through URL query params across the entire session, and three distinct error states (generation failure, bad JSON, explanation failure) each with in-theme copy.

### Prompt 3 — Leaderboard, title polish, README

> "Let's do the leaderboard. Save the top 5 highest streaks in localStorage — each entry should record the Score/Streak, Topic, and Difficulty. Display it on the home page. Change the color of 'Answers' in the title — it isn't very visible. And generate a final README."

This produced: the `useGameState` hook extended with `saveToLeaderboard` and `leaderboard` state, auto-save on round completion, a collapsible leaderboard panel on the home page with rank badges and difficulty tags, the "ANSWERS" title word updated to electric yellow (`--accent`), and this README.

---

## What I Would Do With More Time

### Multiplayer (WebSockets)
Add a real-time head-to-head mode: two players get the same question simultaneously, and whoever picks the "most convincingly wrong" answer wins the round. Implemented with Socket.io rooms — no persistent game state needed, just in-memory round coordination.

### Audio / Sound Design
Wrong-answer reveal deserves a sound effect. A short "BZZZT" on answer selection and a comedic game-show-style sting when the roast appears would massively lift the feel. The OpenAI `gpt-audio` model could even generate voiced roasts.

### Global Leaderboard
Replace `localStorage` with a Postgres table. Each entry: `{ username, streak, topic, difficulty, created_at }`. Add a server-rendered leaderboard page showing the all-time top 20 streaks across all players — makes the game social.

### Shareable Results
Generate a shareable image (using `@vercel/og` or canvas) showing your streak, topic, and difficulty — styled like a report card. "I got a 7-streak on Hard Mode / Quantum Physics. Can you beat it?"

### Topic Categories & Browse Mode
Instead of free-text topic input, offer a browsable grid of categories (Science, History, Pop Culture, Sports, etc.) with difficulty ratings. Makes the entry point faster and guides players toward topics that generate funnier wrong answers.

### Streak Defense Mode
After a long streak, introduce "Streak Defense" questions — harder, more obscure topics — with higher-stakes wrong answers. Adds tension to deep runs.

### Admin Prompt Tuning Interface
An internal page where you can compare Easy vs Hard answer quality side-by-side for a given topic, tweak the system prompt, and A/B test LLM output — useful for improving answer quality over time without redeploying.
