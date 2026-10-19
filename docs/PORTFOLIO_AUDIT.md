# Portfolio audit — October 20, 2026

Source reviewed: `13765f9` on public `main`. The original local checkout had unrelated changes in `apps/api/src/releases.controller.ts` and `apps/web/app/app/workspace-app.tsx`; verification used a separate clean clone and did not alter those changes.

## Verification

| Check | Result |
| --- | --- |
| Locked dependency install | Pass using pinned pnpm 11.16.0 |
| `pnpm lint` | Pass; current scripts run TypeScript checks |
| `pnpm typecheck` | Pass, all three packages |
| `pnpm test` | Six tests pass across four files |
| `pnpm build` | Contracts, NestJS API, and Next.js production build pass |
| Production-mode local `/demo` | Rendered using synthetic local Supabase environment placeholders, no authenticated session |
| Demo approval policy | Open annotations block approval; resolving all three permits the local Approved state |
| Mobile viewport | 390 × 844 CSS pixels; document width 375, no horizontal document overflow |
| Hosted web `/demo` | HTTP 503, `DEPLOYMENT_PAUSED` |
| Configured Railway API `/v1/health` | HTTP 404, `Application not found` |
| Live Auth/RLS/Storage/guest integration | Not reverified; local Docker daemon was not running |

The first offline install attempt could not verify/download the pinned package-manager release under restricted network access. With normal network access, the signed package manager and locked dependencies installed successfully. No signature verification was disabled.

## Documentation corrections

The README now separates the component-state demo from the connected product, gives app-root Next.js environment setup, and explains that the NestJS entrypoint needs process environment variables. It preserves the existing source-available redistribution restriction and supporting security/delivery documents.

The authenticated approval path invokes a transactional SQL function. The guest Edge Function performs multiple separate writes; equivalent atomicity/concurrency guarantees are not claimed. The API currently uses Supabase clients; the old Drizzle statement was removed because there is no corresponding runtime dependency.

Fresh [desktop/mobile screenshots](screenshots/README.md) show fictional data in the actual local production demo. The hosted service remains unavailable; local UI success is not proof of a functioning deployed backend.
