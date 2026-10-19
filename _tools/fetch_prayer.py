import urllib.request, urllib.parse, re, os, json
os.makedirs("_tools/prayer", exist_ok=True)
UA={"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36"}
log=[]
def get(u,binary=False):
    r=urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=30);b=r.read()
    return b if binary else b.decode("utf-8","replace")
def save(name,data):
    open("_tools/prayer/"+name,"wb").write(data if isinstance(data,bytes) else data.encode()); log.append(f"saved {name} {len(data)}")
def tryget(name,u,binary=False):
    try: d=get(u,binary); save(name,d); return d
    except Exception as e: log.append(f"fail {u} {e}"); return None
# Mutopia
h=tryget("mutopia_search.html","https://www.mutopiaproject.org/cgibin/make-table.cgi?searchingfor=badarzewska")
if h:
    for l in sorted(set(re.findall(r'href="([^"]+)"',h))):
        if re.search(r'\.(mid|ly|pdf|zip)$',l,re.I) or 'piece-info' in l: log.append("mutopia link: "+l)
    for l in sorted(set(re.findall(r'href="([^"]+\.(?:mid|ly))"',h,re.I))):
        u=l if l.startswith("http") else urllib.parse.urljoin("https://www.mutopiaproject.org/cgibin/",l)
        tryget(os.path.basename(u),u,True)
# Wikimedia Commons search for midi/ogg/pdf
for q in ["Badarzewska Maiden's Prayer","Modlitwa dziewicy","Bądarzewska"]:
    u="https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&format=json&srlimit=30&srsearch="+urllib.parse.quote(q)
    try:
        d=json.loads(get(u)); log.append(f"commons {q}: "+json.dumps([x['title'] for x in d['query']['search']],ensure_ascii=False))
    except Exception as e: log.append(f"commons fail {e}")
# IMSLP page
tryget("imslp.html","https://imslp.org/wiki/Modlitwa_dziewicy_(B%C4%85darzewska-Baranowska,_Tekla)")
# flutetunes / 8notes / others quick
for name,u in [("piano_midi_search.html","https://www.google.com/search?q=maiden%27s+prayer+midi")]:
    pass
open("_tools/prayer/log.txt","w").write("\n".join(log)); print("\n".join(log))
