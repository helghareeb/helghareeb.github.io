"""Check complete Arabic preservation, explicit QPC overlays and paired footnote references."""
from pathlib import Path
import re, json, hashlib

ROOT=Path(__file__).resolve().parents[1]
E=Path('E:/work/dawah-preview-tools/reader-20261107')
proof=json.loads((ROOT/'project-docs/alukah-20261108-source-proof.json').read_text(encoding='utf-8'))
results=[]
for item in proof:
    source=E/f"article-{item['id']}.html"
    assert hashlib.sha256(source.read_bytes()).hexdigest()==item['source_sha256']
    ar=(ROOT/f"src/content/articles/{item['slug']}-ar.md").read_text(encoding='utf-8').split('---',2)[2].strip()
    for q in item['quotes']:
        ar=ar.replace('﴿<span class="quran-text" dir="rtl" lang="ar" data-quran-reference="'+q['reference']+'">'+q['uthmani']+'</span>﴾','﴿ '+q['original']+' ﴾')
    ar=re.sub(r'^## ', '', ar, flags=re.M)
    ar=re.sub(r'\[\^(\d+)\]: ',r'[\1] ',ar)
    ar=re.sub(r'\[\^(\d+)\]',r'[\1]',ar)
    expected=json.loads((E/f"{item['id']}-source-paragraphs.json").read_text(encoding='utf-8'))
    actual=ar.split('\n\n')
    assert len(actual)==len(expected)
    for i,(a,(_,b)) in enumerate(zip(actual,expected)):
        assert re.sub(r'\s+',' ',a).strip()==re.sub(r'\s+',' ',b).strip(),(item['id'],i)
    for lang in ['ar','en']:
        text=(ROOT/f"src/content/articles/{item['slug']}-{lang}.md").read_text(encoding='utf-8')
        definitions=re.findall(r'^\[\^(\d+)\]:',text,re.M)
        references=re.findall(r'\[\^(\d+)\](?!:)',text)
        assert len(definitions)==item['footnotes'] and len(set(definitions))==len(definitions)
        assert set(definitions)==set(references)
        assert f'translationKey: "'+('alukah-mizan-8' if item['id']=='185905' else 'alukah-sweetness-of-faith')+'"' in text
    results.append({'id':item['id'],'source_blocks_preserved':len(actual),'footnotes_each_language':item['footnotes'],'QPC_excerpts':len(item['quotes'])})
report={'passed':True,'results':results,'limits':'Structural/source preservation validation; English semantic comparison performed by assistant, not an independent human review.'}
(E/'article-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
