#!/usr/bin/env python3
"""Read-only production SEO/GEO audit, no credentials, no dependencies.

Compares public sitemap URLs on both brands with their server-rendered metadata,
canonical ownership and real anchor links. Makes no Google-indexation claims.
"""
from __future__ import annotations
import collections
import concurrent.futures
import csv
import datetime as dt
import html.parser
import json
import pathlib
import re
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

HOSTS = ('www.nexcelai.de', 'www.agiworks.de')
REPORT = pathlib.Path.home() / 'Downloads' / 'SEO_GEO_PRODUCTION_REPORT_20261118'
HEADERS = {'User-Agent': 'NexcelAgiTechnicalAudit/1.0 (contact: info@nexcelai.de)',
           'Accept': 'text/html,application/xml,text/xml,*/*'}
LIMIT = 4_000_000

class PageParser(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_title = False
        self.title = []
        self.canonicals = []
        self.metas = collections.defaultdict(list)
        self.links = []
        self.h1 = 0
        self.lang = ''
        self.schema_count = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'html':
            self.lang = a.get('lang', '')
        elif tag == 'title':
            # Do not concatenate several Next.js streamed title elements.
            self.in_title = not self.title
        elif tag == 'h1':
            self.h1 += 1
        elif tag == 'script' and a.get('type', '').lower() == 'application/ld+json':
            self.schema_count += 1
        elif tag == 'link' and 'canonical' in a.get('rel', '').lower().split():
            self.canonicals.append(a.get('href', ''))
        elif tag == 'meta':
            key = (a.get('name') or a.get('property') or '').lower()
            if key:
                self.metas[key].append(a.get('content', ''))
        elif tag == 'a' and a.get('href'):
            self.links.append(a['href'])

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title.append(data)


def get(url):
    request = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(request, timeout=25) as response:
        return response.status, response.geturl(), response.headers, response.read(LIMIT)


def normalized(url):
    parts = urllib.parse.urlsplit(url)
    return urllib.parse.urlunsplit((parts.scheme.lower(), parts.netloc.lower(), parts.path.rstrip('/') or '/', '', ''))


def sitemap(host):
    url = f'https://{host}/sitemap.xml'
    status, final, headers, body = get(url)
    if status != 200 or normalized(final) != normalized(url):
        raise ValueError(f'Unexpected sitemap status/redirect: {status} {final}')
    root = ET.fromstring(body)
    if root.tag.rsplit('}', 1)[-1] != 'urlset':
        raise ValueError('Expected a URL sitemap, not sitemap index or HTML')
    result = []
    for item in root:
        if item.tag.rsplit('}', 1)[-1] != 'url':
            continue
        child = next((c for c in item if c.tag.rsplit('}', 1)[-1] == 'loc'), None)
        if child is not None and child.text:
            result.append(child.text.strip())
    if not result or len(result) != len(set(result)):
        raise ValueError('Empty sitemap or duplicate URL')
    for loc in result:
        split = urllib.parse.urlsplit(loc)
        if split.scheme != 'https' or split.hostname != host or split.query or split.fragment:
            raise ValueError(f'Cross-host or non-canonical sitemap URL: {loc}')
    return result


def inspect(item):
    host, url = item
    result = dict(host=host, url=url, http_status='', redirect_final='', canonical='',
                  canonical_count='', title='', description='', og_url='', robots='',
                  h1='', lang='', json_ld_count='', inbound_pages=0, crawlable_links=0,
                  agi_prefix_examples='', issues='', error='')
    outgoing = set()
    agi_bad_links = set()
    issues = []
    try:
        status, final, headers, body = get(url)
        result['http_status'] = status
        result['redirect_final'] = final
        if status != 200: issues.append(f'HTTP_{status}')
        if normalized(final) != normalized(url): issues.append('SITEMAP_REDIRECT')
        if 'html' not in headers.get('content-type', '').lower(): issues.append('NOT_HTML')
        parser = PageParser()
        parser.feed(body.decode('utf-8', errors='replace'))
        result['canonical_count'] = len(parser.canonicals)
        result['canonical'] = parser.canonicals[0] if parser.canonicals else ''
        result['title'] = ' '.join(''.join(parser.title).split())
        result['description'] = (parser.metas.get('description') or [''])[0]
        result['og_url'] = (parser.metas.get('og:url') or [''])[0]
        result['robots'] = ','.join(parser.metas.get('robots', []) + parser.metas.get('googlebot', [])) + ',' + headers.get('x-robots-tag', '')
        result['h1'] = parser.h1
        result['lang'] = parser.lang
        result['json_ld_count'] = parser.schema_count
        if len(parser.canonicals) != 1: issues.append(f'CANONICAL_COUNT_{len(parser.canonicals)}')
        elif normalized(urllib.parse.urljoin(final, parser.canonicals[0])) != normalized(url):
            issues.append('CANONICAL_MISMATCH')
        if 'noindex' in result['robots'].lower(): issues.append('SITEMAP_NOINDEX')
        if not result['title']: issues.append('MISSING_TITLE')
        if not result['description']: issues.append('MISSING_DESCRIPTION')
        if not result['og_url']: issues.append('MISSING_OG_URL')
        elif normalized(urllib.parse.urljoin(final, result['og_url'])) != normalized(url): issues.append('OG_URL_MISMATCH')
        if parser.h1 != 1: issues.append(f'H1_COUNT_{parser.h1}')
        if not parser.lang: issues.append('MISSING_HTML_LANG')
        if parser.schema_count == 0: issues.append('NO_JSONLD')
        for href in parser.links:
            try:
                target = urllib.parse.urlsplit(urllib.parse.urljoin(url, href))
                if target.scheme not in ('http', 'https') or target.hostname != host: continue
                path = target.path or '/'
                if path == '/agiworks' or path.startswith('/agiworks/'):
                    issues.append('AGI_INTERNAL_PREFIX_LINK' if host == 'www.agiworks.de' else 'CROSS_BRAND_INTERNAL_LINK')
                    if host == 'www.agiworks.de':
                        agi_bad_links.add(href)
                if path.startswith(('/_next/', '/api/', '/admin/', '/images/')): continue
                if re.search(r'\.(?:png|jpg|svg|webp|css|js|pdf|txt|xml)$', path, re.I): continue
                outgoing.add(normalized(urllib.parse.urlunsplit(('https', host, path, '', ''))))
            except ValueError: continue
        result['crawlable_links'] = len(outgoing)
        result['agi_prefix_examples'] = ' | '.join(sorted(agi_bad_links)[:5])
    except Exception as exc:
        issues.append('FETCH_ERROR')
        result['error'] = str(exc)[:280]
    result['issues'] = ';'.join(sorted(set(issues)))
    return result, outgoing


def main():
    urls = []
    failed = []
    for host in HOSTS:
        try:
            discovered = sitemap(host)
            urls.extend((host, url) for url in discovered)
            print(f'SITEMAP_OK: {host}: {len(discovered)} URLs', flush=True)
        except Exception as exc:
            failed.append(f'{host}: {exc}')
            print(f'SITEMAP_ERROR: {host}: {exc}', flush=True)
    if failed or not urls:
        print('NO-GO: cannot audit both sitemaps. No partial success claimed.')
        return 2

    print(f'Inspecting {len(urls)} pages at 3 concurrent requests. Read-only.', flush=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        results = list(pool.map(inspect, urls))
    rows = [r for r, _ in results]
    sitemap_urls = {normalized(url) for _, url in urls}
    inbound = collections.defaultdict(set)
    for (row, outgoing) in results:
        for target in outgoing:
            if target in sitemap_urls and target != normalized(row['url']):
                inbound[target].add(row['url'])
    for row in rows:
        row['inbound_pages'] = len(inbound[normalized(row['url'])])
        if row['inbound_pages'] == 0 and urllib.parse.urlparse(row['url']).path not in ('', '/'):
            row['issues'] = ';'.join(filter(None, [row['issues'], 'NO_SITEMAP_PAGE_INLINKS']))

    titles = collections.defaultdict(list)
    for row in rows:
        if row['title']: titles[(row['host'], row['title'].strip().lower())].append(row)
    for matched in titles.values():
        if len(matched) > 1:
            for row in matched:
                row['issues'] = ';'.join(filter(None, [row['issues'], 'DUPLICATE_TITLE_SAME_BRAND']))

    REPORT.mkdir(parents=True, exist_ok=True)
    csv_path = REPORT / 'full_url_audit.csv'
    with csv_path.open('w', newline='', encoding='utf-8-sig') as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    count = collections.Counter(issue for row in rows for issue in row['issues'].split(';') if issue)
    summary = dict(timestamp_utc=dt.datetime.now(dt.timezone.utc).isoformat(), urls=len(rows),
                   per_brand={host:sum(row['host'] == host for row in rows) for host in HOSTS},
                   issues=dict(count), disclaimer='Public HTML status, not Google Search Console indexation or AI recommendation status')
    (REPORT / 'summary.json').write_text(json.dumps(summary, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print('ISSUES:', json.dumps(dict(count), ensure_ascii=False), flush=True)
    print('CSV:', csv_path, flush=True)
    print('SUMMARY:', REPORT / 'summary.json', flush=True)
    critical_prefixes = ('CANONICAL_', 'SITEMAP_NOINDEX', 'SITEMAP_REDIRECT', 'FETCH_ERROR', 'HTTP_', 'NOT_HTML')
    has_blockers = any(issue.startswith(critical_prefixes) for issue in count)
    print('RELEASE_VERDICT:', 'NO-GO' if has_blockers else 'NO_CRITICAL_TECHNICAL_ERRORS', flush=True)
    return 1 if has_blockers else 0

if __name__ == '__main__':
    sys.exit(main())
