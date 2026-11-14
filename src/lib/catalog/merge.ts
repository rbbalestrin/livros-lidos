export type SourceName = 'brasilApi' | 'googleBooks' | 'openLibrary';

/** What one catalog source says about one book. */
export type SourceRecord = {
	source: SourceName;
	sourceId: string;
	title: string;
	subtitle?: string;
	authors: string[];
	isbn13?: string;
	year?: number;
	pages?: number;
	publisher?: string;
	coverUrl?: string;
	language?: string;
};

export const mergedFields = [
	'title',
	'subtitle',
	'authors',
	'year',
	'pages',
	'publisher',
	'coverUrl',
	'language'
] as const;
export type MergedField = (typeof mergedFields)[number];

/** One book after crossing every source that described it. */
export type MergedBook = {
	key: string;
	title: string;
	subtitle?: string;
	authors: string[];
	isbn13?: string;
	year?: number;
	pages?: number;
	publisher?: string;
	coverUrl?: string;
	language?: string;
	sourceIds: Partial<Record<SourceName, string>>;
	fieldSources: Partial<Record<MergedField, SourceName>>;
};

// CBL, behind BrasilAPI, is the Brazilian ISBN registry, so it wins on
// edition facts. Open Library has the best covers.
const priority: Record<MergedField, readonly SourceName[]> = {
	title: ['brasilApi', 'googleBooks', 'openLibrary'],
	subtitle: ['brasilApi', 'googleBooks', 'openLibrary'],
	authors: ['brasilApi', 'googleBooks', 'openLibrary'],
	year: ['brasilApi', 'googleBooks', 'openLibrary'],
	pages: ['brasilApi', 'googleBooks', 'openLibrary'],
	publisher: ['brasilApi', 'googleBooks', 'openLibrary'],
	coverUrl: ['openLibrary', 'googleBooks', 'brasilApi'],
	language: ['googleBooks', 'openLibrary', 'brasilApi']
};

const hasValue = (value: unknown) =>
	value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && !value.length);

// Registries often store "DOM CASMURRO" or "machado de assis", without
// accents. Any source with normal casing beats that, whatever its priority.
const hasNormalCasing = (value: unknown): boolean => {
	if (Array.isArray(value)) return value.every(hasNormalCasing);
	if (typeof value !== 'string' || !/\p{L}/u.test(value)) return true;
	return value !== value.toUpperCase() && value !== value.toLowerCase();
};

const pick = <F extends MergedField>(records: readonly SourceRecord[], field: F) => {
	const ranked = priority[field].flatMap((source) =>
		records.filter((r) => r.source === source && hasValue(r[field]))
	);
	const record = ranked.find((r) => hasNormalCasing(r[field])) ?? ranked[0];
	return record ? { value: record[field], source: record.source } : undefined;
};

const mergeGroup = (key: string, records: readonly SourceRecord[]): MergedBook => {
	const book: MergedBook = {
		key,
		title: '',
		authors: [],
		isbn13: records.find((r) => r.isbn13)?.isbn13,
		sourceIds: {},
		fieldSources: {}
	};
	for (const record of records) book.sourceIds[record.source] ??= record.sourceId;
	for (const field of mergedFields) {
		const picked = pick(records, field);
		if (!picked) continue;
		(book as Record<MergedField, unknown>)[field] = picked.value;
		book.fieldSources[field] = picked.source;
	}
	return book;
};

/**
 * Groups records that share an ISBN-13 and merges each group field by field.
 * Records without an ISBN stay on their own. Order follows the first time a
 * group appears in `records`.
 */
export const mergeRecords = (records: readonly SourceRecord[]): MergedBook[] => {
	const groups = new Map<string, SourceRecord[]>();
	for (const record of records) {
		if (!record.title) continue;
		const key = record.isbn13 ? `isbn:${record.isbn13}` : `${record.source}:${record.sourceId}`;
		const group = groups.get(key);
		if (group) group.push(record);
		else groups.set(key, [record]);
	}
	return [...groups].map(([key, group]) => mergeGroup(key, group));
};
