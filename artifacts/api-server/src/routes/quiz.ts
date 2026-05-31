import { Router, type IRouter } from "express";
import OpenAI from "openai";
import {
  GenerateQuizBody,
  ExplainAnswerBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SUGGESTED_TOPICS = [
  "The Roman Empire",
  "Quantum Physics",
  "The Human Body",
  "Shakespeare",
  "Space Exploration",
  "Ancient Egypt",
  "The Ocean",
  "Cooking",
  "World War II",
  "Philosophy",
  "The Internet",
  "Football",
  "Dinosaurs",
  "Music Theory",
  "Economics",
];

const SYSTEM_PROMPTS: Record<"easy" | "hard", string> = {
  easy: `You are the host of "Wrong Answers Only" — a quiz game where ALL answers are intentionally, hilariously wrong.

CRITICAL RULE: You MUST generate a question and exactly 4 answers that are ALL factually wrong. There must be NO correct answer. This is the whole joke.

EASY MODE INSTRUCTIONS:
- The wrong answers should be ABSURD and HILARIOUS. Think completely off-the-wall, ridiculous answers.
- Examples of the energy you want: "Quantum physics is a type of artisanal cheese", "Julius Caesar invented the Caesar salad as a peace offering to the Gauls", "The human heart is powered by a tiny hamster on a wheel"
- The answers should make someone laugh out loud. Go weird. Go random. Make them clearly, entertainingly wrong.
- Keep answers concise (under 15 words each)

Respond with JSON in this exact format:
{
  "question": "the question text here",
  "answers": ["absurd wrong answer 1", "absurd wrong answer 2", "absurd wrong answer 3", "absurd wrong answer 4"]
}`,

  hard: `You are the host of "Wrong Answers Only" — a quiz game where ALL answers are intentionally wrong — but in HARD MODE, the wrongness must be deceptive.

CRITICAL RULE: You MUST generate a question and exactly 4 answers that are ALL factually wrong. There must be NO correct answer. This is the whole joke.

HARD MODE INSTRUCTIONS:
- The wrong answers must be DECEPTIVELY CONVINCING. They should sound highly technical, historically plausible, or scientifically credible.
- They should fool someone who knows a little about the topic but not deeply.
- Examples of the energy you want: Instead of a silly answer, give one that uses real-sounding terminology, plausible dates, believable names, or close-but-wrong facts.
- Do NOT include the actual correct answer. All 4 must be wrong, but each must sound completely believable.
- Keep answers concise (under 15 words each)

Respond with JSON in this exact format:
{
  "question": "the question text here",
  "answers": ["deceptive wrong answer 1", "deceptive wrong answer 2", "deceptive wrong answer 3", "deceptive wrong answer 4"]
}`,
};

router.get("/quiz/topics", async (_req, res): Promise<void> => {
  const shuffled = [...SUGGESTED_TOPICS].sort(() => Math.random() - 0.5);
  res.json({ topics: shuffled.slice(0, 8) });
});

router.post("/quiz/generate", async (req, res): Promise<void> => {
  const parsed = GenerateQuizBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { topic, difficulty = "easy" } = parsed.data;
  const systemPrompt = SYSTEM_PROMPTS[difficulty as "easy" | "hard"] ?? SYSTEM_PROMPTS.easy;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 600,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Topic: ${topic}` },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      res.status(500).json({ error: "No response from AI" });
      return;
    }

    let parsed_response: { question: string; answers: string[] };
    try {
      parsed_response = JSON.parse(content) as { question: string; answers: string[] };
    } catch {
      req.log.error({ content }, "AI returned invalid JSON");
      res.status(500).json({ error: "AI returned unparseable response" });
      return;
    }

    if (
      !parsed_response.question ||
      !Array.isArray(parsed_response.answers) ||
      parsed_response.answers.length !== 4
    ) {
      req.log.error({ parsed_response }, "AI returned malformed quiz structure");
      res.status(500).json({ error: "AI returned malformed quiz structure" });
      return;
    }

    res.json({
      question: parsed_response.question,
      answers: parsed_response.answers,
      topic,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to generate quiz question");
    res.status(500).json({ error: "Failed to generate question" });
  }
});

router.post("/quiz/explain", async (req, res): Promise<void> => {
  const parsed = ExplainAnswerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { question, selectedAnswer, topic } = parsed.data;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content: `You are the witty host of "Wrong Answers Only" — a quiz game where every answer is intentionally wrong.

When a player picks an answer, explain WHY it's wrong in a funny, slightly roasting way. Be clever, sharp, entertaining. Keep it to 2-3 sentences max. Reference the actual correct answer briefly, then mock their choice affectionately. Never be mean-spirited, just playful.`,
        },
        {
          role: "user",
          content: `Topic: ${topic}\nQuestion: ${question}\nThe player chose: "${selectedAnswer}"\n\nGive a witty explanation of why this wrong answer is wrong.`,
        },
      ],
    });

    const explanation = completion.choices[0]?.message?.content;
    if (!explanation) {
      res.status(500).json({ error: "No response from AI" });
      return;
    }

    res.json({ explanation });
  } catch (err) {
    req.log.error({ err }, "Failed to generate explanation");
    res.status(500).json({ error: "Failed to generate explanation" });
  }
});

export default router;
