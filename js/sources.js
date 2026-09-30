// sources.js — tests every live cam source in the browser (the only place YouTube can be reached
// the way the real app reaches it) and reports which ones actually play.
import { CAMS, sourcesOf } from './cams.js';
import { LivePlayer } from './youtube.js';
import { store } from './settings.js';

const $ = (s) => document.querySelector(s);
const player = new LivePlayer($('#host'));
const rows = []; let stop = false; const results = {};

CAMS.forEach((cam, i) => {
  for (const src of sourcesOf(cam)) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i + 1}</td><td>${cam.flag} ${cam.name.tr}</td><td><code>${src.key}</code></td><td class="res">—</td>`;
    $('#rows').appendChild(tr);
    rows.push({ cam, src, cell: tr.querySelector('.res') });
  }
});
window.__sources = { results, rows: rows.length };

$('#run').addEventListener('click', async () => {
  stop = false; $('#run').disabled = true; $('#stop').disabled = false; $('#apply').disabled = true;
  let ok = 0, bad = 0;
  for (const r of rows) {
    if (stop) break;
    r.cell.className = 'res run'; r.cell.textContent = '…';
    $('#now').textContent = `${r.cam.name.tr} — ${r.src.key}`;
    const t0 = performance.now();
    try {
      const info = await player.play(r.src, 12000);
      const ms = Math.round(performance.now() - t0);
      results[r.src.key] = { ok: true, ms, live: info.live, cam: r.cam.key };
      r.cell.className = 'res ok'; r.cell.textContent = `✅ ${(ms / 1000).toFixed(1)} sn${info.live === false ? ' (kayıt, canlı değil)' : ''}`;
      ok++;
    } catch (err) {
      const code = (err && (err.code ?? err.message)) || '?';
      results[r.src.key] = { ok: false, code, cam: r.cam.key };
      r.cell.className = 'res bad'; r.cell.textContent = `❌ ${explain(code)}`;
      bad++;
      if (err instanceof Error && /^yt-api/.test(err.message)) { $('#now').textContent = 'YouTube API yüklenemedi — internet bağlantısını kontrol et.'; break; }
    }
    $('#summary').textContent = `✅ ${ok} çalışıyor · ❌ ${bad} çalışmıyor`;
  }
  player.stop();
  $('#run').disabled = false; $('#stop').disabled = true; $('#apply').disabled = false;
  $('#now').textContent = 'Bitti.';
  const working = {};
  for (const [key, r] of Object.entries(results)) if (r.ok) (working[r.cam] = working[r.cam] || []).push(key);
  $('#out').value = JSON.stringify({ tested: new Date().toISOString(), working, failed: Object.entries(results).filter(([, r]) => !r.ok).map(([k, r]) => ({ key: k, cam: r.cam, code: r.code })) }, null, 2);
});
$('#stop').addEventListener('click', () => { stop = true; });
$('#apply').addEventListener('click', () => {
  const dead = store.get('fw.dead', {});
  for (const [key, r] of Object.entries(results)) { if (r.ok) delete dead[key]; else dead[key] = Date.now(); }
  store.set('fw.dead', dead);
  $('#now').textContent = 'Uygulandı. Ana uygulama çalışmayanları 6 saat boyunca atlayacak.';
});

function explain(code) {
  return ({ 2: 'geçersiz ID', 5: 'oynatıcı hatası', 100: 'video yok/özel', 101: 'yerleştirme kapalı', 150: 'yerleştirme kapalı', 153: 'referans hatası (sayfayı http(s) üzerinden aç)', timeout: '12 sn içinde başlamadı', ended: 'yayın bitmiş' })[code] || String(code);
}
