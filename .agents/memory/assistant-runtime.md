---
name: Assistant runtime split
description: The chatbot serves Replit previews and Vercel deployments through two server-side handlers.
---

The Zedking Assistant keeps a shared institute system prompt while exposing both the Replit Express route and a Vercel serverless function. Both handlers must keep `GROQ_API_KEY` server-side and try the requested Llama model first, then current Groq production fallbacks when the key lacks model access.

**Why:** The monorepo preview uses a managed API artifact, while Vercel deploys the static web artifact and discovers functions from the root `api/` directory.

**How to apply:** Update `shared/zedking-system-prompt.ts` whenever institute facts or assistant behavior change, and keep the two handlers' request validation, model fallback order, and user-facing errors aligned.

Vercel type-checks the root `api/chat.ts` with the repository's root TypeScript settings, so serverless web globals need DOM library types even though the Replit Express package has its own Node-oriented config.

**Why:** The frontend bundle built successfully on Vercel, but deployment stopped during API type-checking because the root config exposed only `es2022` types.

**How to apply:** When adding root Vercel functions, verify their globals against the root `tsconfig.json`; do not assume an artifact package's `tsconfig` applies to `api/*`.