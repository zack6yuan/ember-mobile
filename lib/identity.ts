import type { Identity } from '@/store/PostsContext';

/** How an author is labelled in the UI: "Anonymous" or "@handle". */
export function displayName(identity: Identity): string {
  return identity.mode === 'named' && identity.handle ? `@${identity.handle}` : 'Anonymous';
}
