# تفعيل عداد الزيارات وSEO بعد النشر

هذه المذكرة مخصصة للخطوات اليدوية التي لا تُنجز من داخل المستودع، بعد أن أصبح التنفيذ البرمجي داخل الموقع جاهزًا.

## 1. تفعيل GoatCounter

### المطلوب
- إنشاء حساب أو موقع داخل GoatCounter.
- استخراج اسم الموقع أو الكود المستخدم في الرابط:
  - `https://YOURCODE.goatcounter.com`

### خطوة GitHub
- افتح المستودع على GitHub.
- ادخل إلى:
  - `Settings`
  - `Secrets and variables`
  - `Actions`
  - `Variables`
- أضف متغيرًا جديدًا بالاسم:
  - `PUBLIC_GOATCOUNTER_CODE`
- واجعل قيمته:
  - `YOURCODE`
  وليس الرابط الكامل.

### بعد الإضافة
- شغّل `Deploy to GitHub Pages` من جديد، أو ادفع أي commit جديد.
- بعد اكتمال النشر، افتح:
  - الصفحة الرئيسية العربية
  - الصفحة الرئيسية الإنجليزية
  - صفحة مقالة عربية
  - صفحة مقالة إنجليزية
- تأكد من ظهور عداد:
  - زيارات الصفحة الرئيسية
  - زيارات هذه الصفحة

## 2. تفعيل Google Search Console

### إضافة الموقع
- افتح Google Search Console.
- أضف الخاصية:
  - `https://helghareeb.github.io/`

### التحقق
- استخدم طريقة التحقق المناسبة المتاحة للحساب أو للنطاق.
- بعد نجاح التحقق، انتقل إلى:
  - `Sitemaps`
- أرسل الخريطة:
  - `https://helghareeb.github.io/sitemap.xml`

## 3. طلب الفهرسة الأولية

بعد قبول `sitemap.xml` اطلب الفهرسة يدويًا لهذه الصفحات أولًا:
- `https://helghareeb.github.io/`
- `https://helghareeb.github.io/ar/`
- `https://helghareeb.github.io/en/`
- `https://helghareeb.github.io/ar/articles/`
- `https://helghareeb.github.io/en/articles/`
- `https://helghareeb.github.io/ar/books/`
- `https://helghareeb.github.io/en/books/`
- `https://helghareeb.github.io/ar/fields/alukah/articles/`
- `https://helghareeb.github.io/en/scholarly-fields/alukah/articles/`

## 4. ما الذي نراجعه بعد الإرسال

### في Search Console
- عدد الصفحات المفهرسة.
- الصفحات المستبعدة.
- أسباب الاستبعاد مثل:
  - `Crawled - currently not indexed`
  - `Discovered - currently not indexed`
  - مشاكل `canonical`

### في GoatCounter
- هل تسجَّل زيارة الصفحة الرئيسية؟
- هل تسجَّل زيارة الصفحة الداخلية؟
- هل العداد يظهر في العربية والإنجليزية؟

## 5. ملاحظات مهمة

- ملفا `robots.txt` و`sitemap.xml` مولدان داخل المشروع بالفعل.
- الميتاداتا الأساسية و`Open Graph` و`Twitter Cards` و`structured data` أصبحت مفعلة داخل القالب العام.
- إذا لم تظهر النتائج سريعًا في البحث، فهذا لا يعني وجود خطأ؛ الفهرسة قد تتأخر عدة أيام أو أكثر.

## 6. أقصر مسار تنفيذي

1. أضف `PUBLIC_GOATCOUNTER_CODE` في GitHub Variables.
2. أعد النشر.
3. أضف الموقع في Search Console.
4. أرسل `sitemap.xml`.
5. اطلب فهرسة الصفحات الأساسية.
6. راقب الاستبعاد والزيارات خلال الأيام التالية.
