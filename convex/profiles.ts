import type { Doc } from './_generated/dataModel';
import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server';
import { authComponent } from './auth';

const slug = (raw: string) =>
	raw
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '')
		.slice(0, 20) || 'leitor';

export const currentProfile = async (ctx: QueryCtx): Promise<Doc<'profiles'> | null> => {
	const user = await authComponent.safeGetAuthUser(ctx);
	if (!user) return null;
	return await ctx.db
		.query('profiles')
		.withIndex('by_authUserId', (q) => q.eq('authUserId', user._id))
		.unique();
};

/** Returns the signed-in person's profile, creating it on first use. */
export const requireProfile = async (ctx: MutationCtx): Promise<Doc<'profiles'>> => {
	const user = await authComponent.getAuthUser(ctx);
	const existing = await currentProfile(ctx);
	if (existing) return existing;

	const base = slug(user.name || user.email.split('@')[0]);
	let handle = base;
	for (let n = 2; ; n++) {
		const taken = await ctx.db
			.query('profiles')
			.withIndex('by_handle', (q) => q.eq('handle', handle))
			.first();
		if (!taken) break;
		handle = `${base}${n}`;
	}
	const id = await ctx.db.insert('profiles', {
		authUserId: user._id,
		handle,
		name: user.name || handle
	});
	return (await ctx.db.get(id))!;
};

export const me = query({
	args: {},
	handler: (ctx) => currentProfile(ctx)
});

export const ensure = mutation({
	args: {},
	handler: (ctx) => requireProfile(ctx)
});
