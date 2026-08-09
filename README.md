# ReleaseCanvas

ReleaseCanvas is a release-review workspace for agencies and product teams. Teams upload interface screenshots, pin precise feedback, resolve issues, and record an auditable approval decision before shipping.

## Why this exists

Feedback scattered across chat, email, and meetings is difficult to reconcile. ReleaseCanvas puts the artifact, discussion, checklist, and final decision in one accessible workflow.

## Architecture

```mermaid
flowchart LR
  U[Team and guest reviewers] --> W[Next.js web]
  W --> A[NestJS REST API]
  A --> P[(Supabase Postgres)]
  A --> S[Private Supabase Storage]
  W --> H[Supabase Auth]
  A --> H
```

- `apps/web`: Next.js 16 product and recruiter demo
- `apps/api`: NestJS REST API with OpenAPI and health checks
- `packages/contracts`: shared Zod contracts and release state machine
- `supabase/migrations`: authoritative schema, RLS, and storage policies

## Local development

1. Copy `.env.example` to `.env` and add local Supabase values.
2. Run `pnpm install` and `pnpm dev`.
3. Open `http://localhost:3000`; API docs are at `http://localhost:4000/docs`.

The web app includes a populated recruiter demo. Production mutations require authenticated workspace membership.

## Security model

All tenant records carry `workspace_id`. The API validates JWT claims and membership, while Postgres RLS provides defense in depth. Files are private and accessed through short-lived signed URLs. Guest tokens are stored only as hashes.

## Current milestone

This repository contains the production foundation and an interactive vertical slice. Hosted services, email delivery, customer interviews, and public launch remain explicit release gates.

## Tradeoffs

- Screenshot review first; video and PDF are deferred.
- REST and shared schemas keep the frontend/backend boundary explicit.
- SQL migrations are authoritative; Drizzle is a query layer only.
- Billing is deferred while usage limits remain part of the model.

## License

Copyright © 2026 Vladimir Scofari. Source-available for portfolio review; no license is granted for commercial redistribution.
