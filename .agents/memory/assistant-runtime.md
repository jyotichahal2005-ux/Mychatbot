---
name: Assistant runtime split
description: The chatbot serves Replit previews and Vercel deployments through two server-side handlers.
---

The Zedking Assistant keeps a shared institute system prompt while exposing both the Replit Express route and a Vercel serverless function. Both handlers must continue to use the same Groq model and keep `GROQ_API_KEY` server-side.

**Why:** The monorepo preview uses a managed API artifact, while Vercel deploys the static web artifact and discovers functions from the root `api/` directory.

**How to apply:** Update `shared/zedking-system-prompt.ts` whenever institute facts or assistant behavior change, and keep the two handlers' request validation and fallback messages aligned.