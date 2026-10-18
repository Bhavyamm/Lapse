import { addDays, addMonths, daysBetween, fromLocalDate, monthCells, toLocalDate } from './dates';

describe('local dates', () => {
  it('round-trips a calendar day without shifting it', () => {
    expect(toLocalDate(fromLocalDate('2026-03-08'))).toBe('2026-03-08');
  });

  it('adds days across a month and a year boundary', () => {
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('adds months, clamping to the last day of shorter months', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29');
    expect(addMonths('2026-10-17', 3)).toBe('2027-01-17');
    expect(addMonths('2024-02-29', 12)).toBe('2025-02-28');
  });

  it('counts whole days between dates, including over a daylight saving change', () => {
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2);
    expect(daysBetween('2026-11-02', '2026-10-31')).toBe(-2);
  });
});

describe('monthCells', () => {
  it('pads October 2026 to start on Sunday and fill whole weeks', () => {
    const cells = monthCells(2026, 9);
    expect(cells.slice(0, 5)).toEqual([null, null, null, null, '2026-10-01']);
    expect(cells).toHaveLength(35);
    expect(cells.filter(Boolean)).toHaveLength(31);
  });
});
