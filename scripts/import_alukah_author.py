#!/usr/bin/env python3

from __future__ import annotations

import argparse
import html
import math
import re
import textwrap
import urllib.parse
import urllib.request
from collections import Counter
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from bs4 import BeautifulSoup, NavigableString, Tag


BASE_URL = "https://www.alukah.net"
AUTHOR_SOURCE_NAME = "شبكة الألوكة"
REQUEST_TIMEOUT_SECONDS = 20
MAX_SLUG_LENGTH = 110
CATEGORY_NORMALIZATION = {
    "تفسير القرآن الكريم": "التفسير وعلوم القرآن",
    "الآداب والأخلاق": "الرقائق والأخلاق والآداب",
}


@dataclass
class AuthorArticle:
    title: str
    url: str
    publish_date: str


def clean_text(value: str) -> str:
    value = html.unescape(value)
    value = value.replace("\xa0", " ")
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def normalize_category(category: str) -> str:
    return CATEGORY_NORMALIZATION.get(category, category)


def fetch_url(opener: urllib.request.OpenerDirector, url: str, data: bytes | None = None) -> str:
    request = urllib.request.Request(
        url,
        data=data,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; Codex Alukah Importer/1.0)",
            "Referer": url,
        },
    )
    with opener.open(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
        return response.read().decode("utf-8", errors="replace")


def build_opener() -> urllib.request.OpenerDirector:
    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor())


def parse_hidden_fields(soup: BeautifulSoup) -> dict[str, str]:
    fields: dict[str, str] = {}
    for field in soup.select("input[type='hidden'][name]"):
        name = field.get("name", "").strip()
        if not name:
            continue
        fields[name] = field.get("value", "")
    return fields


def parse_author_articles(soup: BeautifulSoup) -> list[AuthorArticle]:
    table = soup.select_one("#ctl00_MainContentPlaceHolder_GridView1")
    if table is None:
        raise ValueError("Could not locate the author articles table on the Alukah page.")

    entries: list[AuthorArticle] = []
    for row in table.select("tr"):
        link = row.select_one("a[id*='lnkContent']")
        if link is None:
            continue

        cells = row.find_all("td", recursive=False)
        if len(cells) < 3:
            continue

        title = clean_text(link.get_text(" ", strip=True))
        href = urllib.parse.urljoin(BASE_URL, link.get("href", "").strip())
        publish_date = clean_text(cells[1].get_text(" ", strip=True))

        if title and href:
            entries.append(AuthorArticle(title=title, url=href, publish_date=publish_date))

    return entries


def fetch_author_listing(opener: urllib.request.OpenerDirector, author_url: str, max_pages: int | None = None) -> list[AuthorArticle]:
    print(f"Listing page 1: {author_url}", flush=True)
    html_text = fetch_url(opener, author_url)
    soup = BeautifulSoup(html_text, "html.parser")
    entries = parse_author_articles(soup)

    pager_links = soup.select("#ctl00_MainContentPlaceHolder_GridView1 tr td a[href^='javascript:__doPostBack']")
    page_numbers: list[int] = []
    for link in pager_links:
        text = clean_text(link.get_text(" ", strip=True))
        if text.isdigit():
            page_numbers.append(int(text))

    total_pages = max(page_numbers, default=1)
    if max_pages is not None:
        total_pages = min(total_pages, max_pages)

    for page_number in range(2, total_pages + 1):
        print(f"Listing page {page_number}: {author_url}", flush=True)
        page_soup = BeautifulSoup(html_text, "html.parser")
        fields = parse_hidden_fields(page_soup)
        fields["__EVENTTARGET"] = "ctl00$MainContentPlaceHolder$GridView1"
        fields["__EVENTARGUMENT"] = f"Page${page_number}"
        fields["ctl00$SearchBlockPlaceHolder$txtSearch"] = fields.get("ctl00$SearchBlockPlaceHolder$txtSearch", "")

        body = urllib.parse.urlencode(fields).encode("utf-8")
        html_text = fetch_url(opener, author_url, data=body)
        page_entries = parse_author_articles(BeautifulSoup(html_text, "html.parser"))
        entries.extend(page_entries)

    unique_entries: list[AuthorArticle] = []
    seen_urls: set[str] = set()
    for entry in entries:
        if entry.url in seen_urls:
            continue
        seen_urls.add(entry.url)
        unique_entries.append(entry)

    return unique_entries


def node_to_markdown(node: Tag, level: int = 0) -> str:
    if isinstance(node, NavigableString):
        return clean_text(str(node))

    if not isinstance(node, Tag):
        return ""

    name = node.name.lower()

    if name in {"strong", "b"}:
        content = "".join(node_to_markdown(child, level) for child in node.children).strip()
        return f"**{content}**" if content else ""

    if name in {"em", "i"}:
        content = "".join(node_to_markdown(child, level) for child in node.children).strip()
        return f"*{content}*" if content else ""

    if name == "a":
        text = "".join(node_to_markdown(child, level) for child in node.children).strip() or clean_text(node.get_text(" ", strip=True))
        href = urllib.parse.urljoin(BASE_URL, node.get("href", "").strip())
        return f"[{text}]({href})" if href else text

    if name == "br":
        return "\n"

    if name == "li":
        marker = f"{'  ' * level}- "
        content = "".join(node_to_markdown(child, level + 1) for child in node.children).strip()
        return f"{marker}{content}" if content else ""

    if name in {"ul", "ol"}:
        items = [node_to_markdown(child, level) for child in node.find_all("li", recursive=False)]
        return "\n".join(item for item in items if item)

    if name in {"h2", "h3", "h4"}:
        text = clean_text(node.get_text(" ", strip=True)).rstrip(":")
        if not text:
            return ""
        marker = {"h2": "##", "h3": "###", "h4": "####"}[name]
        return f"{marker} {text}"

    text = "".join(node_to_markdown(child, level) for child in node.children).strip()
    return text


def extract_article_page(opener: urllib.request.OpenerDirector, url: str) -> dict[str, object]:
    html_text = fetch_url(opener, url)
    soup = BeautifulSoup(html_text, "html.parser")

    title_node = soup.select_one("#ctl00_MainContentPlaceHolder_ctl00_lblTitle [itemprop='name']")
    article_body = soup.select_one("#ArticleContent [itemprop='articleBody']")
    published_meta = soup.select_one("meta[property='article:published_time']")
    breadcrumb_links = soup.select("#breadcrumb a span[itemprop='title']")

    if title_node is None or article_body is None:
        raise ValueError(f"Could not locate the title or article body for {url}")

    title = clean_text(title_node.get_text(" ", strip=True))
    published_iso = clean_text(published_meta.get("content", "")) if published_meta else ""
    breadcrumb_parts = [clean_text(node.get_text(" ", strip=True)) for node in breadcrumb_links if clean_text(node.get_text(" ", strip=True))]

    blocks: list[str] = []
    paragraphs: list[str] = []
    for child in article_body.children:
        if isinstance(child, NavigableString):
            text = clean_text(str(child))
            if text:
                blocks.append(text)
                paragraphs.append(text)
            continue
        if not isinstance(child, Tag):
            continue
        if child.name.lower() in {"script", "style"}:
            continue

        text = node_to_markdown(child).strip()
        if text:
            blocks.append(text)
            plain = clean_text(child.get_text(" ", strip=True))
            if plain:
                paragraphs.append(plain)

    summary = ""
    for paragraph in paragraphs:
        if paragraph:
            summary = paragraph[:220].rstrip()
            if len(paragraph) > 220:
                summary = f"{summary}..."
            break
    if not summary or summary in {"ملخص كتاب", "ملخص كتاب:"} or len(summary) < 12:
        summary = title

    category = normalize_category(breadcrumb_parts[-1] if breadcrumb_parts else "مقالات الألوكة")

    return {
        "title": title,
        "published_iso": published_iso,
        "summary": summary,
        "blocks": blocks,
        "breadcrumb_parts": breadcrumb_parts,
        "category": category,
    }


def to_iso_date(value: str, fallback: str) -> str:
    if value:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).strftime("%Y-%m-%d")

    match = re.search(r"(\d{1,2})/(\d{1,2})/(\d{4})", fallback)
    if match:
        day, month, year = match.groups()
        return f"{year}-{int(month):02d}-{int(day):02d}"

    return datetime.utcnow().strftime("%Y-%m-%d")


def estimate_reading_time(blocks: list[str]) -> str:
    words = len(re.findall(r"\S+", " ".join(blocks)))
    minutes = max(1, math.ceil(words / 180))
    return f"{minutes} دقيقة"


def slugify_arabic_title(value: str) -> str:
    value = clean_text(value)
    value = value.replace("آ", "ا").replace("أ", "ا").replace("إ", "ا").replace("ى", "ي").replace("ة", "ه")
    value = re.sub(r"[\"'`]+", "", value)
    value = re.sub(r"[^\w\u0600-\u06FF]+", "-", value, flags=re.UNICODE)
    value = re.sub(r"-{2,}", "-", value)
    value = value.strip("-").lower()
    if len(value) > MAX_SLUG_LENGTH:
        value = value[:MAX_SLUG_LENGTH].rstrip("-")
    return value or "article"


def extract_explicit_order(title: str) -> int | None:
    western_match = re.search(r"\(([0-9]+)\)\s*$", title)
    if western_match:
        return int(western_match.group(1))

    eastern_match = re.search(r"\(([٠-٩]+)\)\s*$", title)
    if eastern_match:
        eastern = eastern_match.group(1).translate(str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789"))
        return int(eastern)

    ordinal_words = {
        "الأول": 1,
        "الاول": 1,
        "الثاني": 2,
        "الثالث": 3,
        "الرابع": 4,
        "الخامس": 5,
        "السادس": 6,
        "السابع": 7,
        "الثامن": 8,
        "التاسع": 9,
        "العاشر": 10,
    }
    for word, value in ordinal_words.items():
        if word in title:
            return value
    return None


def detect_series_name(title: str) -> str | None:
    if title.startswith("طريق المسلم إلى الله قبل رمضان:"):
        return "طريق المسلم إلى الله قبل رمضان"
    if title.startswith("ملخص كتاب: لماذا لم أتشيع"):
        return "ملخص كتاب: لماذا لم أتشيع"
    if title.startswith("ملخص كتاب: المجملات النافعات في مسائل العلم والتقليد والإفتاء والاختلافات"):
        return "ملخص كتاب: المجملات النافعات في مسائل العلم والتقليد والإفتاء والاختلافات"
    if "إتمام الرصف بذكر ما حوته سورة الصف من الأحكام والوصف" in title or "إتمام الرصف بما حوته سورة الصف من الأحكام والوصف" in title:
        return "إتمام الرصف بذكر ما حوته سورة الصف من الأحكام والوصف"
    return None


def infer_series_map(entries: list[AuthorArticle], metadata_by_title: dict[str, dict[str, object]]) -> dict[str, tuple[str, int]]:
    grouped: dict[str, list[tuple[AuthorArticle, dict[str, object]]]] = {}
    for entry in entries:
        series_name = detect_series_name(entry.title)
        if not series_name:
            continue
        grouped.setdefault(series_name, []).append((entry, metadata_by_title[entry.title]))

    result: dict[str, tuple[str, int]] = {}
    for series_name, items in grouped.items():
        sortable: list[tuple[int, str, str]] = []
        has_explicit_order = any(extract_explicit_order(entry.title) is not None for entry, _ in items)
        for entry, metadata in items:
            date = to_iso_date(str(metadata["published_iso"]), entry.publish_date)
            explicit_order = extract_explicit_order(entry.title)
            if has_explicit_order:
                sortable.append((explicit_order if explicit_order is not None else 10_000, date, entry.title))
            else:
                sortable.append((0, date, entry.title))

        sortable.sort()
        for index, (_, _, title) in enumerate(sortable, start=1):
            result[title] = (series_name, index)

    return result


def build_frontmatter(
    *,
    title: str,
    date: str,
    summary: str,
    category: str,
    reading_time: str,
    external_url: str,
    series_name: str | None,
    series_slug: str | None,
    series_order: int | None,
) -> str:
    def quote(value: str) -> str:
        return value.replace('"', '\\"')

    lines = [
        "---",
        f'title: "{quote(title)}"',
        'lang: "ar"',
        f'date: "{date}"',
        f'summary: "{quote(summary)}"',
        f'category: "{quote(category)}"',
    ]

    if series_name and series_slug and series_order:
        lines.extend(
            [
                f'series: "{quote(series_name)}"',
                f'seriesSlug: "{quote(series_slug)}"',
                f"seriesOrder: {series_order}",
            ]
        )

    lines.extend(
        [
            f'sourceName: "{quote(AUTHOR_SOURCE_NAME)}"',
            'articleType: "مقال خارجي"',
            f'readingTime: "{reading_time}"',
            f'externalUrl: "{quote(external_url)}"',
            "draft: false",
            "---",
        ]
    )
    return "\n".join(lines)


def write_article(
    *,
    output_dir: Path,
    title_slug: str,
    metadata: dict[str, object],
    entry: AuthorArticle,
    series_info: tuple[str, int] | None,
) -> Path:
    title = metadata["title"]
    blocks = metadata["blocks"]
    date = to_iso_date(str(metadata["published_iso"]), entry.publish_date)
    summary = str(metadata["summary"])
    category = str(metadata["category"])
    reading_time = estimate_reading_time(blocks)  # type: ignore[arg-type]
    series_name = series_info[0] if series_info else None
    series_slug = slugify_arabic_title(series_name) if series_name else None
    series_order = series_info[1] if series_info else None

    frontmatter = build_frontmatter(
        title=str(title),
        date=date,
        summary=summary,
        category=category,
        reading_time=reading_time,
        external_url=entry.url,
        series_name=series_name,
        series_slug=series_slug,
        series_order=series_order,
    )
    body = "\n\n".join(blocks).strip()  # type: ignore[arg-type]
    path = output_dir / f"{title_slug}-ar.md"
    path.write_text(f"{frontmatter}\n\n{body}\n", encoding="utf-8")
    return path


def main() -> None:
    parser = argparse.ArgumentParser(description="Import an Alukah author archive into Astro article files.")
    parser.add_argument("--author-url", default="https://www.alukah.net/authors/view/home/16869/")
    parser.add_argument("--output-dir", type=Path, default=Path("src/content/articles"))
    parser.add_argument("--limit", type=int, default=None)
    args = parser.parse_args()

    opener = build_opener()
    entries = fetch_author_listing(opener, args.author_url)
    if args.limit is not None:
        entries = entries[: args.limit]
    print(f"Found {len(entries)} author entries.", flush=True)

    metadata_by_title: dict[str, dict[str, object]] = {}
    skipped: list[tuple[str, str, str]] = []
    for index, entry in enumerate(entries, start=1):
        print(f"[{index}/{len(entries)}] Importing: {entry.title}", flush=True)
        try:
            metadata_by_title[entry.title] = extract_article_page(opener, entry.url)
        except Exception as exc:
            skipped.append((entry.title, entry.url, str(exc)))

    successful_entries = [entry for entry in entries if entry.title in metadata_by_title]
    series_map = infer_series_map(successful_entries, metadata_by_title)

    args.output_dir.mkdir(parents=True, exist_ok=True)
    seen_slugs: set[str] = set()

    for entry in successful_entries:
        metadata = metadata_by_title[entry.title]
        base_slug = slugify_arabic_title(entry.title)
        slug = base_slug
        counter = 2
        while slug in seen_slugs:
            slug = f"{base_slug}-{counter}"
            counter += 1
        seen_slugs.add(slug)

        path = write_article(
            output_dir=args.output_dir,
            title_slug=slug,
            metadata=metadata,
            entry=entry,
            series_info=series_map.get(entry.title),
        )
        print(path)

    if skipped:
        print(f"SKIPPED {len(skipped)} entr{'y' if len(skipped) == 1 else 'ies'}:", flush=True)
        for title, url, reason in skipped:
            print(f"- {title} :: {url} :: {reason}", flush=True)


if __name__ == "__main__":
    main()
