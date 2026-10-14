#!/usr/bin/env python3
"""연습장: 유튜브 영상 정보와 자막을 받아 텍스트로 저장한다."""
import json
import sys
from urllib.request import Request, urlopen

VIDEO = "fqofgPCf8z8"
out = [f"# YouTube {VIDEO}", ""]

try:
    req = Request(f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={VIDEO}&format=json",
                  headers={"User-Agent": "Mozilla/5.0"})
    meta = json.loads(urlopen(req, timeout=20).read().decode())
    out += [f"- 제목: {meta.get('title')}", f"- 채널: {meta.get('author_name')}", ""]
except Exception as e:  # noqa: BLE001
    out.append(f"- oembed 오류: {e}")

try:
    import yt_dlp
    with yt_dlp.YoutubeDL({"quiet": True, "skip_download": True}) as ydl:
        info = ydl.extract_info(f"https://www.youtube.com/watch?v={VIDEO}", download=False)
    out += [f"- 게시일: {info.get('upload_date')}", f"- 길이(초): {info.get('duration')}",
            f"- 조회수: {info.get('view_count')}", "", "## 설명란", info.get("description") or "", ""]
    if info.get("chapters"):
        out.append("## 챕터")
        out += [f"- {int(c['start_time'])//60}:{int(c['start_time'])%60:02d} {c['title']}" for c in info["chapters"]]
        out.append("")
except Exception as e:  # noqa: BLE001
    out.append(f"- yt-dlp 오류: {e}")

try:
    from youtube_transcript_api import YouTubeTranscriptApi
    api = YouTubeTranscriptApi()
    tr = api.fetch(VIDEO, languages=["ko", "en"])
    out.append("## 자막")
    line, last = [], 0
    for s in tr:
        if s.start - last >= 60 and line:
            out.append(f"[{int(last)//60}분] " + " ".join(line)); line, last = [], s.start
        line.append(s.text.replace("\n", " "))
    if line:
        out.append(f"[{int(last)//60}분] " + " ".join(line))
except Exception as e:  # noqa: BLE001
    out.append(f"- 자막 오류: {type(e).__name__}: {str(e)[:300]}")

text = "\n".join(out)
print(text[:3000])
open("practice/youtube/result.md", "w", encoding="utf-8").write(text + "\n")
