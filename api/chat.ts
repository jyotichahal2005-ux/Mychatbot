import { ZEDKING_SYSTEM_PROMPT } from "../shared/zedking-system-prompt";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type GroqResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return json({ error: "The assistant is temporarily unavailable. Please call the institute team." }, 503);
  }

  let body: { messages?: unknown };
  try {
    body = (await request.json()) as { messages?: unknown };
  } catch {
    return json({ error: "Please send a valid chat message." }, 400);
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (
    messages.length < 1 ||
    messages.length > 30 ||
    !messages.every(
      (message): message is ChatMessage =>
        typeof message === "object" &&
        message !== null &&
        ((message as ChatMessage).role === "user" || (message as ChatMessage).role === "assistant") &&
        typeof (message as ChatMessage).content === "string" &&
        (message as ChatMessage).content.length > 0 &&
        (message as ChatMessage).content.length <= 4000,
    )
  ) {
    return json({ error: "Please send a valid chat message." }, 400);
  }

  try {
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: ZEDKING_SYSTEM_PROMPT }, ...messages.slice(-16)],
        temperature: 0.45,
        max_tokens: 450,
      }),
    });

    if (!groqResponse.ok) {
      return json({ error: "The assistant could not respond right now. Please try again or call the institute." }, 502);
    }

    const payload = (await groqResponse.json()) as GroqResponse;
    const message = payload.choices?.[0]?.message?.content?.trim();
    if (!message) {
      return json({ error: "The assistant returned an empty response. Please try again." }, 502);
    }

    return json({ message });
  } catch {
    return json({ error: "The assistant is having trouble connecting. Please try again shortly." }, 502);
  }
}