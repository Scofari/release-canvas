import { describe, expect, it } from 'vitest';
import { ReleasesService } from '../src/releases.service.js';

describe('ReleasesService', () => {
  it('records a valid decision transition and rejects rewriting approval', () => {
    const service = new ReleasesService();
    expect(service.transition('approved').status).toBe('approved');
    expect(() => service.transition('draft')).toThrow();
  });
});
