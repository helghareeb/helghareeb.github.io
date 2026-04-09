#!/usr/bin/env python3

from __future__ import annotations

import argparse
import html
import math
import re
import textwrap
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from bs4 import BeautifulSoup, NavigableString, Tag


SOURCE_NAME = "فاعلم أنه لا إله إلا الله"


@dataclass
class SeriesEntry:
    title: str
    url: str


def parse_docx_links(docx_path: Path) -> list[SeriesEntry]:
    with zipfile.ZipFile(docx_path) as archive:
        document = ET.fromstring(archive.read("word/document.xml"))
        rels = ET.fromstring(archive.read("word/_rels/document.xml.rels"))

    ns = {
        "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
        "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    }
    rel_map = {
        rel.attrib["Id"]: rel.attrib["Target"]
        for rel in rels
        if "Id" in rel.attrib and "Target" in rel.attrib
    }

    entries: list[SeriesEntry] = []
    seen: set[tuple[str, str]] = set()

    for paragraph in document.findall(".//w:body/w:p", ns):
        text = "".join((node.text or "") for node in paragraph.findall(".//w:t", ns)).strip().replace("\xa0", " ")
        if not text:
            continue

        links: list[str] = []
        for hyperlink in paragraph.findall(".//w:hyperlink", ns):
            rel_id = hyperlink.attrib.get(f"{{{ns['r']}}}id")
            if rel_id and rel_id in rel_map:
                links.append(rel_map[rel_id])

        if not links:
            continue

        key = (text, links[0])
        if key in seen:
            continue

        seen.add(key)
        entries.append(SeriesEntry(title=text, url=links[0]))

    return entries


def fetch_html(url: str) -> str:
    parsed = urllib.parse.urlsplit(url)
    safe_url = urllib.parse.urlunsplit(
        (
            parsed.scheme,
            parsed.netloc,
            urllib.parse.quote(parsed.path),
            parsed.query,
            parsed.fragment,
        )
    )
    request = urllib.request.Request(
        safe_url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; Codex Importer/1.0)",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8", errors="replace")


def clean_text(value: str) -> str:
    value = html.unescape(value)
    value = value.replace("\xa0", " ")
    value = re.sub(r"\s+", " ", value)
    return value.strip()


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
        href = node.get("href", "").strip()
        return f"[{text}]({href})" if href else text

    if name == "br":
        return "\n"

    if name == "li":
        marker = f"{'  ' * level}- "
        content = "".join(node_to_markdown(child, level + 1) for child in node.children).strip()
        content = re.sub(r"(\*\*[^*]+\*\*)(?=\S)", r"\1 ", content)
        return f"{marker}{content}"

    if name in {"ul", "ol"}:
        items = [node_to_markdown(child, level) for child in node.find_all("li", recursive=False)]
        return "\n".join(item for item in items if item)

    return "".join(node_to_markdown(child, level) for child in node.children).strip()


def extract_post(html_text: str) -> tuple[str, str, str, list[str]]:
    soup = BeautifulSoup(html_text, "html.parser")

    title_node = soup.select_one("h1.wp-block-post-title")
    content_root = soup.select_one("div.entry-content")
    published_node = soup.select_one('meta[property="article:published_time"]')

    if title_node is None or content_root is None:
      raise ValueError("Could not locate the title or entry content in the WordPress page.")

    title = clean_text(title_node.get_text(" ", strip=True))
    published = clean_text(published_node.get("content", "")) if published_node else ""

    blocks: list[str] = []
    paragraphs: list[str] = []

    for child in content_root.children:
        if isinstance(child, NavigableString):
            continue
        if not isinstance(child, Tag):
            continue
        if child.name == "span" and child.get("id") == "wordads-inline-marker":
            break
        classes = child.get("class", [])
        if "sharedaddy" in classes:
            break

        if child.name in {"h2", "h3", "h4"}:
            text = clean_text(child.get_text(" ", strip=True)).rstrip(":")
            level = {"h2": "##", "h3": "###", "h4": "####"}[child.name]
            if text:
                blocks.append(f"{level} {text}")
            continue

        if child.name == "p":
            text = node_to_markdown(child).strip()
            if text:
                blocks.append(text)
                paragraphs.append(clean_text(child.get_text(" ", strip=True)))
            continue

        if child.name in {"ul", "ol"}:
            text = node_to_markdown(child).strip()
            if text:
                blocks.append(text)
            continue

    summary = ""
    for paragraph in paragraphs:
        if paragraph:
            summary = paragraph[:220].rstrip()
            if len(paragraph) > 220:
                summary = f"{summary}..."
            break

    return title, published, summary, blocks


def estimate_reading_time(blocks: list[str]) -> str:
    text = " ".join(blocks)
    words = len(re.findall(r"\S+", text))
    minutes = max(1, math.ceil(words / 180))
    return f"{minutes} دقيقة"


def build_frontmatter(
    *,
    title: str,
    date: str,
    summary: str,
    series_name: str,
    series_slug: str,
    series_order: int,
    category: str,
    reading_time: str,
    external_url: str,
) -> str:
    safe_summary = summary.replace('"', '\\"')
    safe_title = title.replace('"', '\\"')
    safe_series = series_name.replace('"', '\\"')
    safe_category = category.replace('"', '\\"')
    safe_source = SOURCE_NAME.replace('"', '\\"')
    safe_url = external_url.replace('"', '\\"')

    return textwrap.dedent(
        f"""\
        ---
        title: "{safe_title}"
        lang: "ar"
        date: "{date}"
        summary: "{safe_summary}"
        category: "{safe_category}"
        series: "{safe_series}"
        seriesSlug: "{series_slug}"
        seriesOrder: {series_order}
        sourceName: "{safe_source}"
        articleType: "مقال خارجي"
        readingTime: "{reading_time}"
        externalUrl: "{safe_url}"
        draft: false
        ---
        """
    ).strip()


def to_iso_date(published: str) -> str:
    if not published:
        return datetime.utcnow().strftime("%Y-%m-%d")
    return datetime.fromisoformat(published.replace("Z", "+00:00")).strftime("%Y-%m-%d")


def write_entry(
    *,
    entry: SeriesEntry,
    index: int,
    output_dir: Path,
    slug_prefix: str,
    series_name: str,
    category: str,
) -> Path:
    html_text = fetch_html(entry.url)
    title, published, summary, blocks = extract_post(html_text)
    date = to_iso_date(published)
    reading_time = estimate_reading_time(blocks)
    frontmatter = build_frontmatter(
        title=title,
        date=date,
        summary=summary,
        series_name=series_name,
        series_slug=slug_prefix,
        series_order=index,
        category=category,
        reading_time=reading_time,
        external_url=entry.url,
    )
    body = "\n\n".join(blocks).strip()

    filename = output_dir / f"{slug_prefix}-{index:03d}-ar.md"
    filename.write_text(f"{frontmatter}\n\n{body}\n", encoding="utf-8")
    return filename


def main() -> None:
    parser = argparse.ArgumentParser(description="Import a WordPress article series into Astro content files.")
    parser.add_argument("docx_path", type=Path, help="Path to the Word document containing one title and URL per line.")
    parser.add_argument("--output-dir", type=Path, default=Path("src/content/articles"))
    parser.add_argument("--slug-prefix", default="al-risala")
    parser.add_argument("--series-name", default="شرح مختصر لكتاب الرسالة للشافعي - شرح د. ياسر برهامي")
    parser.add_argument("--category", default="أصول الفقه")
    args = parser.parse_args()

    entries = parse_docx_links(args.docx_path)
    args.output_dir.mkdir(parents=True, exist_ok=True)

    for index, entry in enumerate(entries, 1):
        path = write_entry(
            entry=entry,
            index=index,
            output_dir=args.output_dir,
            slug_prefix=args.slug_prefix,
            series_name=args.series_name,
            category=args.category,
        )
        print(path)


if __name__ == "__main__":
    main()
