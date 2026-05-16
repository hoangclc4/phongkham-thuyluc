import { formatDate, formatDateTime } from '@/lib/formatDate';

describe('formatDate', () => {
  it('formats ISO string to dd/MM/yyyy in VN timezone', () => {
    // 2024-12-15T03:00:00Z = 2024-12-15T10:00:00+07:00
    const result = formatDate('2024-12-15T03:00:00.000Z');
    expect(result).toBe('15/12/2024');
  });

  it('applies timezone offset correctly (midnight UTC = same day +7h in VN)', () => {
    // 2024-12-15T00:00:00Z = 2024-12-15T07:00:00+07:00 → still Dec 15
    const result = formatDate('2024-12-15T00:00:00.000Z');
    expect(result).toBe('15/12/2024');
  });

  it('handles late UTC time that crosses into next day in VN', () => {
    // 2024-12-15T18:00:00Z = 2024-12-16T01:00:00+07:00 → Dec 16 in VN
    const result = formatDate('2024-12-15T18:00:00.000Z');
    expect(result).toBe('16/12/2024');
  });

  it('accepts custom format pattern', () => {
    const result = formatDate('2024-12-15T03:00:00.000Z', 'yyyy-MM-dd');
    expect(result).toBe('2024-12-15');
  });

  it('formats month and day with leading zeros', () => {
    const result = formatDate('2024-01-05T03:00:00.000Z');
    expect(result).toBe('05/01/2024');
  });
});

describe('formatDateTime', () => {
  it('formats ISO string to dd/MM/yyyy HH:mm in VN timezone', () => {
    // 2024-12-15T03:30:00Z = 2024-12-15T10:30:00+07:00
    const result = formatDateTime('2024-12-15T03:30:00.000Z');
    expect(result).toBe('15/12/2024 10:30');
  });

  it('includes time in HH:mm format', () => {
    // 2024-12-15T00:05:00Z = 2024-12-15T07:05:00+07:00
    const result = formatDateTime('2024-12-15T00:05:00.000Z');
    expect(result).toBe('15/12/2024 07:05');
  });
});
