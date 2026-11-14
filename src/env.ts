import { defineEnvVars } from '@sveltejs/kit/env';

const url = (value: string | undefined) => {
	if (!value) throw new Error('missing; run `pnpm convex` once to create .env.local');
	return new URL(value).origin;
};

export const variables = defineEnvVars({
	PUBLIC_CONVEX_URL: {
		public: true,
		static: true,
		schema: url,
		description: 'Convex client URL, written to .env.local by `convex dev`.'
	},
	PUBLIC_CONVEX_SITE_URL: {
		public: true,
		static: true,
		schema: url,
		description: 'Convex HTTP actions URL, where Better Auth runs.'
	}
});
