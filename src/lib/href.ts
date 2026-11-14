import { resolve } from '$app/paths';
import type { Path } from '$app/types';
import { localizeHref } from '#lib/paraglide/runtime.js';

/** Internal link in the current language. */
export const href = (path: string, options?: Parameters<typeof localizeHref>[1]) =>
	resolve(localizeHref(path, options) as Path);
