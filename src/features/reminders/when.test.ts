import { reminderAt, reminderDay } from './when';

describe('reminder timing', () => {
  it('goes out at 9:00 the chosen number of days before', () => {
    expect(reminderDay('2026-10-18', 'threeDays')).toBe('2026-10-15');
    expect(reminderDay('2026-10-18', 'oneDay')).toBe('2026-10-17');
    expect(reminderDay('2026-10-18', 'morningOf')).toBe('2026-10-18');
    const at = reminderAt('2026-11-01', 'oneDay');
    expect([at.getFullYear(), at.getMonth(), at.getDate(), at.getHours(), at.getMinutes()]).toEqual([
      2026, 9, 31, 9, 0,
    ]);
  });
});
