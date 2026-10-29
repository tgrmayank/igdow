const { getInstagramMedia } = require('../lib/snapsave');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const link = req.query.url;
  if (!link || !/instagram\.com\//i.test(link)) {
    return res.status(400).json({ status: false, error: 'Sahi Instagram link do (?url=...)' });
  }
  try {
    const data = await getInstagramMedia(link);
    if (!data.length) return res.status(404).json({ status: false, error: 'Koi video nahi mila. Post public hona chahiye.' });
    res.status(200).json({ status: true, data });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
};
