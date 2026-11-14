import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export const sourceName = v.union(
	v.literal('brasilApi'),
	v.literal('googleBooks'),
	v.literal('openLibrary')
);

export const bookFields = {
	/** `isbn:<13 digits>` when known, otherwise `<source>:<id>`. */
	key: v.string(),
	title: v.string(),
	subtitle: v.optional(v.string()),
	authors: v.array(v.string()),
	isbn13: v.optional(v.string()),
	year: v.optional(v.number()),
	pages: v.optional(v.number()),
	publisher: v.optional(v.string()),
	coverUrl: v.optional(v.string()),
	language: v.optional(v.string()),
	sourceIds: v.record(v.string(), v.string()),
	fieldSources: v.record(v.string(), sourceName)
};

export const shelfStatus = v.union(v.literal('want'), v.literal('reading'), v.literal('read'));

export default defineSchema({
	/** App-side person. Better Auth owns credentials in its own component. */
	profiles: defineTable({
		authUserId: v.string(),
		handle: v.string(),
		name: v.string()
	})
		.index('by_authUserId', ['authUserId'])
		.index('by_handle', ['handle']),

	books: defineTable({ ...bookFields, updatedAt: v.number() }).index('by_key', ['key']),

	/** One diary entry per reading. The same book can be read many times. */
	readings: defineTable({
		profileId: v.id('profiles'),
		bookId: v.id('books'),
		/** Local date, YYYY-MM-DD. */
		finishedOn: v.string(),
		/** Half stars, 1 to 10. */
		rating: v.optional(v.number()),
		review: v.optional(v.string()),
		reread: v.boolean()
	})
		.index('by_profile_finishedOn', ['profileId', 'finishedOn'])
		.index('by_profile_book', ['profileId', 'bookId']),

	shelf: defineTable({
		profileId: v.id('profiles'),
		bookId: v.id('books'),
		status: shelfStatus
	})
		.index('by_profile_book', ['profileId', 'bookId'])
		.index('by_profile_status', ['profileId', 'status'])
});
