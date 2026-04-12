import type { APIRoute } from 'astro';

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const truncate = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;

export const GET: APIRoute = ({ url }) => {
  const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'ar';
  const rawTitle =
    url.searchParams.get('title') ||
    (lang === 'ar'
      ? 'الموقع الشخصي العلمي للدكتور هيثم الغريب'
      : 'Dr. Haitham A. El-Ghareeb');
  const title = escapeXml(truncate(rawTitle, lang === 'ar' ? 72 : 84));
  const subtitle = escapeXml(
    lang === 'ar'
      ? 'كتب، تحقيقات، مقالات، ومجالات علمية'
      : 'Books, critical editions, articles, and scholarly fields',
  );
  const siteLabel = escapeXml(
    lang === 'ar' ? 'موقع علمي ثنائي اللغة' : 'Bilingual scholarly website',
  );
  const direction = lang === 'ar' ? 'rtl' : 'ltr';
  const textAnchor = lang === 'ar' ? 'end' : 'start';
  const x = lang === 'ar' ? '1120' : '80';

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop stop-color="#f5efe3"/>
      <stop offset="1" stop-color="#e5d4b1"/>
    </linearGradient>
    <linearGradient id="panel" x1="140" y1="110" x2="1060" y2="520" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffffff" stop-opacity="0.92"/>
      <stop offset="1" stop-color="#f7f2e8" stop-opacity="0.88"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1060" cy="110" r="160" fill="#8b6b2e" fill-opacity="0.10"/>
  <circle cx="160" cy="540" r="180" fill="#5a3f18" fill-opacity="0.10"/>
  <rect x="60" y="60" width="1080" height="510" rx="28" fill="url(#panel)" stroke="#a4803a" stroke-opacity="0.24"/>
  <text x="${x}" y="150" font-size="28" font-family="Georgia, 'Times New Roman', serif" fill="#8b6b2e" text-anchor="${textAnchor}" direction="${direction}">${siteLabel}</text>
  <text x="${x}" y="275" font-size="58" font-weight="700" font-family="Georgia, 'Times New Roman', serif" fill="#2b2115" text-anchor="${textAnchor}" direction="${direction}">${title}</text>
  <text x="${x}" y="355" font-size="30" font-family="Georgia, 'Times New Roman', serif" fill="#5c4a2a" text-anchor="${textAnchor}" direction="${direction}">${subtitle}</text>
  <rect x="80" y="455" width="1040" height="2" fill="#b39252" fill-opacity="0.35"/>
  <text x="${x}" y="515" font-size="24" font-family="Georgia, 'Times New Roman', serif" fill="#6f5a34" text-anchor="${textAnchor}" direction="${direction}">helghareeb.github.io</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
