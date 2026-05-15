import { formatVND } from '@/lib/formatVND';

describe('formatVND', () => {
  it('formats a standard amount', () => {
    const result = formatVND(1500000);
    expect(result).toContain('1.500.000');
    expect(result).toMatch(/₫|VND/);
  });

  it('formats zero', () => {
    const result = formatVND(0);
    expect(result).toContain('0');
    expect(result).toMatch(/₫|VND/);
  });

  it('formats a small amount', () => {
    const result = formatVND(50000);
    expect(result).toContain('50.000');
  });

  it('formats a large amount (10M)', () => {
    const result = formatVND(10000000);
    expect(result).toContain('10.000.000');
  });

  it('returns a string', () => {
    expect(typeof formatVND(100000)).toBe('string');
  });
});
