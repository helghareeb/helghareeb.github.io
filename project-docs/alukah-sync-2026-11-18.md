# Alukah sync, books page and share menu — 2026-11-18

Owner request: add the recent Alukah articles in Arabic and English, embed the new Alukah book, link back to Alukah and other publishers, and (in the same session) categorise the books page, fix the clipped share menu, keep private repositories off the site, and add the Amazon author page.

## Content added
- Mizan 9 — «المصحف ليس مجرد ورق وحبر» (alukah 186103, 2026-11-17): Arabic source text with 4 footnotes; complete English translation.
- «أربع إذا كن فيك فلا عليك ما فاتك من الدنيا» (sermon, alukah 185970, 2026-11-10): Arabic source text with 28 footnotes; complete English translation (124/124 blocks, 28/28 notes).
- Book «فاعلم أنه لا إله إلا الله: شروط كلمة التوحيد وحماية جنابها» (alukah library 186094 vol. 1, 186095 vol. 2; 355 + 397 pp.), Arabic and English entries. Both volumes are embedded with the Google Drive viewer from the owner's Drive folder `1zkckArNl26nOcyp8fHvnVj4tJ0oL5thR` (vol. 1 `15SPxatMj8u3huJMLUyivc8GRwkJHQSsJ`, vol. 2 `1HCZOg2jv6BFwwQXsq1gtSupBr1dM87bK`). The Drive files are byte-identical to the Alukah PDFs (SHA-256 e2197928…f73b and 1d24fc6c…4fcf).
- Arabic article text is the Alukah text as published (headings and footnote markup only). Qur'an quotations keep the source wording; the QPC overlay used on 2026-11-08 was not applied in this batch.
- English translations were checked against the Arabic for completeness by the assistant; no independent human review is claimed.

## Site changes
- Books pages (ar/en) are grouped by subject through a new optional `category` field on books, with a section index at the top. Slides keep their own group; Mushaf al-Gharib sits under Qur'an studies.
- The share "More" menu is no longer clipped by the hero card; on phones it opens in place inside the page width.
- `.book-embed` style for embedded book viewers.
- Removed «تحريم الاختلاط ووجوب الحجاب»: its repository is private and the book is not yet published. Rule: the site links only to public repositories.
- Amazon author page added to external links (ar/en) and to the three LAP LAMBERT monographs, with their ISBNs, as a bibliographic record.

## Checks
- `npm run check`: 0 errors, 0 warnings (4 earlier hints). `npm run build`: passed.
- Browser checks at 390 and 1263 px (light and dark): share menu fully visible, no horizontal scroll, Drive viewer loads volume 1.
- No new copies of these three items were found on Midad, Islamway or Mosannefat on 2026-11-18.
