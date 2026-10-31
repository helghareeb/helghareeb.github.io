# Alukah article synchronization — 2026-10-31

## Authorized scope and execution order
The owner requested publication of newly added Alukah articles on the personal website, with complete and accurate English translations, not summaries. Work is limited to Al-Mizan articles 6 and 7, four article files, and this documentation. Earlier articles 1–5 already exist in both languages. No other project or active Claude workspace was changed.

## Baseline and preparation
- Isolated cloud checkout; baseline master: `5e3a6e2e4453a30e00d0815042b76598876af06f`.
- Read execution-method, release-deploy-checklist, content schema, existing article 5 pairs, and deployment workflow.
- Publication is to the existing `master` branch, which triggers GitHub Pages. Publication follows completion of the hub reconciliation and independent translation review.
- Source URLs: https://www.alukah.net/sharia/0/185652/ and https://www.alukah.net/sharia/0/185759/.
- Visible publication dates: 2026-10-29 and 2026-10-31. Article 6 HTML metadata says October 25, conflicting with its visible publication date; the visible date is used.
- Full source bodies were extracted including five footnotes each. A preliminary parser omitted footnotes; that extraction was corrected before final content assembly and review.
- English is a full translation. The owner's 2026-10-31 instruction overrides the older execution-method §4.4 allowance for abbreviated English for this article-sync workflow. Listing summaries remain short excerpts, but the article bodies are complete.

## Planned validation
- Match each Arabic body to its complete source; retain all headings, paragraphs, quotations, references, conclusions, and five footnotes.
- Independent bilingual review of both English bodies against Arabic.
- Validate paired translation keys, series positions, language, source URLs, and dates.
- Run npm run check and npm run build; inspect four generated routes, language switching, series membership, and sitemap.
- Re-read remote HEAD before publication, preserve concurrent edits, then verify the exact deployed commit and live pages.

## Current status
The article publication commit is live. See the publication evidence below; the preceding sections preserve the plan and validation sequence.

## Completed local validation
- Four article files assembled, retaining complete Arabic source text (apart from heading markup) and five footnotes in every Arabic and English file.
- Independent bilingual review found no missing source paragraphs or substantive translation errors; all five footnotes, Qur'an/hadith quotations and references were checked.
- Dependency installation passed. The initial default-cache attempt failed because the cache directory was unavailable; a writable temporary cache resolved it without changing dependencies.
- `npm run check`: FAILED with one pre-existing error at `src/utils/hadith.ts:54` (`process` missing Node type declarations), plus four hints. A separate untouched checkout at baseline `5e3a6e2` reproduced exactly the same error and hints. This article batch does not change that file or dependency configuration.
- `npm run build`: PASSED (Astro and Pagefind). No claim that all checks are green.
- Structural checks: all four generated article pages exist; source links, language switching in both directions, five footnotes, series membership, and sitemap entries passed. Arabic texts match the complete source extraction exactly after removing heading markup.
- `git diff --check`: passed.
- Remote `master` rechecked before publication: still `5e3a6e2e4453a30e00d0815042b76598876af06f`; no concurrent remote changes observed. Local Claude working trees were not accessed.
- Hub reconciliation and translation QA were completed before proceeding with the owner-authorized publication.

## Publication status
Prepared for one atomic content/documentation commit to `master`, preserving all unrelated files. Live deployment and visual browser testing have not yet been verified. A later entry will record the published commit and checks.

## Scoped logging exception
The attempted rewrite of the legacy `project-docs/update-log.md` was blocked because its pre-existing contents contain operational details outside this publication's disclosure scope. That file is left unchanged; no alternate route was used to perform the rejected rewrite. This clean, article-specific handoff and the current-status entry provide the new batch record instead. Only four article files and three documentation files are included.

## Publication evidence — 2026-10-31
- Article publication commit: `71b3737ec2ef9cfd0e27892973f0bb5b6cf303ed`, on `master`, applied atomically with an expected-head lease.
- Read-back verified exactly seven files changed: four article files, this handoff, current-status, and the scoped execution-method instruction. The legacy update-log remained byte-for-byte unchanged.
- Deployment run: https://github.com/helghareeb/helghareeb.github.io/actions/runs/41193480732 . Build, Pages deployment, and IndexNow submission all succeeded.
- All four live article routes returned HTTP 200. Correct language, five footnotes per page, canonical Alukah source links, reciprocal Arabic/English switching, and sitemap inclusion were verified from live HTML.
- This was HTML/content validation, not a visual browser review. The pre-existing `npm run check` error remains, as documented above.
- No unrelated project, local Claude workspace, or running experiment was changed.

### Published routes
- https://helghareeb.github.io/ar/articles/سلسله-الميزان-كيف-نزن-الشبهات-6-القداسه-بين-دوركايم-والتوقيف-الشرعي/
- https://helghareeb.github.io/en/articles/the-mizan-series-6-sacredness-between-durkheim-and-divine-prescription/
- https://helghareeb.github.io/ar/articles/سلسله-الميزان-كيف-نزن-الشبهات-7-احداث-الكعبه-وثبات-حرمتها/
- https://helghareeb.github.io/en/articles/the-mizan-series-7-events-at-the-kabah-and-the-endurance-of-its-sanctity/
