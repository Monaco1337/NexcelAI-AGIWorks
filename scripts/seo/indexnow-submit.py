#!/usr/bin/env python3
"""IndexNow for sitemap-listed pages changed by the nonvisual SEO navigation patch.

Dry-run by default. --submit verifies the live ownership key file first.
Google does not use IndexNow; this is for participating search engines only.
"""
from __future__ import annotations
import argparse
import json
import pathlib
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

BASE = pathlib.Path(__file__).resolve().parent
KEYS = json.loads((BASE / 'indexnow-keys.json').read_text(encoding='utf-8'))
HOSTS = {'nexcel': 'www.nexcelai.de', 'agiworks': 'www.agiworks.de'}
ENDPOINT = 'https://api.indexnow.org/indexnow'


def request(url, data=None, headers=None):
    hdrs = {'User-Agent': 'NexcelAgiIndexNow/1.0', 'Accept': 'application/xml,text/plain,*/*'}
    if headers: hdrs.update(headers)
    req = urllib.request.Request(url, data=data, headers=hdrs)
    with urllib.request.urlopen(req, timeout=30) as res:
        return res.status, res.geturl(), res.read(2_000_000).decode('utf-8', 'replace')


def sitemap(host):
    status, final, body = request(f'https://{host}/sitemap.xml')
    if status != 200: raise RuntimeError(f'Sitemap status {status}')
    root = ET.fromstring(body)
    if root.tag.rsplit('}', 1)[-1] != 'urlset': raise RuntimeError('Not a URL sitemap')
    locs = [e.text.strip() for e in root.iter() if e.tag.rsplit('}', 1)[-1] == 'loc' and e.text]
    if not locs or len(locs) != len(set(locs)): raise RuntimeError('Empty or duplicate sitemap')
    for url in locs:
        u = urllib.parse.urlparse(url)
        if u.scheme != 'https' or u.hostname != host or u.query or u.fragment:
            raise RuntimeError(f'Invalid sitemap ownership: {url}')
    return locs


def changed_path(url):
    path = urllib.parse.urlparse(url).path
    return path.startswith(('/standorte/', '/wissen/', '/leistungen/', '/loesungen/'))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--submit', action='store_true', help='Actually notify participating search engines')
    parser.add_argument('--self-test', action='store_true', help='Run offline validation')
    args = parser.parse_args()
    for brand, host in HOSTS.items():
        key = KEYS[brand]
        if len(key) < 8 or len(key) > 128 or not all(c.isalnum() or c == '-' for c in key):
            raise RuntimeError(f'Invalid key for {brand}')
        local = BASE.parent.parent / 'public' / (key + '.txt')
        if local.read_text(encoding='utf-8').strip() != key:
            raise RuntimeError(f'Local ownership key mismatched: {local}')
    if args.self_test:
        assert changed_path('https://www.nexcelai.de/wissen/test')
        assert not changed_path('https://www.nexcelai.de/impressum')
        print('INDEXNOW_SELFTEST_OK')
        return 0
    for brand, host in HOSTS.items():
        key = KEYS[brand]
        root = f'https://{host}'
        key_url = f'{root}/{key}.txt'
        urls = [url for url in sitemap(host) if changed_path(url)]
        if not urls:
            raise RuntimeError(f'No updated pages in sitemap: {host}')
        print(f'{host}: {len(urls)} eligible updated content URLs', flush=True)
        if not args.submit:
            print('DRY RUN: no request sent to IndexNow. Run again with --submit after production deploy.')
            continue
        code, final, content = request(key_url)
        if code != 200 or final != key_url or content.strip() != key:
            raise RuntimeError(f'IndexNow ownership file not live or incorrect at {key_url}')
        payload = json.dumps({'host':host,'key':key,'keyLocation':key_url,'urlList':urls}).encode('utf-8')
        try:
            code, final, content = request(ENDPOINT, data=payload,
                headers={'Content-Type':'application/json; charset=utf-8'})
        except urllib.error.HTTPError as exc:
            raise RuntimeError(f'IndexNow {host}: HTTP {exc.code} {exc.read(1500)!r}') from exc
        if code not in (200, 202):
            raise RuntimeError(f'IndexNow {host}: unexpected code {code}: {content[:500]}')
        print(f'INDEXNOW_ACCEPTED: host={host}, URLs={len(urls)}, HTTP={code} (not an indexing guarantee)',flush=True)
    return 0

if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as exc:
        print('INDEXNOW_ERROR:', exc, file=sys.stderr)
        sys.exit(1)
