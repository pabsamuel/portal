// cams.js — portal destinations (public 24/7 YouTube live webcams).
//
// Most IDs below were collected on 30 Sep 2026 from YouTube's "Live now" search in the owner's own
// browser (so they were live at that moment); a few older candidates are unverified. Stream IDs change
// when channels restart streams — that's fine: the Deck (js/deck.js) tests the next cam invisibly in a
// standby player and silently skips anything that is gone, not playing, or only a recording.
// Refresh this list monthly: prompts/03_curate_sources.md.
//
// Fields: key, yt: [video IDs tried in order], ch: optional channel ID (embed/live_stream fallback),
// name/place {tr,en}, flag, tz (IANA, for local time; null = unknown), cat.
// Only official public streams — never unsecured private cameras (see docs/CAMERA_SOURCES_AND_LICENSING.md).

const e = (key, yt, name, place, flag, tz, cat, ch) => ({
  key, yt: Array.isArray(yt) ? yt : [yt], ch: ch || null,
  name: typeof name === 'string' ? { tr: name, en: name } : name,
  place: typeof place === 'string' ? { tr: place, en: place } : place,
  flag, tz, cat,
});

/** Strong first impressions — shuffled among themselves at the start of every session. */
export const FEATURED_COUNT = 12;

export const CAMS = [
  // --- featured ---
  e('shibuya', ["dfVK7ld38Ys", "8H3nRCFVR6Y", "tujkoXI8rWM"], { tr: 'Shibuya Kavşağı', en: 'Shibuya Crossing' }, { tr: 'Tokyo, Japonya', en: 'Tokyo, Japan' }, '🇯🇵', 'Asia/Tokyo', 'city'),
  e('times-square', ["JQ_jwk_7OVE", "VjSIXFwB_WQ", "z-jYdOIKcTQ"], 'Times Square', { tr: 'New York, ABD', en: 'New York, USA' }, '🇺🇸', 'America/New_York', 'city'),
  e('kilauea', ["HggWKlZv9yk", "iws3rh5vLAQ", "6IaMqotNF_s", "f9-oSpYpubg", "gXKuUyKt8mc"], { tr: 'Kīlauea Yanardağı', en: 'Kīlauea Volcano' }, { tr: 'Hawaii, ABD', en: 'Hawaii, USA' }, '🌋', 'Pacific/Honolulu', 'nature'),
  e('iss', ["awQzjn72bI0", "0FBiyFpV__g", "M3HKLzjvKPc", "OKQEMp2555A", "tj4knR4r1UU"], { tr: 'Uluslararası Uzay İstasyonu', en: 'International Space Station' }, { tr: 'Dünya yörüngesi, ~400 km', en: 'Earth orbit, ~400 km' }, '🛰️', 'UTC', 'space'),
  e('namib', ["ydYDqZQpim8", "iQOHVoyun2k"], { tr: 'Namib Çölü Su Kaynağı', en: 'Namib Desert Waterhole' }, { tr: 'Namibya', en: 'Namibia' }, '🇳🇦', 'Africa/Windhoek', 'animals'),
  e('venice', ["a1mcaV3Sf9U", "mt7uE-n0YPI", "L-IgLJMNkGU", "x4AlaibltlA"], { tr: 'Venedik Kanalları', en: 'Venice Canals' }, { tr: 'Venedik, İtalya', en: 'Venice, Italy' }, '🇮🇹', 'Europe/Rome', 'city'),
  e('kelp', ["w3LjpFhySTg"], { tr: 'Kelp Ormanı', en: 'Kelp Forest' }, { tr: 'Monterey Bay Akvaryumu, ABD', en: 'Monterey Bay Aquarium, USA' }, '🌊', 'America/Los_Angeles', 'water'),
  e('fuji', ["GsD9QQEKSzQ", "hBaHx5WdnbQ", "bdUbACCWmoY", "1cnReFAU04k", "fh4V_C5YkdE", "PxzwnWh1dKk", "nyigy9zEJf8"], { tr: 'Fuji Dağı', en: 'Mount Fuji' }, { tr: 'Japonya', en: 'Japan' }, '🇯🇵', 'Asia/Tokyo', 'mountain'),
  e('niagara', ["7gBzLGlJnwk", "qx7gry390YA"], { tr: 'Niagara Şelalesi', en: 'Niagara Falls' }, { tr: 'Kanada / ABD', en: 'Canada / USA' }, '🇨🇦', 'America/Toronto', 'nature'),
  e('maho', ["iSeH45R-8R0"], { tr: 'Maho Plajı — alçak uçan uçaklar', en: 'Maho Beach — low-flying planes' }, { tr: 'Sint Maarten, Karayipler', en: 'Sint Maarten, Caribbean' }, '🏝️', 'America/Puerto_Rico', 'beach'),
  e('panda', ["SUXPnIEpbn4"], { tr: 'Dev Pandalar', en: 'Giant Pandas' }, { tr: 'Chengdu, Çin', en: 'Chengdu, China' }, '🐼', 'Asia/Shanghai', 'animals'),
  e('golden-horn', ["MJNan51FocA"], { tr: 'Haliç, Galata ve Kız Kulesi', en: 'Golden Horn & Galata' }, { tr: 'İstanbul, Türkiye', en: 'Istanbul, Türkiye' }, '🇹🇷', 'Europe/Istanbul', 'turkiye'),
  // --- the rest of the world ---
  e('taksim', ["9pwD66l3k7c"], { tr: 'Taksim Meydanı', en: 'Taksim Square' }, { tr: 'İstanbul, Türkiye', en: 'Istanbul, Türkiye' }, '🇹🇷', 'Europe/Istanbul', 'turkiye'),
  e('bosphorus', ["_a70TKwqZ6w"], { tr: 'Boğaziçi Köprüsü', en: 'Bosphorus Bridge' }, { tr: 'İstanbul, Türkiye', en: 'Istanbul, Türkiye' }, '🇹🇷', 'Europe/Istanbul', 'turkiye'),
  e('cappadocia', ["OoI3slt3Rso", "SnlUWObWsgM"], { tr: 'Kapadokya', en: 'Cappadocia' }, 'Göreme, Türkiye', '🇹🇷', 'Europe/Istanbul', 'turkiye'),
  e('kabukicho', ["DjdUEyjx8GM", "gFRtAAmiFbE", "ErHJBXTmm2Q", "6dp-bvQ7RWo", "gTO_FJzv70k"], 'Shinjuku Kabukicho', { tr: 'Tokyo, Japonya', en: 'Tokyo, Japan' }, '🇯🇵', 'Asia/Tokyo', 'city'),
  e('odaiba', ["GJhnjzX5xYI"], { tr: 'Odaiba Körfezi', en: 'Odaiba Bay' }, { tr: 'Tokyo, Japonya', en: 'Tokyo, Japan' }, '🇯🇵', 'Asia/Tokyo', 'city'),
  e('shiodome', ["VM18f-IIUTw"], { tr: 'Shiodome Silüeti', en: 'Shiodome Skyline' }, { tr: 'Tokyo, Japonya', en: 'Tokyo, Japan' }, '🇯🇵', 'Asia/Tokyo', 'city'),
  e('dotonbori', ["i2PpmC1IeKk"], 'Dotonbori', { tr: 'Osaka, Japonya', en: 'Osaka, Japan' }, '🇯🇵', 'Asia/Tokyo', 'city'),
  e('shinsaibashi', ["YZMZSqz9fx8"], 'Shinsaibashi', { tr: 'Osaka, Japonya', en: 'Osaka, Japan' }, '🇯🇵', 'Asia/Tokyo', 'city'),
  e('osaka-night', ["YIjxwMxWzgE", "R6cWQHTQq-c", "lTwTPS18dws"], { tr: 'Osaka Manzarası', en: 'Osaka Skyline' }, { tr: 'Osaka, Japonya', en: 'Osaka, Japan' }, '🇯🇵', 'Asia/Tokyo', 'city'),
  e('kiyomizu', ["cUnYPpK7ENk"], 'Kiyomizu-zaka', { tr: 'Kyoto, Japonya', en: 'Kyoto, Japan' }, '🇯🇵', 'Asia/Tokyo', 'city'),
  e('arashiyama', ["JLlY6Cg17cc"], { tr: 'Arashiyama Bambu Ormanı', en: 'Arashiyama Bamboo Grove' }, { tr: 'Kyoto, Japonya', en: 'Kyoto, Japan' }, '🇯🇵', 'Asia/Tokyo', 'nature'),
  e('gion', ["J3xHBUgWRqc"], { tr: 'Gion, Hanamikoji Sokağı', en: 'Gion, Hanamikoji Street' }, { tr: 'Kyoto, Japonya', en: 'Kyoto, Japan' }, '🇯🇵', 'Asia/Tokyo', 'city'),
  e('fushimi', ["MMeBDRfRHyA"], { tr: 'Fushimi Inari Tapınağı', en: 'Fushimi Inari Shrine' }, { tr: 'Kyoto, Japonya', en: 'Kyoto, Japan' }, '🇯🇵', 'Asia/Tokyo', 'city'),
  e('togetsukyo', ["jqtsC5BYlIk"], { tr: 'Togetsukyo Köprüsü', en: 'Togetsukyo Bridge' }, { tr: 'Kyoto, Japonya', en: 'Kyoto, Japan' }, '🇯🇵', 'Asia/Tokyo', 'nature'),
  e('sakurajima', ["PeElJClXtzE"], { tr: 'Sakurajima Yanardağı', en: 'Sakurajima Volcano' }, { tr: 'Kagoshima, Japonya', en: 'Kagoshima, Japan' }, '🌋', 'Asia/Tokyo', 'nature'),
  e('han-river', ["5gVrWGRZo9s", "HDblGb_WV5Y", "-JhoMGoAfFc"], { tr: 'Han Nehri', en: 'Han River' }, { tr: 'Seul, Güney Kore', en: 'Seoul, South Korea' }, '🇰🇷', 'Asia/Seoul', 'city'),
  e('namsan', ["0v8x5wyXeB8"], { tr: 'Namsan Kulesi', en: 'Namsan Tower' }, { tr: 'Seul, Güney Kore', en: 'Seoul, South Korea' }, '🇰🇷', 'Asia/Seoul', 'city'),
  e('gyeongbok', ["cCRm_ZwxH1w"], { tr: 'Gyeongbokgung Sarayı', en: 'Gyeongbokgung Palace' }, { tr: 'Seul, Güney Kore', en: 'Seoul, South Korea' }, '🇰🇷', 'Asia/Seoul', 'city'),
  e('jamsil', ["OCfFNf1oUFo"], { tr: 'Jamsil Köprüsü', en: 'Jamsil Bridge' }, { tr: 'Seul, Güney Kore', en: 'Seoul, South Korea' }, '🇰🇷', 'Asia/Seoul', 'city'),
  e('taipei101', ["z_fY1pj1VBw", "uvwfYzwY8tg"], { tr: 'Taipei 101 Manzarası', en: 'Taipei 101 View' }, { tr: 'Taipei, Tayvan', en: 'Taipei, Taiwan' }, '🇹🇼', 'Asia/Taipei', 'city'),
  e('jiufen', ["XSD5ptYisw8"], { tr: 'Jiufen Dağ Köyü', en: 'Jiufen Mountain Town' }, { tr: 'Tayvan', en: 'Taiwan' }, '🇹🇼', 'Asia/Taipei', 'mountain'),
  e('hk-harbour', ["qLogxA4vi_s", "r1VOcQ1xUN0"], { tr: 'Victoria Limanı', en: 'Victoria Harbour' }, 'Hong Kong', '🇭🇰', 'Asia/Hong_Kong', 'city'),
  e('sukhumvit', ["Q71sLS8h9a4", "UemFRPrl1hk", "dt0vrwkp_Ys"], { tr: 'Sukhumvit Caddesi', en: 'Sukhumvit Road' }, { tr: 'Bangkok, Tayland', en: 'Bangkok, Thailand' }, '🇹🇭', 'Asia/Bangkok', 'city'),
  e('singapore', ["0mCvOcMW82w"], { tr: 'Singapur Finans Merkezi', en: 'Singapore CBD' }, { tr: 'Singapur', en: 'Singapore' }, '🇸🇬', 'Asia/Singapore', 'city'),
  e('dubai', ["ka9MsehA8I4", "MfIpyflPbHQ"], 'Dubai Marina', { tr: 'Dubai, BAE', en: 'Dubai, UAE' }, '🇦🇪', 'Asia/Dubai', 'city'),
  e('nyc-views', ["VGnFLdQW39A"], { tr: 'New York Manzaraları', en: 'New York Views' }, { tr: 'New York, ABD', en: 'New York, USA' }, '🇺🇸', 'America/New_York', 'city'),
  e('bryant-park', ["QIIVxUJzJQw"], 'Bryant Park', { tr: 'New York, ABD', en: 'New York, USA' }, '🇺🇸', 'America/New_York', 'city'),
  e('wtc', ["5C9oM7C2Q9k"], { tr: 'Dünya Ticaret Merkezi', en: 'World Trade Center' }, { tr: 'New York, ABD', en: 'New York, USA' }, '🇺🇸', 'America/New_York', 'city'),
  e('vanderbilt', ["2_PDaUJbfuI"], 'SUMMIT One Vanderbilt', { tr: 'New York, ABD', en: 'New York, USA' }, '🇺🇸', 'America/New_York', 'city'),
  e('brooklyn', ["1kvGNR_A3DY"], { tr: 'Brooklyn Köprüsü', en: 'Brooklyn Bridge' }, { tr: 'New York, ABD', en: 'New York, USA' }, '🇺🇸', 'America/New_York', 'city'),
  e('east-river', ["ZqRNS37kVv0"], { tr: 'East River Feribotları', en: 'East River Ferries' }, { tr: 'New York, ABD', en: 'New York, USA' }, '🇺🇸', 'America/New_York', 'water'),
  e('vegas-strip', ["Xk9vvUhKWKw"], 'Las Vegas Strip', { tr: 'Las Vegas, ABD', en: 'Las Vegas, USA' }, '🇺🇸', 'America/Los_Angeles', 'city'),
  e('bellagio', ["KJuGU7v5oYw"], { tr: 'Bellagio Botanik Bahçesi', en: 'Bellagio Conservatory' }, { tr: 'Las Vegas, ABD', en: 'Las Vegas, USA' }, '🇺🇸', 'America/Los_Angeles', 'city'),
  e('chicago', ["O0UGT7AT3aw"], 'Chicago Skydeck', { tr: 'Chicago, ABD', en: 'Chicago, USA' }, '🇺🇸', 'America/Chicago', 'city'),
  e('new-orleans', ["QxFFjXu_zqs", "ryyC8t-mxyQ", "Ksrleaxxxhw"], { tr: 'Fransız Mahallesi', en: 'French Quarter' }, { tr: 'New Orleans, ABD', en: 'New Orleans, USA' }, '🇺🇸', 'America/Chicago', 'city'),
  e('rio', ["axELjHiqIic"], { tr: 'Rio Panoraması', en: 'Rio Panorama' }, { tr: 'Rio de Janeiro, Brezilya', en: 'Rio de Janeiro, Brazil' }, '🇧🇷', 'America/Sao_Paulo', 'city'),
  e('dublin', ["3nyPER2kzqk"], { tr: 'Dublin Sokakları', en: 'Dublin Streets' }, { tr: 'Dublin, İrlanda', en: 'Dublin, Ireland' }, '🇮🇪', 'Europe/Dublin', 'city'),
  e('notting-hill', ["l5WTpOwCvlg"], 'Notting Hill Gate', { tr: 'Londra, Birleşik Krallık', en: 'London, UK' }, '🇬🇧', 'Europe/London', 'city'),
  e('tower-bridge', ["WpcxRYYc7vo"], 'Tower Bridge', { tr: 'Londra, Birleşik Krallık', en: 'London, UK' }, '🇬🇧', 'Europe/London', 'city'),
  e('sacre-coeur', ["-xzg3wujOVM"], 'Sacré-Cœur, Montmartre', { tr: 'Paris, Fransa', en: 'Paris, France' }, '🇫🇷', 'Europe/Paris', 'city'),
  e('eiffel', ["YkKGantlWH0"], { tr: 'Eyfel Kulesi', en: 'Eiffel Tower' }, { tr: 'Paris, Fransa', en: 'Paris, France' }, '🇫🇷', 'Europe/Paris', 'city'),
  e('rome', ["lzIa_zCR8BQ"], { tr: 'Roma', en: 'Rome' }, { tr: 'Roma, İtalya', en: 'Rome, Italy' }, '🇮🇹', 'Europe/Rome', 'city'),
  e('amsterdam-bridges', ["2tgHBRFHMm8"], { tr: 'Beş Köprü Kanalı', en: 'Five Bridges Canal' }, { tr: 'Amsterdam, Hollanda', en: 'Amsterdam, Netherlands' }, '🇳🇱', 'Europe/Amsterdam', 'city'),
  e('amsterdam-centraal', ["FHJH2yMe6Hw"], 'Amsterdam Centraal', { tr: 'Amsterdam, Hollanda', en: 'Amsterdam, Netherlands' }, '🇳🇱', 'Europe/Amsterdam', 'city'),
  e('groningen', ["ZjfFGJlkjmE"], 'Grote Markt', { tr: 'Groningen, Hollanda', en: 'Groningen, Netherlands' }, '🇳🇱', 'Europe/Amsterdam', 'city'),
  e('alexanderplatz', ["IRqboacDNFg", "8djINznvJDs"], 'Alexanderplatz', { tr: 'Berlin, Almanya', en: 'Berlin, Germany' }, '🇩🇪', 'Europe/Berlin', 'city'),
  e('prague-station', ["tmlE1ct0cYk"], { tr: 'Prag Ana Garı', en: 'Prague Main Station' }, { tr: 'Prag, Çekya', en: 'Prague, Czechia' }, '🇨🇿', 'Europe/Prague', 'city'),
  e('hannover-rail', ["2yldbFFXSt8"], { tr: 'Hannover Tren Trafiği', en: 'Hannover Rail Traffic' }, { tr: 'Hannover, Almanya', en: 'Hanover, Germany' }, '🇩🇪', 'Europe/Berlin', 'city'),
  e('nl-rail', ["wxPi28clpk8"], { tr: 'Hollanda Demiryolu', en: 'Dutch Railway' }, { tr: 'Hollanda', en: 'Netherlands' }, '🇳🇱', 'Europe/Amsterdam', 'city'),
  e('luzern', ["QIt1FaDMnQc"], { tr: 'Luzern', en: 'Lucerne' }, { tr: 'Luzern, İsviçre', en: 'Lucerne, Switzerland' }, '🇨🇭', 'Europe/Zurich', 'city'),
  e('oslo', ["faKBmRq0lYg"], 'Oslo', { tr: 'Oslo, Norveç', en: 'Oslo, Norway' }, '🇳🇴', 'Europe/Oslo', 'city'),
  e('reykjavik', ["tYgGEC-ESTw"], 'Reykjavik', { tr: 'Reykjavik, İzlanda', en: 'Reykjavik, Iceland' }, '🇮🇸', 'Atlantic/Reykjavik', 'city'),
  e('porto', ["lfrjNVD10RU"], { tr: 'Ribeira ve Gaia', en: 'Ribeira & Gaia' }, { tr: 'Porto, Portekiz', en: 'Porto, Portugal' }, '🇵🇹', 'Europe/Lisbon', 'city'),
  e('rovaniemi', ["Cp4RRAEgpeU"], { tr: 'Noel Baba Köyü', en: 'Santa Claus Village' }, { tr: 'Rovaniemi, Finlandiya', en: 'Rovaniemi, Finland' }, '🇫🇮', 'Europe/Helsinki', 'city'),
  e('heathrow', ["V7o2tJHFPh4"], { tr: 'Heathrow Havalimanı', en: 'Heathrow Airport' }, { tr: 'Londra, Birleşik Krallık', en: 'London, UK' }, '✈️', 'Europe/London', 'city'),
  e('lax', ["n4I0d44oBEs"], { tr: 'LAX Havalimanı', en: 'LAX Airport' }, { tr: 'Los Angeles, ABD', en: 'Los Angeles, USA' }, '✈️', 'America/Los_Angeles', 'city'),
  e('taoyuan', ["91PfFoqvuUk", "wWEnxWA7nnY"], { tr: 'Taoyuan Havalimanı', en: 'Taoyuan Airport' }, { tr: 'Tayvan', en: 'Taiwan' }, '✈️', 'Asia/Taipei', 'city'),
  e('lanzarote-airport', ["AAlo3eCPVbk"], { tr: 'Lanzarote Havalimanı', en: 'Lanzarote Airport' }, { tr: 'Kanarya Adaları, İspanya', en: 'Canary Islands, Spain' }, '✈️', 'Atlantic/Canary', 'city'),
  e('itami', ["qwKh-LOkomQ", "nVeVH2ssSYI"], { tr: 'Itami Havalimanı', en: 'Itami Airport' }, { tr: 'Osaka, Japonya', en: 'Osaka, Japan' }, '✈️', 'Asia/Tokyo', 'city'),
  e('coral-city', ["7i8ARjIeM2k"], { tr: 'Su Altı Mercan Şehri', en: 'Underwater Coral City' }, { tr: 'Miami, ABD', en: 'Miami, USA' }, '🐠', 'America/New_York', 'water'),
  e('shark-cam', ["tEtg5Kg3voQ"], { tr: 'Köpekbalığı Kamerası', en: 'Shark Cam' }, { tr: 'Monterey Bay Akvaryumu, ABD', en: 'Monterey Bay Aquarium, USA' }, '🦈', 'America/Los_Angeles', 'water'),
  e('jellies', ["zL68biE6wAs", "eQ_foBERmzA"], { tr: 'Denizanaları', en: 'Moon Jellies' }, { tr: 'Monterey Bay Akvaryumu, ABD', en: 'Monterey Bay Aquarium, USA' }, '🪼', 'America/Los_Angeles', 'water'),
  e('monterey-bay', ["we3tKZxUIDw"], { tr: 'Monterey Körfezi', en: 'Monterey Bay' }, { tr: 'Kaliforniya, ABD', en: 'California, USA' }, '🇺🇸', 'America/Los_Angeles', 'water'),
  e('deerfield-reef', ["SHfAtWHr9Ks"], { tr: 'Deerfield Su Altı Resifi', en: 'Deerfield Underwater Reef' }, { tr: 'Florida, ABD', en: 'Florida, USA' }, '🐠', 'America/New_York', 'water'),
  e('cayman-reef', ["ZpnyPXloF2U", "DHUnz4dyb54"], { tr: 'Mercan Resifi', en: 'Coral Reef' }, { tr: 'Cayman Adaları', en: 'Cayman Islands' }, '🐠', 'America/Cayman', 'water'),
  e('roatan-reef', ["Sq-X4Ga1oyc"], { tr: 'Resif Duvarı', en: 'Reef Wall' }, 'Roatán, Honduras', '🇭🇳', 'America/Tegucigalpa', 'water'),
  e('port-miami', ["m1R-LmvVt30", "KnAv_ejMA5s"], { tr: 'Miami Limanı Kruvaziyerleri', en: 'Port Miami Cruise Ships' }, { tr: 'Miami, ABD', en: 'Miami, USA' }, '🛳️', 'America/New_York', 'water'),
  e('port-huron', ["AwP_Q6IGwFs"], { tr: 'St. Clair Nehri Gemileri', en: 'St. Clair River Ships' }, { tr: 'Port Huron, ABD', en: 'Port Huron, USA' }, '🚢', 'America/Detroit', 'water'),
  e('detroit-river', ["3RMjVIj0-rI"], { tr: 'Detroit Nehri', en: 'Detroit River' }, { tr: 'Detroit, ABD', en: 'Detroit, USA' }, '🚢', 'America/Detroit', 'water'),
  e('rotterdam', ["M09NaBVPjAI"], { tr: 'Rotterdam Limanı', en: 'Port of Rotterdam' }, { tr: 'Rotterdam, Hollanda', en: 'Rotterdam, Netherlands' }, '⚓', 'Europe/Amsterdam', 'water'),
  e('dublin-port', ["K_ye7QHXosQ"], { tr: 'Dublin Limanı', en: 'Dublin Port' }, { tr: 'Dublin, İrlanda', en: 'Dublin, Ireland' }, '⚓', 'Europe/Dublin', 'water'),
  e('hammerfest', ["5VoO4DGb3K4"], { tr: 'Hammerfest Limanı', en: 'Hammerfest Harbour' }, { tr: 'Hammerfest, Norveç', en: 'Hammerfest, Norway' }, '🇳🇴', 'Europe/Oslo', 'water'),
  e('auckland', ["PaLDpyFxpXE", "nLCMw_Fh0u0"], { tr: 'Auckland Limanı', en: 'Auckland Harbour' }, { tr: 'Auckland, Yeni Zelanda', en: 'Auckland, New Zealand' }, '🇳🇿', 'Pacific/Auckland', 'water'),
  e('vancouver', ["GHEmhcWjiTE", "rxyNjFKwzJA"], { tr: 'Vancouver Limanı', en: 'Vancouver Harbour' }, { tr: 'Vancouver, Kanada', en: 'Vancouver, Canada' }, '🇨🇦', 'America/Vancouver', 'water'),
  e('victoria-bc', ["mK5UmfMqhOY"], { tr: 'Victoria Limanı', en: 'Victoria Harbour' }, { tr: 'Britanya Kolumbiyası, Kanada', en: 'British Columbia, Canada' }, '🇨🇦', 'America/Vancouver', 'water'),
  e('funchal', ["f6D3Zq6J5A8"], { tr: 'Funchal Marinası', en: 'Funchal Marina' }, { tr: 'Madeira, Portekiz', en: 'Madeira, Portugal' }, '🇵🇹', 'Atlantic/Madeira', 'water'),
  e('sydney', ["5uZa3-RMFos", "jshwkG1ZpP8", "38wdFdK0S5I"], { tr: 'Sidney Limanı', en: 'Sydney Harbour' }, { tr: 'Sidney, Avustralya', en: 'Sydney, Australia' }, '🇦🇺', 'Australia/Sydney', 'city'),
  e('lake-hood', ["61pi8UjLOlo"], { tr: 'Deniz Uçağı Üssü', en: 'Seaplane Base' }, 'Anchorage, Alaska', '🛩️', 'America/Anchorage', 'water'),
  e('copacabana', ["Hr7c0XuEgm0", "2PJfQY9LUoU", "6QoLEltTzIM"], 'Copacabana', { tr: 'Rio de Janeiro, Brezilya', en: 'Rio de Janeiro, Brazil' }, '🇧🇷', 'America/Sao_Paulo', 'beach'),
  e('camboriu', ["5Xl6pSgiy3A"], 'Balneário Camboriú', { tr: 'Santa Catarina, Brezilya', en: 'Santa Catarina, Brazil' }, '🇧🇷', 'America/Sao_Paulo', 'beach'),
  e('south-beach', ["HaOC_6s-9Pw"], 'South Beach', { tr: 'Miami, ABD', en: 'Miami, USA' }, '🇺🇸', 'America/New_York', 'beach'),
  e('fort-lauderdale', ["pXx3YQVSUGg"], { tr: 'Fort Lauderdale Plajı', en: 'Fort Lauderdale Beach' }, { tr: 'Florida, ABD', en: 'Florida, USA' }, '🇺🇸', 'America/New_York', 'beach'),
  e('deerfield-beach', ["rdeoEeJ00xA"], { tr: 'Deerfield Plajı', en: 'Deerfield Beach' }, { tr: 'Florida, ABD', en: 'Florida, USA' }, '🇺🇸', 'America/New_York', 'beach'),
  e('okaloosa', ["9rl1gWxXgC8"], { tr: 'Okaloosa Adası İskelesi', en: 'Okaloosa Island Pier' }, { tr: 'Florida, ABD', en: 'Florida, USA' }, '🇺🇸', 'America/Chicago', 'beach'),
  e('venice-beach', ["EO_1LWqsCNE"], 'Venice Beach', { tr: 'Los Angeles, ABD', en: 'Los Angeles, USA' }, '🇺🇸', 'America/Los_Angeles', 'beach'),
  e('pacifica', ["q0Z7tv_7n-0", "BrUaOjjXgZM", "TDcKozRHlKs"], { tr: 'Pacifica Kıyısı', en: 'Pacifica Coast' }, { tr: 'Kaliforniya, ABD', en: 'California, USA' }, '🇺🇸', 'America/Los_Angeles', 'beach'),
  e('white-bay', ["V_I168MM-ik"], 'White Bay', { tr: 'Jost Van Dyke, Karayipler', en: 'Jost Van Dyke, Caribbean' }, '🏝️', 'America/Tortola', 'beach'),
  e('mambo-beach', ["loHbMM9JfCs"], { tr: 'Mambo Plajı', en: 'Mambo Beach' }, { tr: 'Curaçao, Karayipler', en: 'Curaçao, Caribbean' }, '🏝️', 'America/Curacao', 'beach'),
  e('cozumel', ["JX1O3DKjY-k"], 'Cozumel', { tr: 'Quintana Roo, Meksika', en: 'Quintana Roo, Mexico' }, '🇲🇽', 'America/Cancun', 'beach'),
  e('koh-samui', ["3N3ZwIB_X4Y", "Fw9hgttWzIg"], { tr: 'Lamai Plajı', en: 'Lamai Beach' }, { tr: 'Koh Samui, Tayland', en: 'Koh Samui, Thailand' }, '🇹🇭', 'Asia/Bangkok', 'beach'),
  e('koh-phangan', ["MW3fisTCXRQ"], { tr: 'Koh Phangan Kıyısı', en: 'Koh Phangan Shore' }, { tr: 'Koh Phangan, Tayland', en: 'Koh Phangan, Thailand' }, '🇹🇭', 'Asia/Bangkok', 'beach'),
  e('jimbaran', ["L1duJDAqbJY"], 'Jimbaran', { tr: 'Bali, Endonezya', en: 'Bali, Indonesia' }, '🇮🇩', 'Asia/Makassar', 'beach'),
  e('maldives', ["neprxg6F3Sc"], { tr: 'Maldivler', en: 'Maldives' }, { tr: 'Maldivler', en: 'Maldives' }, '🇲🇻', 'Indian/Maldives', 'beach'),
  e('mallorca', ["hRw1_JQMQoE"], 'Mallorca', { tr: 'Balear Adaları, İspanya', en: 'Balearic Islands, Spain' }, '🇪🇸', 'Europe/Madrid', 'beach'),
  e('altea', ["hvsK8Fvz4rE"], { tr: 'Altea Plajı', en: 'Altea Beach' }, { tr: 'Alicante, İspanya', en: 'Alicante, Spain' }, '🇪🇸', 'Europe/Madrid', 'beach'),
  e('gran-canaria', ["9EoWwXApQXk"], 'Gran Canaria', { tr: 'Kanarya Adaları, İspanya', en: 'Canary Islands, Spain' }, '🇪🇸', 'Atlantic/Canary', 'beach'),
  e('hvar', ["0wHWHAFnNh0"], 'Hvar', { tr: 'Hırvatistan', en: 'Croatia' }, '🇭🇷', 'Europe/Zagreb', 'beach'),
  e('rogoznica', ["iSbn8x3IUhs"], 'Rogoznica', { tr: 'Hırvatistan', en: 'Croatia' }, '🇭🇷', 'Europe/Zagreb', 'beach'),
  e('corfu', ["CcnlJI_UXyM"], { tr: 'Arillas, Korfu', en: 'Arillas, Corfu' }, { tr: 'Yunanistan', en: 'Greece' }, '🇬🇷', 'Europe/Athens', 'beach'),
  e('santorini', ["2a4SrvF0iS8"], 'Santorini', { tr: 'Yunanistan', en: 'Greece' }, '🇬🇷', 'Europe/Athens', 'beach'),
  e('caparica', ["oDbKeeojgyk"], 'Costa da Caparica', { tr: 'Portekiz', en: 'Portugal' }, '🇵🇹', 'Europe/Lisbon', 'beach'),
  e('scheveningen', ["A5kXiKzbBFs"], { tr: 'Scheveningen Sahili', en: 'Scheveningen Beach' }, { tr: 'Lahey, Hollanda', en: 'The Hague, Netherlands' }, '🇳🇱', 'Europe/Amsterdam', 'beach'),
  e('saundersfoot', ["W-ouHLSr3fc"], { tr: 'Saundersfoot Plajı', en: 'Saundersfoot Beach' }, { tr: 'Galler, Birleşik Krallık', en: 'Wales, UK' }, '🏴', 'Europe/London', 'beach'),
  e('lyall-bay', ["AajdfhglWd8"], { tr: 'Lyall Körfezi', en: 'Lyall Bay' }, { tr: 'Wellington, Yeni Zelanda', en: 'Wellington, New Zealand' }, '🇳🇿', 'Pacific/Auckland', 'beach'),
  e('sangay', ["BUFEHOQxQWQ"], { tr: 'Sangay Yanardağı', en: 'Sangay Volcano' }, { tr: 'Ekvador', en: 'Ecuador' }, '🌋', 'America/Guayaquil', 'nature'),
  e('mayon', ["UDAZWxehMAI"], { tr: 'Mayon Yanardağı', en: 'Mayon Volcano' }, { tr: 'Filipinler', en: 'Philippines' }, '🌋', 'Asia/Manila', 'nature'),
  e('reykjanes', ["U9QEbirKQx4"], { tr: 'Reykjanes Yanardağ Bölgesi', en: 'Reykjanes Volcano Area' }, { tr: 'İzlanda', en: 'Iceland' }, '🌋', 'Atlantic/Reykjavik', 'nature'),
  e('windermere', ["MK6MjpRLPWs"], { tr: 'Windermere Gölü', en: 'Lake Windermere' }, { tr: 'Göller Bölgesi, Birleşik Krallık', en: 'Lake District, UK' }, '🇬🇧', 'Europe/London', 'nature'),
  e('chocorua', ["2XptTNJC0ZU"], { tr: 'Chocorua Gölü', en: 'Chocorua Lake' }, { tr: 'New Hampshire, ABD', en: 'New Hampshire, USA' }, '🇺🇸', 'America/New_York', 'nature'),
  e('mirror-lake', ["jB4Iwn2GJS4"], 'Mirror Lake', { tr: 'Lake Placid, ABD', en: 'Lake Placid, USA' }, '🇺🇸', 'America/New_York', 'nature'),
  e('pigeon-river', ["6tq8S2pp8PQ"], { tr: 'Pigeon Nehri', en: 'Pigeon River' }, { tr: 'Tennessee, ABD', en: 'Tennessee, USA' }, '🇺🇸', 'America/New_York', 'nature'),
  e('ohio-river', ["MqzQdTHCTOg"], { tr: 'Ohio Nehri', en: 'Ohio River' }, { tr: 'Indiana, ABD', en: 'Indiana, USA' }, '🇺🇸', 'America/Kentucky/Louisville', 'nature'),
  e('dajia', ["fP4ecxfsJos"], { tr: 'Dajia Nehir Parkı', en: 'Dajia Riverside Park' }, { tr: 'Taipei, Tayvan', en: 'Taipei, Taiwan' }, '🇹🇼', 'Asia/Taipei', 'nature'),
  e('norway-fjord', ["z_5NCwXPSqM"], { tr: 'Norveç Kıyıları', en: 'Norwegian Coast' }, { tr: 'Norveç', en: 'Norway' }, '🇳🇴', 'Europe/Oslo', 'nature'),
  e('brooks-falls', ["EwTH5yY7Mks", "J7ZrIDvqlic"], { tr: 'Brooks Şelalesi Ayıları', en: 'Brooks Falls Bears' }, 'Katmai, Alaska', '🐻', 'America/Anchorage', 'animals'),
  e('riffles', ["z7_GhJeFxQI"], { tr: 'Riffles Ayı Kamerası', en: 'Riffles Bear Cam' }, 'Katmai, Alaska', '🐻', 'America/Anchorage', 'animals'),
  e('kats-river', ["cTsjMtjRLCo"], { tr: 'Nehir Kıyısı Ayıları', en: 'River View Bears' }, 'Katmai, Alaska', '🐻', 'America/Anchorage', 'animals'),
  e('anan', ["G839-Yj4Cvo", "ypMu3yA7h3s"], { tr: 'Anan Ayı Kamerası', en: 'Anan Bear Cam' }, { tr: 'Alaska, ABD', en: 'Alaska, USA' }, '🐻', 'America/Sitka', 'animals'),
  e('okaukuejo', ["JMMoRwYo5kE", "AeMUdOPFcXI", "fZ6mUUZJH8c"], { tr: 'Okaukuejo Su Kaynağı', en: 'Okaukuejo Waterhole' }, { tr: 'Etosha, Namibya', en: 'Etosha, Namibia' }, '🇳🇦', 'Africa/Windhoek', 'animals'),
  e('safarihoek', ["qwvk5hbEJnY"], { tr: 'Safarihoek Su Kaynağı', en: 'Safarihoek Waterhole' }, { tr: 'Namibya', en: 'Namibia' }, '🇳🇦', 'Africa/Windhoek', 'animals'),
  e('ol-donyo', ["XsOU8JnEpNM"], { tr: 'Ol Donyo Su Kaynağı', en: 'Ol Donyo Waterhole' }, 'Kenya', '🇰🇪', 'Africa/Nairobi', 'animals'),
  e('lentorre', ["bEmFpjwMOvs"], { tr: 'Lentorre Su Kaynağı', en: 'Lentorre Waterhole' }, 'Kenya', '🇰🇪', 'Africa/Nairobi', 'animals'),
  e('djuma', ["iUdDKf9aDUU"], { tr: 'Djuma Su Kaynağı', en: 'Djuma Waterhole' }, { tr: 'Güney Afrika', en: 'South Africa' }, '🇿🇦', 'Africa/Johannesburg', 'animals'),
  e('safari', ["xXZqU5vnEug"], { tr: 'Afrika Safarisi', en: 'African Safari' }, { tr: 'Afrika', en: 'Africa' }, '🌍', 'Africa/Johannesburg', 'animals'),
  e('tembe', ["0P_LBKqVbfs", "1njXY8scn0E"], { tr: 'Tembe Fil Parkı', en: 'Tembe Elephant Park' }, { tr: 'Güney Afrika', en: 'South Africa' }, '🐘', 'Africa/Johannesburg', 'animals'),
  e('red-pandas', ["dkFYrv1NFPg"], { tr: 'Kırmızı Pandalar', en: 'Red Pandas' }, { tr: 'Trevor Zoo, ABD', en: 'Trevor Zoo, USA' }, '🐼', 'America/New_York', 'animals'),
  e('penguins', ["HHp4rjhJsWI"], { tr: 'Penguenler', en: 'Penguins' }, { tr: 'Moody Gardens, Teksas', en: 'Moody Gardens, Texas' }, '🐧', 'America/Chicago', 'animals'),
  e('sea-otters', ["9mg9PoFEX2U"], { tr: 'Deniz Samurları', en: 'Sea Otters' }, { tr: 'Kanada', en: 'Canada' }, '🦦', 'America/Vancouver', 'animals'),
  e('big-bear-eagles', ["B4-L2nfGcuE", "41eq4VzCYc4"], { tr: 'Kel Kartal Yuvası', en: 'Bald Eagle Nest' }, { tr: 'Big Bear, Kaliforniya', en: 'Big Bear, California' }, '🦅', 'America/Los_Angeles', 'animals'),
  e('fl-eagles', ["GmQY04JqVj8", "UANvTm4J18M", "-_Xto6A2akM"], { tr: 'Florida Kartal Yuvası', en: 'Florida Eagle Nest' }, { tr: 'Florida, ABD', en: 'Florida, USA' }, '🦅', 'America/New_York', 'animals'),
  e('port-lincoln-osprey', ["xW1YcHVp7Ko"], { tr: 'Balık Kartalı Yuvası', en: 'Osprey Nest' }, { tr: 'Port Lincoln, Avustralya', en: 'Port Lincoln, Australia' }, '🦅', 'Australia/Adelaide', 'animals'),
  e('loch-lowes', ["EbA5WQane08"], { tr: 'Loch of the Lowes Balık Kartalları', en: 'Loch of the Lowes Ospreys' }, { tr: 'İskoçya', en: 'Scotland' }, '🦅', 'Europe/London', 'animals'),
  e('montana-osprey', ["nFgzhiA3WPg", "3VVoYO-ZFPE"], { tr: 'Montana Balık Kartalları', en: 'Montana Ospreys' }, 'Charlo, Montana', '🦅', 'America/Denver', 'animals'),
  e('skomer-puffins', ["Cj4bM-OoW9g"], { tr: 'Puffin Kolonisi', en: 'Puffin Colony' }, { tr: 'Skomer Adası, Galler', en: 'Skomer Island, Wales' }, '🐧', 'Europe/London', 'animals'),
  e('seal-island', ["EqVCjIa5brY"], { tr: 'Puffin Kayalıkları', en: 'Puffin Boulders' }, 'Seal Island, Maine', '🐧', 'America/New_York', 'animals'),
  e('loons', ["mFSGKt0sV60"], { tr: 'Dalgıç Kuşu Yuvası', en: 'Loon Nest' }, 'Lake Fairlee, Vermont', '🐦', 'America/New_York', 'animals'),
  e('forest-birds', ["RnCAl0mQgqA"], { tr: 'Orman Kuşları', en: 'Forest Birds' }, { tr: 'Danimarka', en: 'Denmark' }, '🐦', 'Europe/Copenhagen', 'animals'),
  e('critters', ["0cn-Y3Mfx3g", "F0GOOP82094", "oI8R4_UG3Fs"], { tr: 'Orman Canlıları', en: 'Woodland Critters' }, { tr: 'Kuzey Amerika', en: 'North America' }, '🦌', 'America/New_York', 'animals'),
  e('kittens', ["-m_nQT62B4Y", "gBdqOuhj2P4"], { tr: 'Kurtarılan Kedi Yavruları', en: 'Rescue Kittens' }, 'explore.org', '🐱', null, 'animals'),
  e('katahdin', ["lzHbycN2CmY"], { tr: 'Katahdin Dağı Gökyüzü', en: 'Mount Katahdin Sky' }, { tr: 'Maine, ABD', en: 'Maine, USA' }, '🌌', 'America/New_York', 'sky'),
  e('mauna-kea', ["Kj5DjRYkzD8"], { tr: 'Mauna Kea Gökyüzü', en: 'Mauna Kea Sky' }, { tr: 'Hawaii, ABD', en: 'Hawaii, USA' }, '🌌', 'Pacific/Honolulu', 'sky'),
  e('levi', ["rKfecmmzzw0"], { tr: 'Levi Kuzey Işıkları', en: 'Levi Northern Lights' }, { tr: 'Laponya, Finlandiya', en: 'Lapland, Finland' }, '🌌', 'Europe/Helsinki', 'sky'),
  e('lapland', ["pCpB5z99nC8", "OSO8eu9azsQ", "1oD5dQPXr1Q", "_zy6kB7W77I"], { tr: 'Kuzey Işıkları, Abisko', en: 'Aurora Cam, Abisko' }, { tr: 'Laponya, İsveç', en: 'Lapland, Sweden' }, '🌌', 'Europe/Stockholm', 'sky', 'UCx6-8cW9rHGNGhELh83fcCg'),
  e('utsjoki', ["9TjOeBK14-I", "_WtUWtodDVA"], { tr: 'Finlandiya Laponyası', en: 'Finnish Lapland' }, { tr: 'Finlandiya', en: 'Finland' }, '🌌', 'Europe/Helsinki', 'sky'),
  e('reykjavik-sky', ["9GZNvSw3kMg"], { tr: 'Reykjavik Gökyüzü', en: 'Reykjavik Sky' }, { tr: 'İzlanda', en: 'Iceland' }, '🌌', 'Atlantic/Reykjavik', 'sky'),
  e('zermatt', ["o9puACFGW0o", "JcHYcrO4PRE"], 'Matterhorn, Zermatt', { tr: 'İsviçre Alpleri', en: 'Swiss Alps' }, '🇨🇭', 'Europe/Zurich', 'mountain'),
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
  if (entry.video) out.push({ type: 'video', url: entry.video, key: 'video:' + entry.key }); // user's own video
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
