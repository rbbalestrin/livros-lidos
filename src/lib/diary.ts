/** A `YYYY-MM-DD` day as a local date at noon, so no time zone can move it to another day. */
export function localDate(isoDay: string): Date {
	const [year, month, day] = isoDay.split('-').map(Number);
	return new Date(year, month - 1, day, 12);
}

export type MonthGroup<T> = { month: string; year: number; entries: T[] };

/** Groups entries already sorted by `finishedOn` into runs of the same `YYYY-MM`, keeping order. */
export function groupByMonth<T extends { finishedOn: string }>(entries: T[]): MonthGroup<T>[] {
	const groups: MonthGroup<T>[] = [];
	for (const entry of entries) {
		const month = entry.finishedOn.slice(0, 7);
		const last = groups.at(-1);
		if (last?.month === month) last.entries.push(entry);
		else groups.push({ month, year: Number(month.slice(0, 4)), entries: [entry] });
	}
	return groups;
}
