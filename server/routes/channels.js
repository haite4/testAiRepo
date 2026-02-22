const express = require('express');
const db = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// List channels for the logged-in user (bot_token excluded from response)
router.get('/', (req, res) => {
  const channels = db
    .prepare('SELECT id, name, channel_id FROM channels WHERE user_id = ?')
    .all(req.userId);
  res.json(channels);
});

// Add a channel
router.post('/', (req, res) => {
  const { name, channel_id, bot_token } = req.body;
  if (!name || !channel_id || !bot_token) {
    return res.status(400).json({ error: 'name, channel_id and bot_token are required' });
  }
  const result = db
    .prepare('INSERT INTO channels (user_id, name, channel_id, bot_token) VALUES (?, ?, ?, ?)')
    .run(req.userId, name, channel_id, bot_token);
  res.json({ id: result.lastInsertRowid, name, channel_id });
});

// Edit a channel
router.put('/:id', (req, res) => {
  const { name, channel_id, bot_token } = req.body;
  if (!name || !channel_id) {
    return res.status(400).json({ error: 'name and channel_id are required' });
  }
  const existing = db
    .prepare('SELECT id FROM channels WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);
  if (!existing) {
    return res.status(404).json({ error: 'Channel not found' });
  }
  if (bot_token) {
    db.prepare('UPDATE channels SET name = ?, channel_id = ?, bot_token = ? WHERE id = ? AND user_id = ?')
      .run(name, channel_id, bot_token, req.params.id, req.userId);
  } else {
    db.prepare('UPDATE channels SET name = ?, channel_id = ? WHERE id = ? AND user_id = ?')
      .run(name, channel_id, req.params.id, req.userId);
  }
  res.json({ id: Number(req.params.id), name, channel_id });
});

// Delete a channel
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM channels WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ success: true });
});

module.exports = router;
