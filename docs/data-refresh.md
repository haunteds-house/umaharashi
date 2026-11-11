# Automatic Global data refresh

GitHub Actions checks for updates daily at 19:17 UTC, on pushes to main and when
**Refresh data, test and deploy GitHub Pages → Run workflow** is selected.
GitHub can delay scheduled runs. No API key or local game installation is needed.

`python scripts/refresh_all.py` stages a complete snapshot:

1. Character, support and skill catalogs from the current public uma.guide bundle.
2. Affinity, factors, G1 mappings, courses and support restrictions from one
   uma.moe manifest, validating artifact and MDB SHA-256 checksums.
3. Training parameters for each catalog support at all five limit-break levels,
   converted from that Global MDB using the checked-in MIT converter.
4. Event vectors parsed from a pinned revision of Euophrys' public data.

The existing catalog must not lose IDs; missing models, unknown converter effects,
invalid data or missing SR/SSR event vectors fail the update. No source JavaScript
is executed. Only after staging validates are generated files copied into the
checkout. CI runs Python tests, the application regression suite and a production
build before committing the generated snapshot and deploying it in the same run.
A bot commit does not need to trigger a second workflow. Pushes are non-forced;
a concurrent change rejects the snapshot commit rather than overwriting it.
A failed refresh/test/build leaves the last deployed version online.

Unchanged sources do not produce daily date-only commits. Data and vendor modules
participate in the build version, and runtime data fetches/vendor imports use
that version to avoid stale browser caches. Reload an open tab after deployment.
Imported collections remain in browser storage.

The settings page and footer show the snapshot date. `data/metadata.json` also
records source bundle, manifest version, MDB checksum, training event revision
and record counts. Failures appear in the repository's Actions run; GitHub's
workflow notification preferences control email alerts.

This is Global data only. It does not make unreleased Japanese cards available,
and upstream publication delays still apply. Conditional support uniques and
event success remain the calculator's documented approximations. If a new
mechanic is unsupported, the updater stops for a code review rather than
assigning an invented training score.
