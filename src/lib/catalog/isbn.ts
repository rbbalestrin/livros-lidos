const digitsOnly = (raw: string) => raw.replace(/[^0-9Xx]/g, '').toUpperCase();

const isValidIsbn10 = (isbn: string) => {
	if (!/^[0-9]{9}[0-9X]$/.test(isbn)) return false;
	const sum = [...isbn].reduce(
		(acc, char, index) => acc + (char === 'X' ? 10 : Number(char)) * (10 - index),
		0
	);
	return sum % 11 === 0;
};

const isbn13CheckDigit = (first12: string) => {
	const sum = [...first12].reduce(
		(acc, char, index) => acc + Number(char) * (index % 2 === 0 ? 1 : 3),
		0
	);
	return String((10 - (sum % 10)) % 10);
};

const isValidIsbn13 = (isbn: string) =>
	/^97[89][0-9]{10}$/.test(isbn) && isbn13CheckDigit(isbn.slice(0, 12)) === isbn[12];

/** Returns a valid ISBN-13 for any ISBN-10 or ISBN-13 input, or undefined. */
export const toIsbn13 = (raw: string): string | undefined => {
	const isbn = digitsOnly(raw);
	if (isbn.length === 13) return isValidIsbn13(isbn) ? isbn : undefined;
	if (isbn.length === 10 && isValidIsbn10(isbn)) {
		const first12 = `978${isbn.slice(0, 9)}`;
		return first12 + isbn13CheckDigit(first12);
	}
	return undefined;
};

export const looksLikeIsbn = (query: string) => toIsbn13(query) !== undefined;

/** ISBN-13 prefixes assigned to Brazil: 978-85 and 978-65. */
export const isBrazilianIsbn = (isbn13: string) =>
	isbn13.startsWith('97885') || isbn13.startsWith('97865');

/** Picks the edition ISBN we should look up first: Brazilian editions win. */
export const preferredIsbn13 = (isbns: readonly string[]): string | undefined => {
	const valid = [...new Set(isbns.map(toIsbn13).filter((isbn) => isbn !== undefined))];
	return valid.find(isBrazilianIsbn) ?? valid[0];
};
