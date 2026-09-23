import { Router, type IRouter } from "express";
import { SendChatBody, SendChatResponse } from "@workspace/api-zod";
import { ZEDKING_SYSTEM_PROMPT } from "../../../../shared/zedking-system-prompt";

const router: IRouter = Router();

type GroqResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

router.post("/chat", async (req, res) => {
  const parsed = SendChatBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Please send a valid chat message." });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    req.log.error("GROQ_API_KEY is not configured");
    res.status(503).json({ error: "The assistant is temporarily unavailable. Please call the institute team." });
    return;
  }

  const groqMessages = [
    { role: "system" as const, content: ZEDKING_SYSTEM_PROMPT },
    ...parsed.data.messages.slice(-16),
  ];

  try {
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: groqMessages,
        temperature: 0.45,
        max_tokens: 450,
      }),
    });

    if (!groqResponse.ok) {
      req.log.error({ status: groqResponse.status }, "Groq API request failed");
      res.status(502).json({ error: "The assistant could not respond right now. Please try again or call the institute." });
      return;
    }

    const payload = (await groqResponse.json()) as GroqResponse;
    const message = payload.choices?.[0]?.message?.content?.trim();

    if (!message) {
      req.log.error("Groq API returned an empty response");
      res.status(502).json({ error: "The assistant returned an empty response. Please try again." });
      return;
    }

    res.json(SendChatResponse.parse({ message }));
  } catch (error) {
    req.log.error({ err: error }, "Unexpected chat provider error");
    res.status(502).json({ error: "The assistant is having trouble connecting. Please try again shortly." });
  }
});

export default router;