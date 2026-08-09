import { describe, expect, it } from 'vitest';
import { canApproveRelease } from './review-policy';

describe('review approval policy', () => {
  it('blocks approval until all annotations are resolved', () => {
    expect(canApproveRelease([{ resolved: true }, { resolved: false }])).toBe(false);
    expect(canApproveRelease([{ resolved: true }, { resolved: true }])).toBe(true);
  });
});
