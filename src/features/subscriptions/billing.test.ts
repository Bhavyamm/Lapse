import { addCycles, describePrice, formatMoney, monthlyCents, nextChargeDate, parsePrice } from './billing';

describe('billing', () => {
  it('keeps the day of the month when rolling forward from the 31st', () => {
    expect(addCycles('2026-01-31', 'month', 1)).toBe('2026-02-28');
    expect(addCycles('2026-01-31', 'month', 2)).toBe('2026-03-31');
  });

  it('adds weeks and years', () => {
    expect(addCycles('2026-10-17', 'week', 2)).toBe('2026-10-31');
    expect(addCycles('2026-10-17', 'year', 1)).toBe('2027-10-17');
  });

  it('returns the entered date when it is today or later', () => {
    expect(nextChargeDate({ chargeOn: '2026-10-17', cycle: 'month' }, '2026-10-17')).toBe('2026-10-17');
    expect(nextChargeDate({ chargeOn: '2026-11-02', cycle: 'month' }, '2026-10-17')).toBe('2026-11-02');
  });

  it('rolls a past date forward by whole cycles', () => {
    expect(nextChargeDate({ chargeOn: '2026-08-31', cycle: 'month' }, '2026-10-17')).toBe('2026-10-31');
    expect(nextChargeDate({ chargeOn: '2026-10-01', cycle: 'week' }, '2026-10-17')).toBe('2026-10-22');
    expect(nextChargeDate({ chargeOn: '2025-02-01', cycle: 'year' }, '2026-10-17')).toBe('2027-02-01');
  });

  it('spreads prices over a month', () => {
    expect(monthlyCents(1199, 'month')).toBe(1199);
    expect(monthlyCents(12000, 'year')).toBe(1000);
    expect(monthlyCents(1000, 'week')).toBe(4333);
  });

  it('formats money with cents and thousands separators', () => {
    expect(formatMoney(1199)).toBe('$11.99');
    expect(formatMoney(5)).toBe('$0.05');
    expect(formatMoney(123456)).toBe('$1,234.56');
  });

  it('describes a price', () => {
    expect(describePrice(1199, 'month')).toBe('$11.99 a month');
    expect(describePrice(799, 'month', true)).toBe('From $7.99 a month');
    expect(describePrice(6999, 'year')).toBe('$69.99 a year');
  });

  it.each([
    ['11.99', 1199],
    ['$11', 1100],
    ['11,5', 1150],
    [' 0.29 ', 29],
    ['15.', 1500],
  ])('reads "%s" as %i cents', (text, cents) => {
    expect(parsePrice(text)).toBe(cents);
  });

  it.each(['', 'abc', '0', '1.999', '-3', '1.2.3'])('rejects "%s"', (text) => {
    expect(parsePrice(text)).toBeNull();
  });
});
