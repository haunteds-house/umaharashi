# Manual decks and remote parents

Manual decks live under Include support cards → Support deck → Deck selection.
Pick five imported owned cards and one borrowed card from the catalog. Owned
limit breaks come from the collection; the borrowed card is MLB/max level.
The same skill-source, scenario, growth and relative training-value calculations
used by automatic decks evaluate this exact deck for each parent pair. Manual
mode bypasses optimization preferences (SSR-only, Pal limit, type minima and race
bonus minima), but still rejects duplicate characters, target conflicts and
scenario-unavailable cards. Automatic scenario selection still compares enabled
scenarios. Deck choices are saved with plans, farming presets and backups.

Remote parents live in a separate, browser-local pool, not My collection.
Enable the pool to search filtered owned veterans plus the saved remote snapshots.
Pairs contain at most one remote parent. Place a remote parent in either parent
slot to pin it; the normal parent search finds the other parent in your roster.
Remote results show trainer ID and snapshot date. Re-fetch before relying on an
old listing: the trainer can change their shared parent or fill their follower list.

Integration follows uma-moe/umamoe-backend's public source:
- GET /api/v3/search with search_type=inheritance, 20 records per page;
- optional_white_sparks uses desired white factor IDs (at least one must match);
- GET /api/v4/user/profile/:account_id supplies full per-branch factors and wins.

Search summaries deliberately contain empty grandparent and race fields in the
upstream implementation. They are never used for calculations. Load lineage
fetches the full profile first, then maps each branch separately. Missing race
arrays remain unknown. Stats and aptitudes are not in the borrowing record;
they are not invented and local roster filters do not apply to this separate pool.

Keys are entered in the modal, held in tab memory and sent only in X-API-Key to
https://uma.moe/api/. No key goes in URLs, local storage, exports, or repository
files. Requests omit cookies and reject redirects. Errors preserve existing
snapshots. No automatic refresh, tracking POST, or roster upload is performed.

Validation: exact manual decks, illegal choices, source tier calculations,
branch normalization, one-remote limits, request construction, secret handling
and normal suite. Live preflight allows GitHub Pages origins. A live key test on
2026-11-08 returned HTTP 403, so authenticated result retrieval remains dependent
on a currently accepted uma.moe key. Backend sources were inspected on that date.
