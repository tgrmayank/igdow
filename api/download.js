const { Readable } = require('stream');
const { UA } = require('../lib/snapsave');

module.exports = async (req, res) => {
  const target = req.query.url;
  const name = String(req.query.name || 'instagram_video.mp4').replace(/[^\w.\-]/g, '_');
  if (!target || !/^https?:\/\//i.test(target)) return res.status(400).json({ error: 'bad url' });
  try {
    const up = await fetch(target, { headers: { 'user-agent': UA } });
    if (!up.ok || !up.body) return res.status(502).json({ error: 'Media server error ' + up.status });
    res.setHeader('Content-Type', up.headers.get('content-type') || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    const len = up.headers.get('content-length');
    if (len) res.setHeader('Content-Length', len);
    Readable.fromWeb(up.body).pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
