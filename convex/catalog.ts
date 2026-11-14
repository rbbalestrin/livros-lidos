import { v } from 'convex/values';
import { Effect } from 'effect';
import { searchCatalog } from '../src/lib/catalog/sources';
import { internal } from './_generated/api';
import type { Doc } from './_generated/dataModel';
import { action, internalMutation } from './_generated/server';
import { bookFields } from './schema';

/** Searches the outside sources and stores what it found, so diary entries point at our own book ids. */
export const search = action({
	args: { query: v.string() },
	handler: async (ctx, { query }): Promise<Doc<'books'>[]> => {
		const found = await Effect.runPromise(
			searchCatalog(query.slice(0, 200), { googleBooksApiKey: process.env.GOOGLE_BOOKS_API_KEY })
		);
		if (!found.length) return [];
		return await ctx.runMutation(internal.catalog.upsertBooks, { books: found });
	}
});

export const upsertBooks = internalMutation({
	args: { books: v.array(v.object(bookFields)) },
	handler: async (ctx, { books }) => {
		const saved: Doc<'books'>[] = [];
		for (const book of books) {
			const existing = await ctx.db
				.query('books')
				.withIndex('by_key', (q) => q.eq('key', book.key))
				.unique();
			let id;
			if (existing) {
				// A later search can miss a field an earlier one found; keep the old value then.
				const patch = Object.fromEntries(
					Object.entries(book).filter(([, value]) => value !== undefined)
				);
				await ctx.db.patch(existing._id, {
					...patch,
					sourceIds: { ...existing.sourceIds, ...book.sourceIds },
					fieldSources: { ...existing.fieldSources, ...book.fieldSources },
					updatedAt: Date.now()
				});
				id = existing._id;
			} else {
				id = await ctx.db.insert('books', { ...book, updatedAt: Date.now() });
			}
			const doc = await ctx.db.get(id);
			if (doc) saved.push(doc);
		}
		return saved;
	}
});
