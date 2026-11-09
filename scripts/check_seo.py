"""Check SEO invariants against the main site's built HTML and XML (no network).
Run after npm run build: python3 scripts/check_seo.py
Separate hadith-book builds intentionally have a different output contract.
"""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse
import json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1] / 'dist'
ORIGIN = 'https://helghareeb.github.io'
errors = []

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.canonicals, self.alternates, self.schemas = [], [], []
        self.description, self.robots, self.title = '', '', ''
        self.in_title, self.in_schema, self.schema = False, False, ''
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'link' and a.get('rel') == 'canonical':
            self.canonicals.append(a.get('href', ''))
        if tag == 'link' and a.get('hreflang'):
            self.alternates.append((a['hreflang'], a.get('href', '')))
        if tag == 'meta' and a.get('name') == 'description':
            self.description = a.get('content', '')
        if tag == 'meta' and a.get('name') == 'robots':
            self.robots = a.get('content', '')
        if tag == 'title': self.in_title = True
        if tag == 'script' and a.get('type') == 'application/ld+json':
            self.in_schema, self.schema = True, ''
    def handle_data(self, data):
        if self.in_title: self.title += data
        if self.in_schema: self.schema += data
    def handle_endtag(self, tag):
        if tag == 'title': self.in_title = False
        if tag == 'script' and self.in_schema:
            self.schemas.append(self.schema)
            self.in_schema = False

def local_path(url):
    parsed = urlparse(url)
    if f'{parsed.scheme}://{parsed.netloc}' != ORIGIN:
        raise ValueError(f'Unexpected sitemap/alternate origin: {url}')
    return ROOT / unquote(parsed.path).strip('/') / 'index.html'

if not (ROOT / 'sitemap.xml').exists():
    raise SystemExit('Build the main site first: npm run build')
urls = [loc.text for loc in ET.parse(ROOT / 'sitemap.xml').findall('.//{*}loc')]
if len(urls) != len(set(urls)): errors.append('Duplicate sitemap URLs')
for url in urls:
    path = local_path(url)
    if not path.exists():
        errors.append(f'Sitemap target missing: {url}'); continue
    page = Page(path.read_text())
    if 'noindex' in page.robots: errors.append(f'Noindex URL in sitemap: {url}')
    if page.canonicals != [url]: errors.append(f'Noncanonical sitemap URL: {url}')
    if not page.title.strip() or not page.description.strip():
        errors.append(f'Missing title/description: {url}')
    for schema in page.schemas:
        try: json.loads(schema)
        except json.JSONDecodeError: errors.append(f'Invalid JSON-LD: {url}')
    for lang, alternate in page.alternates:
        target = local_path(alternate)
        if not target.exists(): errors.append(f'Missing hreflang target: {url} → {alternate}')
        elif 'noindex' in Page(target.read_text()).robots:
            errors.append(f'Noindex hreflang target: {url} → {alternate}')

book_reader = ORIGIN + '/ar/books/qatra-min-al-hayah/read/'
if book_reader not in urls: errors.append('Published book reader missing from sitemap')
robots = (ROOT / 'robots.txt').read_text()
if f'Sitemap: {ORIGIN}/sitemap.xml' not in robots: errors.append('Missing robots sitemap declaration')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'SEO checks passed: {len(urls)} canonical sitemap URLs, titles, descriptions, JSON-LD and language targets.')
