# scripts

- sync.ts — one collection pass
- watch.ts — 600s loop
- reanalyze.ts — re-run rules and rewrite digests
- dedupe-items.ts — repair the store: stable ids, content-level merge, optional `--purge-offtopic` for reddit noise
- rebuild-digests.ts — regenerate every daily digest (zh + en) from the current store, e.g. after a data repair
- exploit-probe.ts — static probe of public exploit repos
- dossier.ts — refresh the X citation dossier
- release.sh — package + publish locally
- new-release.sh — scaffold docs/releases/vX.Y.Z.md
- check-release-notes.sh — validate release notes
- audit-i18n.py — check English pages for leaked Chinese