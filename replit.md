# Zedking Assistant

Professional bilingual AI chat assistant for Zed-King Group of Institute in Kaithal, Haryana.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `GROQ_API_KEY` — Groq API key for server-side chat requests

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/zedking-assistant/src/App.tsx` — responsive chat UI and generated chat hook integration
- `artifacts/zedking-assistant/src/index.css` — Zed-King visual theme and responsive styling
- `artifacts/api-server/src/routes/chat.ts` — Replit API route for `/api/chat`
- `api/chat.ts` — Vercel serverless equivalent for `/api/chat`
- `shared/zedking-system-prompt.ts` — canonical institute knowledge base and assistant behavior
- `lib/api-spec/openapi.yaml` — source-of-truth chat contract and generated client schemas
- `vercel.json` — Vercel build/output configuration

## Architecture decisions

- The frontend uses the generated OpenAPI client hook so Replit preview and Vercel builds share the same `/api/chat` contract.
- The Groq key is read only by server-side handlers; it is never exposed through Vite or client code.
- The API has both a shared Express route for Replit and a Vercel function for zero-change deployment.

## Product

- Students can ask about 20+ computer courses, fees, durations, admission, location, coaching, batch timings, and institute contact details.
- The assistant supports English, Hindi, and natural Hinglish responses with a short, warm, enrollment-oriented tone.
- The UI includes quick prompts, typing feedback, retry handling, mobile navigation, and a new-conversation reset.

## User preferences

- Use Zed-King blue/orange brand cues and the name “Zedking Assistant”.
- Keep the assistant warm, professional, concise, and sales-friendly.

## Gotchas

- Vercel builds use default Vite `PORT` and `BASE_PATH` values when Replit workflow variables are absent.
- Add or change the assistant knowledge base in `shared/zedking-system-prompt.ts` so both runtimes stay aligned.
- The requested `llama-3.3-70b-versatile` model may be unavailable for some Groq keys; the server retries current Groq production models before returning an error.
- Vercel's root `api/chat.ts` must use the Node serverless `(req, res)` signature and write through `res`; returning a Web `Response` is ignored by Vercel's Node function adapter.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
