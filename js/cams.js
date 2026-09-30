// cams.js — portal destinations (public 24/7 YouTube live webcams).
//
// IMPORTANT: stream IDs change when channels restart their streams. These IDs were collected from
// search results on 30 Sep 2026 and NOT yet verified from an unblocked network. The app tolerates
// this: a cam that fails to start within 15 s is marked dead for 6 h and the portal jumps to the
// next one. Run sources.html to test every entry and update this file (prompts/03_curate_sources.md).
//
// Fields: key, yt: [video IDs tried in order], ch: optional channel ID (embed/live_stream fallback),
// name/place {tr,en}, flag, tz (IANA, for local time), cat, lat/lon (future "sunrise now" mode).

const e = (key, yt, name, place, flag, tz, cat, lat, lon, ch) => ({
  key, yt: Array.isArray(yt) ? yt : [yt], ch: ch || null,
  name: typeof name === 'string' ? { tr: name, en: name } : name,
  place: typeof place === 'string' ? { tr: place, en: place } : place,
  flag, tz, cat, lat, lon,
});

export const CAMS = [
  // --- featured order: the first portals people see ---
  e('shibuya', ['8H3nRCFVR6Y', 'tujkoXI8rWM'], { tr: 'Shibuya Kavşağı', en: 'Shibuya Crossing' }, { tr: 'Tokyo, Japonya', en: 'Tokyo, Japan' }, '🇯🇵', 'Asia/Tokyo', 'city', 35.6595, 139.7005),
  e('golden-horn', 'MJNan51FocA', { tr: 'Haliç, Galata ve Kız Kulesi', en: 'Golden Horn & Galata' }, { tr: 'İstanbul, Türkiye', en: 'Istanbul, Türkiye' }, '🇹🇷', 'Europe/Istanbul', 'turkiye', 41.0256, 28.9744),
  e('iss', ['awQzjn72bI0', 'tj4knR4r1UU'], { tr: 'Uluslararası Uzay İstasyonu', en: 'International Space Station' }, { tr: 'Dünya yörüngesi, ~400 km', en: 'Low Earth orbit, ~400 km' }, '🛰️', 'UTC', 'space'),
  e('namib', ['ydYDqZQpim8', 'iQOHVoyun2k'], { tr: 'Namib Çölü Su Kaynağı', en: 'Namib Desert Waterhole' }, { tr: 'Namibya', en: 'Namibia' }, '🇳🇦', 'Africa/Windhoek', 'animals', -24.98, 16.02),
  e('times-square', ['VjSIXFwB_WQ', 'JQ_jwk_7OVE', 'z-jYdOIKcTQ'], 'Times Square', { tr: 'New York, ABD', en: 'New York, USA' }, '🇺🇸', 'America/New_York', 'city', 40.758, -73.9855),
  e('venice', ['L-IgLJMNkGU', 'x4AlaibltlA'], { tr: 'Venedik, San Marco', en: 'Venice, St Mark’s' }, { tr: 'Venedik, İtalya', en: 'Venice, Italy' }, '🇮🇹', 'Europe/Rome', 'city', 45.434, 12.3388),
  e('kelp', 'w3LjpFhySTg', { tr: 'Kelp Ormanı', en: 'Kelp Forest' }, { tr: 'Monterey Bay Akvaryumu, ABD', en: 'Monterey Bay Aquarium, USA' }, '🌊', 'America/Los_Angeles', 'water', 36.6182, -121.9018),
  e('lapland', ['pCpB5z99nC8', 'OSO8eu9azsQ', '1oD5dQPXr1Q', '_zy6kB7W77I'], { tr: 'Kuzey Işıkları, Abisko', en: 'Aurora Cam, Abisko' }, { tr: 'Laponya, İsveç', en: 'Lapland, Sweden' }, '🇸🇪', 'Europe/Stockholm', 'sky', 68.3579, 18.7947, 'UCx6-8cW9rHGNGhELh83fcCg'),
  e('fuji', ['fh4V_C5YkdE', 'bdUbACCWmoY', 'PxzwnWh1dKk', 'nyigy9zEJf8'], { tr: 'Fuji Dağı', en: 'Mount Fuji' }, { tr: 'Shizuoka, Japonya', en: 'Shizuoka, Japan' }, '🇯🇵', 'Asia/Tokyo', 'mountain', 35.3606, 138.7274),
  e('hk-harbour', ['qLogxA4vi_s', 'r1VOcQ1xUN0'], { tr: 'Victoria Limanı', en: 'Victoria Harbour' }, { tr: 'Hong Kong', en: 'Hong Kong' }, '🇭🇰', 'Asia/Hong_Kong', 'city', 22.293, 114.1694),
  e('kilauea', ['HggWKlZv9yk', 'gXKuUyKt8mc'], { tr: 'Kīlauea Yanardağı', en: 'Kīlauea Volcano' }, { tr: 'Hawaii, ABD', en: 'Hawaii, USA' }, '🌋', 'Pacific/Honolulu', 'nature', 19.4069, -155.2834),
  e('cappadocia', ['OoI3slt3Rso', 'SnlUWObWsgM'], { tr: 'Kapadokya', en: 'Cappadocia' }, { tr: 'Göreme, Türkiye', en: 'Göreme, Türkiye' }, '🇹🇷', 'Europe/Istanbul', 'turkiye', 38.6431, 34.8289),
  e('santorini', '2a4SrvF0iS8', 'Santorini', { tr: 'Yunanistan', en: 'Greece' }, '🇬🇷', 'Europe/Athens', 'beach', 36.4618, 25.3753),
  e('seoul', ['-JhoMGoAfFc', 'k3HEPqg5eAo'], { tr: 'Han Nehri', en: 'Han River' }, { tr: 'Seul, Güney Kore', en: 'Seoul, South Korea' }, '🇰🇷', 'Asia/Seoul', 'city', 37.5326, 126.9906),
  e('jellies', ['zL68biE6wAs', 'eQ_foBERmzA'], { tr: 'Denizanaları', en: 'Moon Jellies' }, { tr: 'Monterey Bay Akvaryumu, ABD', en: 'Monterey Bay Aquarium, USA' }, '🪼', 'America/Los_Angeles', 'water', 36.6182, -121.9018),
  e('eiffel', 'YkKGantlWH0', { tr: 'Eyfel Kulesi', en: 'Eiffel Tower' }, { tr: 'Paris, Fransa', en: 'Paris, France' }, '🇫🇷', 'Europe/Paris', 'city', 48.8584, 2.2945),
  e('copacabana', ['2PJfQY9LUoU', '6QoLEltTzIM'], 'Copacabana', { tr: 'Rio de Janeiro, Brezilya', en: 'Rio de Janeiro, Brazil' }, '🇧🇷', 'America/Sao_Paulo', 'beach', -22.9846, -43.1908),
  e('tembe', ['0P_LBKqVbfs', '1njXY8scn0E'], { tr: 'Tembe Fil Parkı', en: 'Tembe Elephant Park' }, { tr: 'Güney Afrika', en: 'South Africa' }, '🇿🇦', 'Africa/Johannesburg', 'animals', -26.9, 32.4),
  e('zermatt', ['o9puACFGW0o', 'JcHYcrO4PRE'], { tr: 'Matterhorn, Zermatt', en: 'Matterhorn, Zermatt' }, { tr: 'İsviçre Alpleri', en: 'Swiss Alps' }, '🇨🇭', 'Europe/Zurich', 'mountain', 45.9385, 7.73),
  e('sydney', '38wdFdK0S5I', { tr: 'Sidney Limanı', en: 'Sydney Harbour' }, { tr: 'Sidney, Avustralya', en: 'Sydney, Australia' }, '🇦🇺', 'Australia/Sydney', 'city', -33.8568, 151.2153),
  // --- rest of the rotation ---
  e('taksim', '9pwD66l3k7c', { tr: 'Taksim Meydanı', en: 'Taksim Square' }, { tr: 'İstanbul, Türkiye', en: 'Istanbul, Türkiye' }, '🇹🇷', 'Europe/Istanbul', 'turkiye', 41.037, 28.985),
  e('bosphorus', '_a70TKwqZ6w', { tr: 'Boğaziçi Köprüsü', en: 'Bosphorus Bridge' }, { tr: 'İstanbul, Türkiye', en: 'Istanbul, Türkiye' }, '🇹🇷', 'Europe/Istanbul', 'turkiye', 41.0451, 29.034),
  e('bourbon', ['ryyC8t-mxyQ', 'Ksrleaxxxhw'], { tr: 'Bourbon Sokağı', en: 'Bourbon Street' }, { tr: 'New Orleans, ABD', en: 'New Orleans, USA' }, '🇺🇸', 'America/Chicago', 'city', 29.9584, -90.0652),
  e('dubai', ['ka9MsehA8I4', 'MfIpyflPbHQ'], 'Dubai Marina', { tr: 'Dubai, BAE', en: 'Dubai, UAE' }, '🇦🇪', 'Asia/Dubai', 'city', 25.0805, 55.1403),
  e('bangkok', 'dt0vrwkp_Ys', { tr: 'Bangkok Silüeti', en: 'Bangkok Skyline' }, { tr: 'Bangkok, Tayland', en: 'Bangkok, Thailand' }, '🇹🇭', 'Asia/Bangkok', 'city', 13.7563, 100.5018),
  e('rome', 'lzIa_zCR8BQ', 'Roma', { tr: 'Roma, İtalya', en: 'Rome, Italy' }, '🇮🇹', 'Europe/Rome', 'city', 41.9028, 12.4964),
  e('tower-bridge', 'WpcxRYYc7vo', 'Tower Bridge', { tr: 'Londra, Birleşik Krallık', en: 'London, UK' }, '🇬🇧', 'Europe/London', 'city', 51.5055, -0.0754),
  e('shinjuku', ['ErHJBXTmm2Q', 'gTO_FJzv70k'], { tr: 'Shinjuku Kabukicho', en: 'Shinjuku Kabukicho' }, { tr: 'Tokyo, Japonya', en: 'Tokyo, Japan' }, '🇯🇵', 'Asia/Tokyo', 'city', 35.6952, 139.7031, 'UChKERpE7Um0Uq1btm_a9g5A'),
  e('reykjavik-aurora', '9GZNvSw3kMg', { tr: 'Reykjavik Gökyüzü', en: 'Reykjavik Sky' }, { tr: 'İzlanda', en: 'Iceland' }, '🇮🇸', 'Atlantic/Reykjavik', 'sky', 64.1466, -21.9426),
  e('reykjanes', 'U9QEbirKQx4', { tr: 'Reykjanes Yanardağ Bölgesi', en: 'Reykjanes Volcano Area' }, { tr: 'İzlanda', en: 'Iceland' }, '🇮🇸', 'Atlantic/Reykjavik', 'nature', 63.88, -22.43),
  e('cayman-reef', ['ZpnyPXloF2U', 'DHUnz4dyb54'], { tr: 'Mercan Resifi', en: 'Coral Reef' }, { tr: 'Cayman Adaları', en: 'Cayman Islands' }, '🐠', 'America/Cayman', 'water', 19.3133, -81.2546),
  e('roatan-reef', 'Sq-X4Ga1oyc', { tr: 'Resif Duvarı', en: 'Reef Wall' }, { tr: 'Roatán, Honduras', en: 'Roatán, Honduras' }, '🇭🇳', 'America/Tegucigalpa', 'water', 16.3, -86.53),
  e('brooks-falls', 'J7ZrIDvqlic', { tr: 'Brooks Şelalesi Ayıları', en: 'Brooks Falls Bears' }, { tr: 'Alaska, ABD', en: 'Alaska, USA' }, '🐻', 'America/Anchorage', 'animals', 58.5548, -155.7885),
  e('etosha', ['AeMUdOPFcXI', 'fZ6mUUZJH8c'], { tr: 'Okaukuejo Su Kaynağı', en: 'Okaukuejo Waterhole' }, { tr: 'Etosha, Namibya', en: 'Etosha, Namibia' }, '🇳🇦', 'Africa/Windhoek', 'animals', -19.1833, 15.9167),
  e('utsjoki', ['9TjOeBK14-I', '_WtUWtodDVA'], { tr: 'Finlandiya Laponyası', en: 'Finnish Lapland' }, { tr: 'Finlandiya', en: 'Finland' }, '🇫🇮', 'Europe/Helsinki', 'sky', 69.9076, 27.0263),
  e('monterey-bay', 'we3tKZxUIDw', { tr: 'Monterey Körfezi', en: 'Monterey Bay' }, { tr: 'Kaliforniya, ABD', en: 'California, USA' }, '🇺🇸', 'America/Los_Angeles', 'water', 36.6182, -121.9018),
  e('victoria-bc', 'mK5UmfMqhOY', { tr: 'Victoria Limanı', en: 'Victoria Harbour' }, { tr: 'Britanya Kolumbiyası, Kanada', en: 'British Columbia, Canada' }, '🇨🇦', 'America/Vancouver', 'water', 48.4284, -123.3656),
];

/** Always-available procedural destination (no internet needed). Used as fallback and for tests. */
export const OFFLINE_CAM = {
  key: 'offline-cosmos', offline: true, yt: [], ch: null,
  name: { tr: 'Kozmik Boşluk', en: 'Cosmic Void' },
  place: { tr: 'Çevrimdışı demo portal', en: 'Offline demo portal' },
  flag: '✨', tz: null, cat: 'space',
};

export function sourcesOf(entry) {
  const out = (entry.yt || []).map((id) => ({ type: 'yt', id, key: 'yt:' + id }));
  if (entry.ch) out.push({ type: 'ch', id: entry.ch, key: 'ch:' + entry.ch });
  return out;
}

/** Extract an 11-char video ID from any common YouTube URL form (watch, youtu.be, live, shorts, embed). */
export function parseYouTubeId(url) {
  if (!url) return null;
  const s = String(url).trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:v=|youtu\.be\/|\/live\/|\/shorts\/|\/embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}
