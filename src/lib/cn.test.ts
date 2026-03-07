import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn utility', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    const hidden = false;
    expect(cn('base', hidden ? 'hidden' : undefined, 'visible')).toBe('base visible');
  });

  it('handles undefined and null', () => {
    expect(cn('a', undefined, null, 'b')).toBe('a b');
  });

  it('handles empty input', () => {
    expect(cn()).toBe('');
  });

  it('handles object syntax', () => {
    expect(cn({ active: true, disabled: false })).toBe('active');
  });

  it('handles array syntax', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c');
  });
});
