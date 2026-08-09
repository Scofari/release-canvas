import { describe, expect, it } from 'vitest';
import { canTransitionRelease, createAnnotationSchema } from './index';

describe('release workflow', () => {
  it('allows review to be approved and prevents approved releases returning to draft', () => {
    expect(canTransitionRelease('in_review', 'approved')).toBe(true);
    expect(canTransitionRelease('approved', 'draft')).toBe(false);
  });
  it('rejects annotation coordinates outside the artifact', () => {
    expect(createAnnotationSchema.safeParse({ artifactVersionId: crypto.randomUUID(), x: 1.2, y: 0.2, title: 'CTA', body: 'Fix contrast', assigneeName: null }).success).toBe(false);
  });
});
