# Security model

- All tenant-owned rows include `workspace_id`; API membership checks and RLS are both required.
- Client applications receive only the Supabase publishable key. Secret/service-role keys are server-only.
- Artifact storage is private. Paths begin with the workspace UUID and access is policy-controlled.
- Guest share tokens are generated from cryptographically secure random bytes, stored only as hashes, expire after 30 days, and support revocation.
- Approval decisions are append-only. Database grants and a trigger prevent updates and deletion.
- Upload completion must verify decoded MIME type, dimensions, byte size, path ownership, and recorded object metadata.
- Production release requires negative cross-tenant tests and Supabase security/performance advisor review.
