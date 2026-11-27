import { describe, expect, it } from 'vitest';
import { splitInlineCode } from './inline';

describe('splitInlineCode', () => {
  it('returns plain text as a single part', () => {
    expect(splitInlineCode('plain')).toEqual([{ code: false, text: 'plain' }]);
  });

  it('splits backtick code spans', () => {
    expect(splitInlineCode('Use `SELECT FOR UPDATE` here')).toEqual([
      { code: false, text: 'Use ' },
      { code: true, text: 'SELECT FOR UPDATE' },
      { code: false, text: ' here' },
    ]);
  });

  it('treats an unmatched backtick as plain text', () => {
    expect(splitInlineCode('a ` b')).toEqual([{ code: false, text: 'a ` b' }]);
  });
});
