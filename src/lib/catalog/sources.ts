import { Effect, Schedule } from 'effect';
import { isBrazilianIsbn, looksLikeIsbn, preferredIsbn13, toIsbn13 } from './isbn';
import { mergeRecords, type MergedBook, type SourceRecord } from './merge';

const userAgent = 'LivrosLidos/0.1 (catalog lookup)';

class SourceError {
	readonly _tag = 'SourceError';
	constructor(
		readonly source: string,
		readonly detail: string
	) {}
}

const getJson = (source: string, url: string) =>
	Effect.tryPromise({
		try: async (signal) => {
			const response = await fetch(url, { signal, headers: { 'User-Agent': userAgent } });
			// BrasilAPI answers 400 for an ISBN it does not know.
			if (response.status === 404 || response.status === 400) return undefined;
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			return (await response.json()) as unknown;
		},
		catch: (error) => new SourceError(source, String(error))
	}).pipe(
		Effect.timeout('5 seconds'),
		Effect.retry({ schedule: Schedule.exponential('200 millis'), times: 1 })
	);

/** A source that fails or times out contributes nothing instead of failing the search. */
const tolerant = <A>(effect: Effect.Effect<A[], unknown>) =>
	effect.pipe(
		Effect.tapError((error) => Effect.logWarning('catalog source failed', error)),
		Effect.orElseSucceed((): A[] => [])
	);

const str = (value: unknown) =>
	typeof value === 'string' && value.trim() ? value.trim() : undefined;
const num = (value: unknown) => (typeof value === 'number' && value > 0 ? value : undefined);
const strings = (value: unknown) =>
	Array.isArray(value) ? value.map(str).filter((s) => s !== undefined) : [];
const yearOf = (value: unknown) => {
	if (typeof value === 'number') return value;
	const match = typeof value === 'string' ? /\d{4}/.exec(value) : null;
	return match ? Number(match[0]) : undefined;
};
const https = (url: string | undefined) => url?.replace(/^http:/, 'https:');

// Open Library ------------------------------------------------------------

type OpenLibraryDoc = {
	key?: unknown;
	title?: unknown;
	subtitle?: unknown;
	author_name?: unknown;
	isbn?: unknown;
	first_publish_year?: unknown;
	number_of_pages_median?: unknown;
	cover_i?: unknown;
	language?: unknown;
};

const openLibraryFields =
	'key,title,subtitle,author_name,isbn,first_publish_year,number_of_pages_median,cover_i,language';

const fromOpenLibrary = (doc: OpenLibraryDoc): SourceRecord | undefined => {
	const title = str(doc.title);
	const key = str(doc.key);
	if (!title || !key) return undefined;
	const languages = strings(doc.language);
	return {
		source: 'openLibrary',
		sourceId: key,
		title,
		subtitle: str(doc.subtitle),
		authors: [...new Set(strings(doc.author_name))].slice(0, 3),
		isbn13: preferredIsbn13(strings(doc.isbn)),
		year: num(doc.first_publish_year),
		pages: num(doc.number_of_pages_median),
		coverUrl:
			typeof doc.cover_i === 'number'
				? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
				: undefined,
		language: languages.includes('por') ? 'por' : languages[0]
	};
};

const searchOpenLibrary = (params: Record<string, string>, limit: number) =>
	tolerant(
		getJson(
			'openLibrary',
			`https://openlibrary.org/search.json?${new URLSearchParams({ ...params, limit: String(limit), fields: openLibraryFields })}`
		).pipe(
			Effect.map((body) => {
				const docs = (body as { docs?: OpenLibraryDoc[] } | undefined)?.docs ?? [];
				return docs.map(fromOpenLibrary).filter((r) => r !== undefined);
			})
		)
	);

// BrasilAPI (CBL and other Brazilian registries) ----------------------------

const lookupBrasilApi = (isbn13: string) =>
	tolerant(
		getJson('brasilApi', `https://brasilapi.com.br/api/isbn/v1/${isbn13}`).pipe(
			Effect.map((body): SourceRecord[] => {
				const b = body as Record<string, unknown> | undefined;
				const title = str(b?.title);
				if (!b || !title) return [];
				return [
					{
						source: 'brasilApi',
						sourceId: isbn13,
						title,
						subtitle: str(b.subtitle),
						authors: strings(b.authors),
						isbn13: toIsbn13(String(b.isbn ?? isbn13)),
						year: num(b.year),
						pages: num(b.page_count),
						publisher: str(b.publisher),
						coverUrl: https(str(b.cover_url))
					}
				];
			})
		)
	);

// Google Books (only with an API key; the anonymous quota is zero) ----------

const searchGoogleBooks = (q: string, apiKey: string | undefined, limit: number) =>
	apiKey
		? tolerant(
				getJson(
					'googleBooks',
					`https://www.googleapis.com/books/v1/volumes?${new URLSearchParams({ q, maxResults: String(limit), key: apiKey })}`
				).pipe(
					Effect.map((body) => {
						const items = (
							body as { items?: { id: string; volumeInfo?: Record<string, unknown> }[] }
						)?.items;
						return (items ?? []).flatMap((item): SourceRecord[] => {
							const info = item.volumeInfo ?? {};
							const title = str(info.title);
							if (!title) return [];
							const ids = (info.industryIdentifiers as { identifier?: string }[] | undefined) ?? [];
							const images = info.imageLinks as Record<string, string> | undefined;
							return [
								{
									source: 'googleBooks',
									sourceId: item.id,
									title,
									subtitle: str(info.subtitle),
									authors: strings(info.authors),
									isbn13: preferredIsbn13(ids.map((i) => i.identifier ?? '')),
									year: yearOf(info.publishedDate),
									pages: num(info.pageCount),
									publisher: str(info.publisher),
									coverUrl: https(images?.thumbnail),
									language: str(info.language) === 'pt' ? 'por' : str(info.language)
								}
							];
						});
					})
				)
			)
		: Effect.succeed([] as SourceRecord[]);

// Search ------------------------------------------------------------------

export type SearchOptions = { googleBooksApiKey?: string; limit?: number };

/**
 * Searches every source, enriches the top Open Library hits with BrasilAPI by
 * ISBN and merges records that describe the same edition.
 */
export const searchCatalog = (query: string, options: SearchOptions = {}) =>
	Effect.gen(function* () {
		const q = query.trim();
		const limit = options.limit ?? 10;
		if (q.length < 2) return [] as MergedBook[];

		if (looksLikeIsbn(q)) {
			const isbn13 = toIsbn13(q)!;
			const found = yield* Effect.all(
				[
					lookupBrasilApi(isbn13),
					searchOpenLibrary({ isbn: isbn13 }, 1),
					searchGoogleBooks(`isbn:${isbn13}`, options.googleBooksApiKey, 1)
				],
				{ concurrency: 'unbounded' }
			);
			return mergeRecords(found.flat().map((r) => ({ ...r, isbn13 })));
		}

		const [openLibrary, google] = yield* Effect.all(
			[searchOpenLibrary({ q }, limit), searchGoogleBooks(q, options.googleBooksApiKey, limit)],
			{ concurrency: 'unbounded' }
		);
		const isbnsToEnrich = [
			...new Set(
				openLibrary
					.slice(0, 6)
					.flatMap((r) => r.isbn13 ?? [])
					.filter(isBrazilianIsbn)
			)
		];
		const brasil = yield* Effect.forEach(isbnsToEnrich, lookupBrasilApi, { concurrency: 4 });
		return mergeRecords([...openLibrary, ...brasil.flat(), ...google]).slice(0, limit);
	});
