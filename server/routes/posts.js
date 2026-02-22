const express = require('express');
const db = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// Send a message to selected channels
router.post('/send', async (req, res) => {
  const { message, channelIds } = req.body;
  if (!message || !Array.isArray(channelIds) || channelIds.length === 0) {
    return res.status(400).json({ error: 'message and at least one channelId required' });
  }

  const placeholders = channelIds.map(() => '?').join(',');
  const channels = db
    .prepare(`SELECT * FROM channels WHERE id IN (${placeholders}) AND user_id = ?`)
    .all(...channelIds, req.userId);

  if (channels.length === 0) {
    return res.status(400).json({ error: 'No matching channels found' });
  }

  const results = await Promise.allSettled(
    channels.map(ch =>
      fetch(`https://api.telegram.org/bot${ch.bot_token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: ch.channel_id, text: message })
      }).then(r => r.json())
    )
  );

  const summary = results.map((r, i) => ({
    channel: channels[i].name,
    success: r.status === 'fulfilled' && r.value.ok === true,
    error: r.status === 'rejected' ? String(r.reason) : r.value?.description
  }));

  db.prepare('INSERT INTO posts (user_id, message, channels_sent) VALUES (?, ?, ?)').run(
    req.userId,
    message,
    JSON.stringify(channelIds)
  );

  res.json({ results: summary });
});

// Recent post history (last 20)
router.get('/history', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM posts WHERE user_id = ? ORDER BY sent_at DESC LIMIT 20')
    .all(req.userId);
  res.json(rows.map(r => ({ ...r, channels_sent: JSON.parse(r.channels_sent) })));
});

module.exports = router;
