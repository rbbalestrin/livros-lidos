import { describe, expect, it } from 'vitest';
import { isBrazilianIsbn, preferredIsbn13, toIsbn13 } from './isbn';
import { mergeRecords, type SourceRecord } from './merge';

describe('toIsbn13', () => {
	it('keeps a valid ISBN-13 and strips hyphens', () => {
		expect(toIsbn13('978-65-80309-31-3')).toBe('9786580309313');
	});

	it('converts ISBN-10 to ISBN-13', () => {
		expect(toIsbn13('6580309318')).toBe('9786580309313');
	});

	it('rejects a wrong check digit', () => {
		expect(toIsbn13('9786580309314')).toBeUndefined();
	});
});

describe('preferredIsbn13', () => {
	it('prefers a Brazilian edition over a translation', () => {
		const isbns = ['9781839766428', '6580309318', '9789896605773'];
		expect(preferredIsbn13(isbns)).toBe('9786580309313');
		expect(isBrazilianIsbn('9781839766428')).toBe(false);
	});
});

describe('mergeRecords', () => {
	const openLibrary: SourceRecord = {
		source: 'openLibrary',
		sourceId: '/works/OL24141556W',
		title: 'Torto Arado',
		authors: ['Itamar Vieira Junior'],
		isbn13: '9786580309313',
		year: 2019,
		coverUrl: 'https://covers.openlibrary.org/b/id/12369648-M.jpg',
		language: 'por'
	};
	const brasilApi: SourceRecord = {
		source: 'brasilApi',
		sourceId: '9786580309313',
		title: 'Torto arado',
		authors: ['Itamar Vieira Junior'],
		isbn13: '9786580309313',
		year: 2019,
		pages: 264,
		publisher: 'Todavia Editora'
	};

	it('joins sources that share an ISBN and records where each field came from', () => {
		const [book, ...rest] = mergeRecords([openLibrary, brasilApi]);
		expect(rest).toHaveLength(0);
		expect(book).toMatchObject({
			key: 'isbn:9786580309313',
			title: 'Torto arado',
			pages: 264,
			publisher: 'Todavia Editora',
			coverUrl: openLibrary.coverUrl,
			sourceIds: { openLibrary: '/works/OL24141556W', brasilApi: '9786580309313' },
			fieldSources: { title: 'brasilApi', coverUrl: 'openLibrary', pages: 'brasilApi' }
		});
	});

	it('prefers normal casing over an all-caps registry title', () => {
		const shouting = { ...brasilApi, title: 'TORTO ARADO' };
		const [book] = mergeRecords([openLibrary, shouting]);
		expect(book).toMatchObject({ title: 'Torto Arado', fieldSources: { title: 'openLibrary' } });
	});

	it('keeps books without ISBN apart', () => {
		const noIsbn = { ...openLibrary, sourceId: '/works/OL1W', isbn13: undefined };
		expect(mergeRecords([noIsbn, brasilApi])).toHaveLength(2);
	});
});
