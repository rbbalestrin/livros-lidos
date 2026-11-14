import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { currentProfile, requireProfile } from './profiles';

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export const log = mutation({
	args: {
		bookId: v.id('books'),
		finishedOn: v.string(),
		rating: v.optional(v.number()),
		review: v.optional(v.string()),
		reread: v.boolean()
	},
	handler: async (ctx, args) => {
		const profile = await requireProfile(ctx);
		if (!(await ctx.db.get(args.bookId))) throw new ConvexError('book_not_found');
		if (!isoDate.test(args.finishedOn) || Number.isNaN(Date.parse(args.finishedOn)))
			throw new ConvexError('invalid_date');
		if (
			args.rating !== undefined &&
			!(Number.isInteger(args.rating) && args.rating >= 1 && args.rating <= 10)
		)
			throw new ConvexError('invalid_rating');
		const review = args.review?.trim().slice(0, 10_000) || undefined;

		const readingId = await ctx.db.insert('readings', {
			profileId: profile._id,
			bookId: args.bookId,
			finishedOn: args.finishedOn,
			rating: args.rating,
			review,
			reread: args.reread
		});

		const shelf = await ctx.db
			.query('shelf')
			.withIndex('by_profile_book', (q) => q.eq('profileId', profile._id).eq('bookId', args.bookId))
			.unique();
		if (shelf) await ctx.db.patch(shelf._id, { status: 'read' });
		else
			await ctx.db.insert('shelf', { profileId: profile._id, bookId: args.bookId, status: 'read' });

		return readingId;
	}
});

export const remove = mutation({
	args: { readingId: v.id('readings') },
	handler: async (ctx, { readingId }) => {
		const profile = await requireProfile(ctx);
		const reading = await ctx.db.get(readingId);
		if (!reading || reading.profileId !== profile._id) throw new ConvexError('not_found');
		await ctx.db.delete(readingId);
	}
});

/** The signed-in person's diary, newest first. */
export const mine = query({
	args: {},
	handler: async (ctx) => {
		const profile = await currentProfile(ctx);
		if (!profile) return [];
		const readings = await ctx.db
			.query('readings')
			.withIndex('by_profile_finishedOn', (q) => q.eq('profileId', profile._id))
			.order('desc')
			.take(200);
		return await Promise.all(
			readings.map(async (reading) => ({ ...reading, book: await ctx.db.get(reading.bookId) }))
		);
	}
});
