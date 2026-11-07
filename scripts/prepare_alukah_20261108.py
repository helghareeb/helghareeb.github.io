"""Preserve complete source paragraphs and overlay QPC Hafs excerpts with a receipt."""
from pathlib import Path
from bs4 import BeautifulSoup
import hashlib, json, re, unicodedata, zipfile

ROOT = Path(__file__).resolve().parents[1]
E = Path('E:/work/dawah-preview-tools/reader-20261107')
ZIP = Path('E:/work/hadith-audio/editorial/quran/kfgqpc_hafs_v30.zip')
def norm(s):
    text = ''.join(c for c in unicodedata.normalize('NFD',s) if unicodedata.category(c) != 'Mn').translate(str.maketrans({'ٱ':'ا','ى':'ي','ـ':''}))
    return re.sub(r'\bاو\s+لم\b', 'اولم', re.sub(r'يا\s+ايها', 'ياايها', text)).replace('سماوات','سموات')
def clean(s): return re.sub(r'\s+', ' ', s).strip()

def main():
    assert hashlib.sha256(ZIP.read_bytes()).hexdigest() == '227e6b1564d980f2bd09c2c35ebfb0330ac268c79a7c247cd1ab665bc635f245'
    with zipfile.ZipFile(ZIP) as z: verses=json.loads(z.read('kfgqpc_hafs_v30-data/kfgqpc_hafs_v30.json'))
    proof=[]
    for ident,slug,date,key in [('185905','mizan-8-denying-sanctity-justifying-desecration','2026-11-07','alukah-mizan-8'),('185836','la-ilaha-illa-allah-and-the-sweetness-of-faith','2026-11-03','alukah-sweetness-of-faith')]:
        soup=BeautifulSoup((E/f'article-{ident}.html').read_text(encoding='utf-8'),'html.parser')
        body=soup.select_one('#ArticleContent [itemprop="articleBody"]')
        pars=[]
        for p in body.find_all(['h1','h2','h3','p']):
            text=clean(p.get_text(' ',strip=True))
            if text: pars.append((p.name,text))
        (E/f'{ident}-source-paragraphs.json').write_text(json.dumps(pars,ensure_ascii=False,indent=2),encoding='utf-8')
        quotes=[]
        footnote_numbers={re.match(r'^\[(\d+)\]',t)[1] for _,t in pars if re.match(r'^\[(\d+)\]',t)}
        def replace_quote(match):
            original=match.group(1).strip(); parts=re.split(r'\s*\*\s*',original); output=[]; refs=[]
            for part in parts:
                needle=''.join(norm(part).split()); found=[]
                for v in verses:
                    plain=norm(v['aya_text_emlaey']).split()
                    joined=''.join(plain); start=joined.find(needle)
                    boundaries=[0]
                    for word in plain: boundaries.append(boundaries[-1]+len(word))
                    if start>=0 and start in boundaries and start+len(needle) in boundaries:
                        i=boundaries.index(start); end=boundaries.index(start+len(needle)); found.append((v,i,end-i))
                if len(found)!=1:
                    # The closing words of 3:64 also occur elsewhere; the source explicitly cites 3:64.
                    if part.strip()=='اشْهَدُوا بِأَنَّا مُسْلِمُونَ': found=[x for x in found if x[0]['sura_no']==3 and x[0]['aya_no']==64]
                    if part.strip()=='فَاسْأَلُوا أَهْلَ الذِّكْرِ إِنْ كُنْتُمْ لَا تَعْلَمُونَ': found=[x for x in found if x[0]['sura_no']==16 and x[0]['aya_no']==43]
                if len(found)!=1: raise ValueError((part,[(v['sura_no'],v['aya_no']) for v,_,_ in found]))
                v,start,count=found[0]; unicode_words=v['aya_text_unicode'].split(' ۝')[0].replace('۞ ','').split()
                assert len(unicode_words)==len(norm(v['aya_text_emlaey']).split()),v
                actual=' '.join(unicode_words[start:start+count]); output.append(actual); refs.append(f"{v['sura_no']}:{v['aya_no']}")
            text=' '.join(output);reference=','.join(refs)
            quotes.append({'original':original,'uthmani':text,'reference':reference,'source':'https://qurancomplex.gov.sa/quran-dev/'})
            return f'﴿<span class="quran-text" dir="rtl" lang="ar" data-quran-reference="{reference}">{text}</span>﴾'
        blocks=[]
        for tag,text in pars:
            # Preserve full footnotes as navigable Markdown notes.
            foot=re.match(r'^\[(\d+)\]\s*(.+)',text)
            if foot: text=f'[^{foot[1]}]: {foot[2]}'
            else:
                text=re.sub(r'\[(\d+)\]',lambda m: f'[^{m[1]}]' if m[1] in footnote_numbers else m[0],text)
                text=re.sub(r'﴿\s*(.*?)\s*﴾',replace_quote,text)
                if tag.startswith('h') or (len(text)<100 and text.endswith(':')) or text in ['الخطبة الأولى','الخطبة الثانية']:
                    text='## '+text
            blocks.append(text)
        title=clean(soup.select_one('#ctl00_MainContentPlaceHolder_ctl00_lblTitle [itemprop="name"]').get_text(' ',strip=True))
        meta={'title':title,'lang':'ar','date':date,'summary': 'مقال كامل من شبكة الألوكة مع الحواشي والمراجع.' if ident=='185905' else 'خطبتان في معنى التوحيد وحلاوة الإيمان، مع النص الكامل والحواشي والمراجع.','category':'شبهات فكرية وعقدية' if ident=='185905' else 'الخطب والمواعظ','translationKey':key,'sourceName':'شبكة الألوكة','articleType':'نسخة منشورة داخل الموقع لمقال خارجي','readingTime':'٨ دقائق' if ident=='185905' else '٢٥ دقيقة','externalUrl':f'https://www.alukah.net/sharia/0/{ident}/','draft':False}
        if ident=='185905':meta.update(series='سلسلة الميزان: كيف نزن الشبهات',seriesSlug='سلسله-الميزان-كيف-نزن-الشبهات',seriesOrder=8)
        front='---\n'+'\n'.join(k+': '+json.dumps(v,ensure_ascii=False) for k,v in meta.items())+'\n---\n\n'
        (ROOT/f'src/content/articles/{slug}-ar.md').write_text(front+'\n\n'.join(blocks)+'\n',encoding='utf-8')
        proof.append({'id':ident,'slug':slug,'source_paragraphs':len(pars),'footnotes':sum(bool(re.match(r'^\[\d+\]',t)) for _,t in pars),'quotes':quotes,'source_sha256':hashlib.sha256((E/f'article-{ident}.html').read_bytes()).hexdigest(),'Arabic_source_preserved_except_documented_QPC_overlay':True})
    (ROOT/'project-docs/alukah-20261108-source-proof.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print([(x['id'],x['source_paragraphs'],x['footnotes'],len(x['quotes'])) for x in proof])

if __name__=='__main__':main()
