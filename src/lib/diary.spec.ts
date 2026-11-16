import { describe, expect, it } from 'vitest';
import { groupByMonth, localDate } from './diary';

describe('localDate', () => {
	it('keeps the calendar day in the local time zone', () => {
		const date = localDate('2026-01-01');
		expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 0, 1]);
	});
});

describe('groupByMonth', () => {
	it('splits the same month of different years and keeps newest-first order', () => {
		const entries = [
			{ id: 'a', finishedOn: '2026-11-09' },
			{ id: 'b', finishedOn: '2026-11-02' },
			{ id: 'c', finishedOn: '2025-11-30' },
			{ id: 'd', finishedOn: '2025-10-01' }
		];
		expect(groupByMonth(entries).map((g) => [g.month, g.year, g.entries.map((e) => e.id)])).toEqual(
			[
				['2026-11', 2026, ['a', 'b']],
				['2025-11', 2025, ['c']],
				['2025-10', 2025, ['d']]
			]
		);
	});
});
