import { ZEDKING_SYSTEM_PROMPT } from "../shared/zedking-system-prompt";

declare const process: {
  env: Record<string, string | undefined>;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type GroqResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

type VercelRequest = {
  method?: string;
  body?: unknown;
  on(event: "data" | "end" | "error", listener: (...args: unknown[]) => void): VercelRequest;
};

type VercelResponse = {
  statusCode: number;
  setHeader(name: string, value: string): VercelResponse;
  end(body?: string): void;
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

function sendJson(response: VercelResponse, data: unknown, status = 200) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(data));
}

async function readRequestBody(request: VercelRequest): Promise<unknown> {
  if (request.body !== undefined) {
    return request.body;
  }

  let rawBody = "";
  await new Promise<void>((resolve, reject) => {
    request.on("data", (chunk) => {
      if (typeof chunk === "string") {
        rawBody += chunk;
      } else if (chunk instanceof Uint8Array) {
        rawBody += new TextDecoder().decode(chunk);
      }
    });
    request.on("end", () => resolve());
    request.on("error", (error) => reject(error));
  });

  return rawBody ? JSON.parse(rawBody) : {};
}

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, { error: "Method not allowed." }, 405);
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    sendJson(response, { error: "The assistant is temporarily unavailable. Please call the institute team." }, 503);
    return;
  }

  let body: { messages?: unknown };
  try {
    body = (await readRequestBody(request)) as { messages?: unknown };
  } catch {
    sendJson(response, { error: "Please send a valid chat message." }, 400);
    return;
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
    sendJson(response, { error: "Please send a valid chat message." }, 400);
    return;
  }

  try {
    const groqMessages = [{ role: "system" as const, content: ZEDKING_SYSTEM_PROMPT }, ...messages.slice(-16)];
    let groqResponse = await requestGroq(apiKey, PRIMARY_MODEL, groqMessages);

    if (groqResponse.status === 404) {
      await groqResponse.text();
      for (const fallbackModel of FALLBACK_MODELS) {
        groqResponse = await requestGroq(apiKey, fallbackModel, groqMessages);
        if (groqResponse.status !== 404) break;
        await groqResponse.text();
      }
    }

    if (!groqResponse.ok) {
      await groqResponse.text();
      sendJson(response, { error: "The assistant could not respond right now. Please try again or call the institute." }, 502);
      return;
    }

    const payload = (await groqResponse.json()) as GroqResponse;
    const message = payload.choices?.[0]?.message?.content?.trim();
    if (!message) {
      sendJson(response, { error: "The assistant returned an empty response. Please try again." }, 502);
      return;
    }

    sendJson(response, { message });
  } catch {
    sendJson(response, { error: "The assistant is having trouble connecting. Please try again shortly." }, 502);
  }
}