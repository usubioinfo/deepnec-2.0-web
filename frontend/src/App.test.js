// Author: Naveen Duhan
import { describe, expect, test } from 'vitest';
import env from './env';

describe('runtime configuration', () => {
  test('uses the mounted application base path', () => {
    expect(env.BASE_URL).toBe('/deepnec-2.0');
  });
});
