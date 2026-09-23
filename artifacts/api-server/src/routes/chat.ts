import { Router, type IRouter } from "express";
import { SendChatBody, SendChatResponse } from "@workspace/api-zod";
import { ZEDKING_SYSTEM_PROMPT } from "../../../../shared/zedking-system-prompt";

const router: IRouter = Router();

type GroqResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

const PRIMARY_MODEL = "llama-3.3-70b-versatile";
const FALLBACK_MODELS = ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "llama-3.1-8b-instant"];

function requestGroq(apiKey: string, model: string, messages: Array<{ role: "system" | "user" | "assistant"; content: string }>) {
  return fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.45,
      max_tokens: 450,
    }),
  });
}

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
    let groqResponse = await requestGroq(apiKey, PRIMARY_MODEL, groqMessages);

    if (groqResponse.status === 404) {
      const primaryError = (await groqResponse.text()).slice(0, 500);
      req.log.warn(
        { model: PRIMARY_MODEL, providerError: primaryError },
        "Primary Groq model is unavailable; trying fallback models",
      );
      for (const fallbackModel of FALLBACK_MODELS) {
        groqResponse = await requestGroq(apiKey, fallbackModel, groqMessages);
        if (groqResponse.status !== 404) break;
        req.log.warn(
          { model: fallbackModel, providerError: (await groqResponse.text()).slice(0, 500) },
          "Groq fallback model is unavailable",
        );
      }
    }

    if (!groqResponse.ok) {
      const providerError = (await groqResponse.text()).slice(0, 500);
      req.log.error({ status: groqResponse.status, providerError }, "Groq API request failed");
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