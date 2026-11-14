import { PUBLIC_CONVEX_SITE_URL } from '$app/env/public';
import { createSvelteKitHandler } from '@mmailaender/convex-better-auth-svelte/sveltekit';

// Better Auth runs inside Convex; this route forwards the browser's auth calls there.
export const { GET, POST } = createSvelteKitHandler({ convexSiteUrl: PUBLIC_CONVEX_SITE_URL });
