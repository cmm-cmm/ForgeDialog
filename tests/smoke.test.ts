import { describe, expect, it } from 'vitest';
import { VERSION } from '../src/index';
import packageJson from '../package.json';

describe('smoke', () => {
  it('exports a version', () => {
    expect(VERSION).toBe(packageJson.version);
  });
});
