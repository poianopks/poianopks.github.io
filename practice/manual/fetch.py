#!/usr/bin/env python3
"""연습장: 삼성 사용 설명서 페이지를 받아 제목·목차·본문 텍스트를 저장."""
import re
from html import unescape
from urllib.request import Request, urlopen

URL = "https://doc.samsungmobile.com/SM-S938N/KOO/doc.html"
raw = urlopen(Request(URL, headers={"User-Agent": "Mozilla/5.0"}), timeout=30).read()
html = raw.decode("utf-8", "replace")
out = [f"# {URL}", f"- 바이트: {len(raw)}", ""]
m = re.search(r"<title>(.*?)</title>", html, re.S)
out.append(f"- 제목: {unescape(m.group(1)).strip() if m else '-'}")
srcs = re.findall(r'(?:src|href)="([^"]+)"', html)
out.append("- 링크/스크립트: " + ", ".join(srcs[:40]))
heads = re.findall(r"<h([1-4])[^>]*>(.*?)</h\1>", html, re.S)
out += ["", "## 제목들"] + [f"{'  '*(int(l)-1)}- {re.sub('<[^>]+>', '', unescape(t)).strip()}" for l, t in heads[:400]]
text = re.sub(r"<script.*?</script>|<style.*?</style>", " ", html, flags=re.S)
text = re.sub(r"<[^>]+>", "\n", text)
text = "\n".join(l.strip() for l in unescape(text).splitlines() if l.strip())
out += ["", "## 본문 (앞부분)", text[:60000]]
open("practice/manual/result.md", "w", encoding="utf-8").write("\n".join(out) + "\n")
print("\n".join(out)[:3000])
