import urllib.request, urllib.parse, json, os
os.makedirs("_tools/prayer", exist_ok=True)
UA={"User-Agent":"poianopks-lesson-bot/1.0 (https://poianopks.github.io; educational)"}
def get(u):
    return urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=60).read()
log=[]
titles=["File:A Maiden's Prayer.mid","File:La prière d'une vierge, Op.4 (IA imslp-prire-dune-vierge-op4-bdarzewska-baranowska-tekla).pdf","File:The maiden's prayer = La prière d'une vierge - op. 4 (IA b1001004x).pdf"]
for i,t in enumerate(titles):
    u="https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url|extmetadata|size&format=json&titles="+urllib.parse.quote(t)
    try:
        d=json.loads(get(u)); pg=list(d["query"]["pages"].values())[0]; ii=pg["imageinfo"][0]
        md=ii.get("extmetadata",{}); log.append(f"{t}\n  url={ii['url']} size={ii.get('size')}\n  license={md.get('LicenseShortName',{}).get('value')} artist={md.get('Artist',{}).get('value','')[:200]}\n  desc={md.get('ImageDescription',{}).get('value','')[:400]}")
        data=get(ii["url"]); ext=os.path.splitext(ii["url"])[1]; open(f"_tools/prayer/src{i}{ext}","wb").write(data); log.append(f"  saved src{i}{ext} {len(data)}")
    except Exception as e: log.append(f"fail {t} {e}")
open("_tools/prayer/log.txt","w").write("\n".join(log)); print("\n".join(log))
