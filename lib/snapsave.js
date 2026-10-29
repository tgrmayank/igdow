const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

/* ---------- SnapSave response decoder ---------- */
function decodeSnapApp(args) {
  let [h, u, n, t, e] = args;
  t = Number(t); e = Number(e);
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/'.split('');
  function toBase10(d, base) {
    const src = chars.slice(0, base);
    return d.split('').reverse().reduce((acc, ch, i) => {
      const idx = src.indexOf(ch);
      return idx !== -1 ? acc + idx * Math.pow(base, i) : acc;
    }, 0);
  }
  let r = '';
  for (let i = 0; i < h.length; i++) {
    let s = '';
    while (h[i] !== n[e]) { s += h[i]; i++; }
    for (let j = 0; j < n.length; j++) s = s.replace(new RegExp(n[j], 'g'), String(j));
    r += String.fromCharCode(toBase10(s, e) - t);
  }
  try { return decodeURIComponent(escape(r)); } catch { return r; }
}

function decodeResponse(text) {
  const marker = 'decodeURIComponent(escape(r))}(';
  if (!text.includes(marker)) return text;
  const argStr = text.split(marker)[1].split('))')[0];
  const args = argStr.split(',').map(v => v.replace(/"/g, '').trim());
  return decodeSnapApp(args);
}

function extractLinks(decoded) {
  const html = decoded
    .replace(/\\"/g, '"').replace(/\\\//g, '/').replace(/\\n/g, '\n')
    .replace(/\\\\/g, '\\').replace(/&amp;/g, '&');
  const hrefs = [...html.matchAll(/href="(https?:\/\/[^"]+)"/g)].map(m => m[1]);
  const imgs = [...html.matchAll(/<img[^>]+src="(https?:\/\/[^"]+)"/g)].map(m => m[1]);
  const bad = /snapsave\.app|play\.google|apps\.apple|facebook\.com|instagram\.com\/?$/i;
  const seen = new Set();
  const items = [];
  for (const url of hrefs) {
    if (bad.test(url) || seen.has(url)) continue;
    seen.add(url);
    items.push({ url, thumbnail: imgs[items.length] || imgs[0] || '' });
  }
  return items;
}

async function getInstagramMedia(link) {
  const body = new URLSearchParams({ url: link });
  const r = await fetch('https://snapsave.app/action.php?lang=en', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      origin: 'https://snapsave.app',
      referer: 'https://snapsave.app/',
      'user-agent': UA,
    },
    body,
  });
  if (!r.ok) throw new Error('SnapSave ne error diya: ' + r.status);
  const decoded = decodeResponse(await r.text());
  return extractLinks(decoded);
}


module.exports = { getInstagramMedia, UA };
