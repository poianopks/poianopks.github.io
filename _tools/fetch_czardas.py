import urllib.request, urllib.parse, re, os, json
os.makedirs("_tools/czardas", exist_ok=True)
UA={"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36"}
def get(u, binary=False):
    r=urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=30); b=r.read()
    return b if binary else b.decode("utf-8","replace")
log=[]
def save(name, data):
    p=f"_tools/czardas/{name}"; open(p,"wb").write(data if isinstance(data,bytes) else data.encode()); log.append(f"saved {p} {len(data)}")
# flutetunes
try:
    h=get("https://www.flutetunes.com/tunes.php?id=391"); save("flutetunes.html",h)
    links=sorted(set(re.findall(r'href="([^"]+\.(?:mid|pdf|xml|mxl|musicxml|abc)[^"]*)"',h,re.I)))
    log.append("flutetunes links: "+json.dumps(links))
    for l in links:
        u=l if l.startswith("http") else "https://www.flutetunes.com/"+l.lstrip("/")
        try: save(os.path.basename(u.split("?")[0]) or "file", get(u,True))
        except Exception as e: log.append(f"fail {u} {e}")
except Exception as e: log.append(f"flutetunes fail {e}")
# abcnotation search
for q in ["czardas monti","csardas monti","czardas"]:
    try:
        h=get("https://abcnotation.com/searchTunes?q="+urllib.parse.quote(q)+"&f=c&o=a&s=0"); 
        tl=sorted(set(re.findall(r'href="(/tunePage\?a=[^"]+)"',h)))[:15]; log.append(f"abc {q}: {tl}")
    except Exception as e: log.append(f"abc fail {q} {e}")
# IMSLP page
try:
    h=get("https://imslp.org/wiki/Cs%C3%A1rd%C3%A1s_(Monti,_Vittorio)"); save("imslp.html",h)
    log.append("imslp files: "+json.dumps(sorted(set(re.findall(r'(https?://imslp\.org/wiki/Special:ImagefromIndex/\d+[^"]*)"',h)))[:40]))
except Exception as e: log.append(f"imslp fail {e}")
# mutopia
try:
    h=get("https://www.mutopiaproject.org/cgibin/make-table.cgi?searchingfor=monti"); save("mutopia.html",h)
except Exception as e: log.append(f"mutopia fail {e}")
open("_tools/czardas/log.txt","w").write("\n".join(log)); print("\n".join(log))
